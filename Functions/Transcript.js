const { AttachmentBuilder } = require('discord.js');

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function fetchAllMessages(channel) {
    const collected = [];
    let lastId = null;
    while (true) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const batch = await channel.messages.fetch(opts);
        if (!batch.size) break;
        collected.push(...batch.values());
        lastId = batch.last().id;
    }
    return collected.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function renderMessage(msg) {
    const authorName = escapeHtml(msg.member?.displayName || msg.author.globalName || msg.author.username);
    const avatarUrl = escapeHtml(
        (msg.member?.displayAvatarURL?.({ extension: 'png', size: 128 })) ||
        msg.author.displayAvatarURL({ extension: 'png', size: 128 })
    );
    const content = escapeHtml(msg.content || '[sem conteúdo]').replace(/\n/g, '<br>');
    const time = new Date(msg.createdTimestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const botBadge = msg.author.bot ? '<span class="badge-bot">BOT</span>' : '';

    const attachments = [...msg.attachments.values()].map(a => {
        const isImage = a.contentType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a.name || '');
        if (isImage) {
            return `<div class="attachment"><a href="${escapeHtml(a.url)}" target="_blank"><img class="attach-img" src="${escapeHtml(a.url)}" alt="${escapeHtml(a.name || 'imagem')}"></a></div>`;
        }
        return `<div class="attachment"><a href="${escapeHtml(a.url)}" target="_blank">📎 ${escapeHtml(a.name || 'arquivo')}</a></div>`;
    }).join('');

    const embedCount = msg.embeds?.length;
    const embedNote = embedCount ? `<div class="embed-note">*(${embedCount} embed${embedCount > 1 ? 's' : ''} omitido${embedCount > 1 ? 's' : ''})*</div>` : '';

    return `
    <article class="message">
      <img class="avatar" src="${avatarUrl}" alt="" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
      <div class="body">
        <div class="head">
          <span class="author">${authorName}</span>
          ${botBadge}
          <span class="time">${time}</span>
        </div>
        <div class="content">${content}</div>
        ${attachments}
        ${embedNote}
      </div>
    </article>`;
}

function buildHtml(channel, categoria, fechadoPor, messages) {
    const body = messages.map(renderMessage).join('\n');
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Transcript — ${escapeHtml(channel.name)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0f1115;color:#e8ecf1;font-family:Inter,'Segoe UI',Arial,sans-serif;padding:24px}
    .card{max-width:1100px;margin:0 auto;background:#181c23;border:1px solid #2a3140;border-radius:18px;overflow:hidden}
    .header{padding:28px 32px;border-bottom:1px solid #2a3140;background:#11151b}
    .header h1{font-size:20px;font-weight:700;margin-bottom:14px;color:#fff}
    .meta{color:#9aa4b2;line-height:2;font-size:14px}
    .meta span{color:#c9d1d9;font-weight:600}
    .messages{padding:20px 24px 28px}
    .message{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .message:last-child{border-bottom:0}
    .avatar{width:42px;height:42px;border-radius:50%;flex:0 0 auto;object-fit:cover}
    .head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
    .author{font-weight:700;font-size:15px}
    .badge-bot{background:#5865f2;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .time{color:#72767d;font-size:12px}
    .content{line-height:1.75;white-space:normal;word-break:break-word;color:#dcddde;font-size:14px}
    .attachment{margin-top:8px}
    .attach-img{max-width:400px;max-height:300px;border-radius:8px;display:block;margin-top:4px}
    .embed-note{color:#72767d;font-size:12px;font-style:italic;margin-top:4px}
    a{color:#7ab8ff;text-decoration:none}
    a:hover{text-decoration:underline}
    .footer{padding:16px 32px;border-top:1px solid #2a3140;background:#11151b;color:#72767d;font-size:12px;text-align:center}
  </style>
</head>
<body>
  <section class="card">
    <header class="header">
      <h1>📋 Transcript do Ticket</h1>
      <div class="meta">
        Servidor: <span>${escapeHtml(channel.guild?.name || '')}</span><br>
        Canal: <span>${escapeHtml(channel.name)}</span><br>
        Categoria: <span>${escapeHtml(categoria)}</span><br>
        Fechado por: <span>${escapeHtml(fechadoPor)}</span><br>
        Data: <span>${agora}</span><br>
        Total de mensagens: <span>${messages.length}</span>
      </div>
    </header>
    <main class="messages">
      ${body || '<p style="color:#72767d;padding:20px 0">Nenhuma mensagem encontrada.</p>'}
    </main>
    <div class="footer">Gerado automaticamente pelo sistema de tickets — ${agora}</div>
  </section>
</body>
</html>`;
}

async function createHtmlTranscript(channel, categoria, fechadoPor) {
    const messages = await fetchAllMessages(channel);
    const html = buildHtml(channel, categoria, fechadoPor, messages);
    const safeName = `transcript_${channel.id}_${Date.now()}.html`;
    return {
        attachment: new AttachmentBuilder(Buffer.from(html, 'utf8'), { name: safeName }),
        messageCount: messages.length,
        messages
    };
}

module.exports = { createHtmlTranscript };