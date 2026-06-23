




const { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
let createCanvas = null;
try { createCanvas = require("canvas").createCanvas; } catch {}
const { configuracao, EmojisHelper } = require("../database");
const { res } = require("../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };


const ANIMAL_BANK = [
    { emoji: '🐶', answer: 'cachorro', label: 'Cachorro' },
    { emoji: '🐱', answer: 'gato', label: 'Gato' },
    { emoji: '🐰', answer: 'coelho', label: 'Coelho' },
    { emoji: '🦊', answer: 'raposa', label: 'Raposa' },
    { emoji: '🐼', answer: 'panda', label: 'Panda' },
    { emoji: '🐸', answer: 'sapo', label: 'Sapo' },
    { emoji: '🐵', answer: 'macaco', label: 'Macaco' },
    { emoji: '🐯', answer: 'tigre', label: 'Tigre' },
    { emoji: '🦁', answer: 'leao', label: 'Leao' },
    { emoji: '🐨', answer: 'coala', label: 'Coala' },
];


const activeChallenges = new Map(); 
const userAttempts = new Map();     


function btn(id, label, style, emoji) {
    const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
    if (emoji) b.setEmoji(emoji);
    return b;
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickChallenge() {
    const animal = ANIMAL_BANK[Math.floor(Math.random() * ANIMAL_BANK.length)];
    const decoys = shuffle(ANIMAL_BANK.filter(a => a.answer !== animal.answer)).slice(0, 3);
    const options = shuffle([animal, ...decoys]);
    return { animal, options };
}


function generateCaptchaImage(text) {
    if (!createCanvas) return null;
    try {
        const canvas = createCanvas(320, 100);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 320, 100);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 320, 100);

        for (let i = 0; i < 8; i++) {
            ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.15 + 0.05})`;
            ctx.lineWidth = Math.random() * 1.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * 320, Math.random() * 100);
            ctx.lineTo(Math.random() * 320, Math.random() * 100);
            ctx.stroke();
        }

        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * 320, Math.random() * 100, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letters = text.toUpperCase().split('');
        letters.forEach((letter, i) => {
            const x = 30 + i * 36 + Math.random() * 8 - 4;
            const y = 50 + Math.random() * 12 - 6;
            const angle = (Math.random() - 0.5) * 0.3;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            const h = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${h}, 80%, 70%)`;
            ctx.fillText(letter, 0, 0);
            ctx.restore();
        });

        return canvas.toBuffer('image/png');
    } catch { return null; }
}

function randomCaptchaWord() {
    const words = ['DELTA', 'NEXUS', 'BLAZE', 'STORM', 'FROST', 'SOLAR', 'VAPOR', 'LUNAR', 'CRYPT', 'PRISM'];
    return words[Math.floor(Math.random() * words.length)];
}


async function PainelVerificacao(interaction, client) {
    const verifyCanal = configuracao.get('verificacao.canal');
    const unverifiedRole = configuracao.get('verificacao.cargoNaoVerificado');
    const verifiedRole = configuracao.get('verificacao.cargoVerificado');
    const logCanal = configuracao.get('verificacao.logCanal');
    const habilitado = configuracao.get('verificacao.habilitado') || false;
    const modo = configuracao.get('verificacao.modo') || 'botoes';

    const canalTxt = verifyCanal ? `<#${verifyCanal}>` : '`Não configurado`';
    const unverTxt = unverifiedRole ? `<@&${unverifiedRole}>` : '`Não configurado`';
    const verTxt = verifiedRole ? `<@&${verifiedRole}>` : '`Não configurado`';
    const logTxt = logCanal ? `<#${logCanal}>` : '`Não configurado`';
    const statusTxt = habilitado ? `${E('ligado')} Habilitado` : `${E('desligado')} Desabilitado`;
    const modoTxt = modo === 'botoes' ? '🔘 Botões (Animal)' : modo === 'imagem' ? '🖼️ Imagem (Texto)' : '🔘 Botões';

    const podeHabilitar = !!(verifyCanal && verifiedRole);

    const row1 = new ActionRowBuilder().addComponents(
        btn('verif_config_canal', 'Canal de Verificação', 2, 'logss'),
        btn('verif_config_unverole', 'Cargo Não Verificado', 2, 'cargovery'),
        btn('verif_config_verrole', 'Cargo Verificado', 2, 'cargovery'),
    );
    const row2 = new ActionRowBuilder().addComponents(
        btn('verif_config_logcanal', 'Canal de Logs', 2, 'logss'),
        btn('verif_config_modo', `Modo: ${modoTxt}`, 2, '_settings_emoji'),
    );
    const row3 = new ActionRowBuilder().addComponents(
        btn('verif_enviar_painel', 'Enviar Painel no Canal', 3, 'ligado'),
        btn('verif_toggle', habilitado ? 'Desabilitar' : 'Habilitar', habilitado ? 4 : 3, habilitado ? 'desligado' : 'ligado'),
        btn('voltarconfigs', 'Voltar', 2, '_back_emoji'),
    );

    const container = res.main(
        { type: 10, content: `-# Painel > Verificação` },
        { type: 14 },
        { type: 10, content: `### ${E('sucesso') || '🛡️'} Sistema de Verificação por Captcha` },
        { type: 14 },
        { type: 10, content: `> **Status:** ${statusTxt}\n> **Canal:** ${canalTxt}\n> **Cargo Não Verificado:** ${unverTxt}\n> **Cargo Verificado:** ${verTxt}\n> **Log:** ${logTxt}\n> **Modo:** ${modoTxt}` },
        { type: 14 },
        { type: 10, content: `-# Configure o canal e o cargo verificado para habilitar.` }
    ).with({ components: [row1, row2, row3], flags: [64] });

    if (interaction.message == null) interaction.reply(container);
    else interaction.update(container);
}

async function EnviarPainelVerificacao(interaction, client) {
    const verifyCanal = configuracao.get('verificacao.canal');
    if (!verifyCanal) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure o canal de verificação primeiro.` }).with({ flags: [64] }));
    }

    try {
        const ch = await client.channels.fetch(verifyCanal);
        const title = configuracao.get('verificacao.titulo') || 'Verificação do Servidor';
        const desc = configuracao.get('verificacao.descricao') || 'Clique no botão abaixo para iniciar sua verificação e liberar o acesso ao servidor.';

        const rowVerif = new ActionRowBuilder().addComponents(
            btn('verif_iniciar', '✅ Verificar', ButtonStyle.Success)
        );

        await ch.send(res.main(
            { type: 10, content: `### ${E('sucesso') || '🔒'} ${title}` },
            { type: 14 },
            { type: 10, content: desc },
            { type: 14 },
            { type: 10, content: `-# Clique no botão para iniciar o processo de verificação.` }
        ).with({ components: [rowVerif] }));

        interaction.reply(res.main(
            { type: 10, content: `${E('checker') || '✅'} Painel de verificação enviado em <#${verifyCanal}>!` }
        ).with({ flags: [64] }));
    } catch (e) {
        interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
    }
}


async function IniciarVerificacao(interaction, client) {
    const verifiedRole = configuracao.get('verificacao.cargoVerificado');
    const unverifiedRole = configuracao.get('verificacao.cargoNaoVerificado');
    const habilitado = configuracao.get('verificacao.habilitado');
    const maxTentativas = configuracao.get('verificacao.maxTentativas') || 5;

    if (!habilitado) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} O sistema de verificação está desabilitado.` }).with({ flags: [64] }));
    }

    const member = interaction.member;

    
    if (verifiedRole && member.roles.cache.has(verifiedRole)) {
        return interaction.reply(res.main({ type: 10, content: `${E('checker') || '✅'} Você já está verificado!` }).with({ flags: [64] }));
    }

    
    const tentativas = userAttempts.get(interaction.user.id) || 0;
    if (tentativas >= maxTentativas) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Você excedeu o número máximo de tentativas. Entre em contato com um moderador.` }).with({ flags: [64] }));
    }

    const modo = configuracao.get('verificacao.modo') || 'botoes';

    if (modo === 'imagem') {
        await IniciarCaptchaImagem(interaction, client);
    } else {
        await IniciarCaptchaBotoes(interaction, client);
    }
}

async function IniciarCaptchaBotoes(interaction, client) {
    const { animal, options } = pickChallenge();
    activeChallenges.set(interaction.user.id, { answer: animal.answer, attempts: 0, expires: Date.now() + 3 * 60 * 1000, mode: 'botoes' });

    const row = new ActionRowBuilder().addComponents(
        ...options.map(opt => btn(`verif_resposta_${opt.answer}`, `${opt.emoji} ${opt.label}`, 2))
    );

    await interaction.reply(res.main(
        { type: 10, content: `-# Verificação` },
        { type: 14 },
        { type: 10, content: `### ${E('sucesso') || '🔒'} Desafio de Verificação\nIdentifique o animal na descrição e clique no botão correto:\n\n**Qual é este animal? ${animal.emoji}**` },
        { type: 14 },
        { type: 10, content: `-# Você tem 3 minutos para responder.` }
    ).with({ components: [row], flags: [64] }));
}

async function IniciarCaptchaImagem(interaction, client) {
    const word = randomCaptchaWord();
    activeChallenges.set(interaction.user.id, { answer: word.toLowerCase(), attempts: 0, expires: Date.now() + 3 * 60 * 1000, mode: 'imagem' });

    const imgBuffer = generateCaptchaImage(word);

    if (!imgBuffer) {
        return IniciarCaptchaBotoes(interaction, client);
    }

    const { AttachmentBuilder } = require('discord.js');
    const attachment = new AttachmentBuilder(imgBuffer, { name: 'captcha.png' });

    const modal = new ModalBuilder()
        .setCustomId('verif_modal_imagem')
        .setTitle('Verificação por Imagem')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('verif_texto_captcha').setLabel('Digite o texto da imagem').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
            )
        );

    try {
        await interaction.channel.send({ files: [attachment], content: `<@${interaction.user.id}>, resolva o captcha acima para se verificar. Você tem 3 minutos.` });
        await interaction.showModal(modal);
    } catch {
        await IniciarCaptchaBotoes(interaction, client);
    }
}


async function ProcessarRespostaVerificacao(interaction, client, resposta) {
    const challenge = activeChallenges.get(interaction.user.id);

    if (!challenge || Date.now() > challenge.expires) {
        activeChallenges.delete(interaction.user.id);
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Desafio expirado. Clique em Verificar novamente.` }).with({ flags: [64] }));
    }

    const correto = resposta.toLowerCase().trim() === challenge.answer.toLowerCase().trim();

    if (correto) {
        activeChallenges.delete(interaction.user.id);
        userAttempts.delete(interaction.user.id);
        await AplicarVerificacao(interaction, client);
    } else {
        challenge.attempts++;
        const maxTentativas = configuracao.get('verificacao.maxTentativas') || 5;
        const tentativas = (userAttempts.get(interaction.user.id) || 0) + 1;
        userAttempts.set(interaction.user.id, tentativas);

        if (tentativas >= maxTentativas) {
            activeChallenges.delete(interaction.user.id);
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Você excedeu o limite de tentativas. Entre em contato com um moderador.` }).with({ flags: [64] }));
        }

        const restantes = maxTentativas - tentativas;
        const rowRetry = new ActionRowBuilder().addComponents(
            btn('verif_iniciar', '🔄 Tentar Novamente', ButtonStyle.Secondary)
        );
        interaction.reply(res.main(
            { type: 10, content: `${E('negative')} Resposta incorreta! Tentativas restantes: **${restantes}**` }
        ).with({ components: [rowRetry], flags: [64] }));
    }
}

async function AplicarVerificacao(interaction, client) {
    const verifiedRole = configuracao.get('verificacao.cargoVerificado');
    const unverifiedRole = configuracao.get('verificacao.cargoNaoVerificado');
    const logCanal = configuracao.get('verificacao.logCanal');
    const successMsg = configuracao.get('verificacao.msgSucesso') || 'Verificação concluída com sucesso! Bem-vindo(a)!';

    try {
        if (verifiedRole) await interaction.member.roles.add(verifiedRole).catch(() => {});
        if (unverifiedRole) await interaction.member.roles.remove(unverifiedRole).catch(() => {});

        await interaction.reply(res.main(
            { type: 10, content: `### ${E('checker') || '✅'} Verificação Concluída!\n${successMsg}` }
        ).with({ flags: [64] }));

        if (logCanal) {
            try {
                const ch = await client.channels.fetch(logCanal);
                if (ch) await ch.send(res.main(
                    { type: 10, content: `-# Verificação > Log` },
                    { type: 14 },
                    { type: 10, content: `### ${E('checker') || '✅'} Usuário Verificado\n> **Usuário:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n> **Quando:** <t:${Math.floor(Date.now()/1000)}:R>` }
                ));
            } catch {}
        }
    } catch (e) {
        interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro ao aplicar verificação: \`${e.message}\`` }).with({ flags: [64] }));
    }
}


async function HandleVerifSelect(interaction, client) {
    const cid = interaction.customId;
    if (cid === 'verif_select_canal') {
        configuracao.set('verificacao.canal', interaction.values[0]);
        return PainelVerificacao(interaction, client);
    }
    if (cid === 'verif_select_unverole') {
        configuracao.set('verificacao.cargoNaoVerificado', interaction.values[0]);
        return PainelVerificacao(interaction, client);
    }
    if (cid === 'verif_select_verrole') {
        configuracao.set('verificacao.cargoVerificado', interaction.values[0]);
        return PainelVerificacao(interaction, client);
    }
    if (cid === 'verif_select_logcanal') {
        configuracao.set('verificacao.logCanal', interaction.values[0]);
        return PainelVerificacao(interaction, client);
    }
}

async function HandleVerifButtons(interaction, client) {
    const cid = interaction.customId;

    if (cid === 'verif_config_canal') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Verificação > Canal` },
            { type: 14 },
            { type: 10, content: `### Selecione o canal de verificação` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('verif_select_canal').setPlaceholder('Canal de verificação...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('verif_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'verif_config_unverole') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Verificação > Cargo Não Verificado` },
            { type: 14 },
            { type: 10, content: `### Selecione o cargo de não verificado` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('verif_select_unverole').setPlaceholder('Cargo não verificado...')),
                new ActionRowBuilder().addComponents(btn('verif_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'verif_config_verrole') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Verificação > Cargo Verificado` },
            { type: 14 },
            { type: 10, content: `### Selecione o cargo de verificado` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('verif_select_verrole').setPlaceholder('Cargo verificado...')),
                new ActionRowBuilder().addComponents(btn('verif_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'verif_config_logcanal') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Verificação > Canal de Logs` },
            { type: 14 },
            { type: 10, content: `### Selecione o canal de logs de verificação` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('verif_select_logcanal').setPlaceholder('Canal de logs...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('verif_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'verif_config_modo') {
        const atual = configuracao.get('verificacao.modo') || 'botoes';
        const novo = atual === 'botoes' ? 'imagem' : 'botoes';
        configuracao.set('verificacao.modo', novo);
        return PainelVerificacao(interaction, client);
    }
    if (cid === 'verif_voltar_painel') return PainelVerificacao(interaction, client);
    if (cid === 'verif_toggle') {
        const hab = configuracao.get('verificacao.habilitado') || false;
        const verifyCanal = configuracao.get('verificacao.canal');
        const verifiedRole = configuracao.get('verificacao.cargoVerificado');
        if (!hab && (!verifyCanal || !verifiedRole)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure o canal e o cargo verificado primeiro.` }).with({ flags: [64] }));
        }
        configuracao.set('verificacao.habilitado', !hab);
        return PainelVerificacao(interaction, client);
    }
    if (cid === 'verif_enviar_painel') return EnviarPainelVerificacao(interaction, client);
    if (cid === 'verif_iniciar') return IniciarVerificacao(interaction, client);

    if (cid.startsWith('verif_resposta_')) {
        const resposta = cid.replace('verif_resposta_', '');
        return ProcessarRespostaVerificacao(interaction, client, resposta);
    }
}

async function HandleVerifModal(interaction, client) {
    if (interaction.customId === 'verif_modal_imagem') {
        const texto = interaction.fields.getTextInputValue('verif_texto_captcha');
        return ProcessarRespostaVerificacao(interaction, client, texto);
    }
}

module.exports = {
    PainelVerificacao,
    EnviarPainelVerificacao,
    IniciarVerificacao,
    HandleVerifButtons,
    HandleVerifSelect,
    HandleVerifModal,
    activeChallenges,
    userAttempts
};