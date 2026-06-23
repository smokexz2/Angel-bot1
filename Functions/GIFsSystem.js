





const { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { configuracao, EmojisHelper } = require("../database");
const { res } = require("../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

let dispatcherInterval = null;
const sentUrlsCache = new Set();
const MAX_CACHE = 500;

function btn(id, label, style, emojiKey) {
    const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
    const e = E(emojiKey);
    if (e) b.setEmoji(e);
    return b;
}


async function PainelGIFs(interaction, client) {
    const fonteCanal = configuracao.get('gifs.canalFonte');
    const destinoCanal = configuracao.get('gifs.canalDestino');
    const intervaloMin = configuracao.get('gifs.intervaloMin') || 30;
    const habilitado = configuracao.get('gifs.habilitado') || false;

    const fonteTxt = fonteCanal ? `<#${fonteCanal}>` : '`Não configurado`';
    const destinoTxt = destinoCanal ? `<#${destinoCanal}>` : '`Não configurado`';
    const statusTxt = habilitado ? `${E('ligado')} Habilitado` : `${E('desligado')} Desabilitado`;
    const podeHabilitar = !!(fonteCanal && destinoCanal);

    const row1 = new ActionRowBuilder().addComponents(
        btn('gifs_config_fonte', 'Canal Fonte', 2, 'logss'),
        btn('gifs_config_destino', 'Canal Destino', 2, 'logss'),
        btn('gifs_config_intervalo', `Intervalo: ${intervaloMin}min`, 2, 'relogio'),
    );
    const row2 = new ActionRowBuilder().addComponents(
        btn('gifs_toggle', habilitado ? 'Desativar GIFs' : 'Ativar GIFs', habilitado ? 4 : 3, habilitado ? 'desligado' : 'ligado'),
        btn('gifs_enviar_agora', 'Enviar Agora', 2, 'antena'),
        btn('voltarautomaticos', 'Voltar', 2, '_back_emoji'),
    );

    const container = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > GIFs Automáticos` },
        { type: 14 },
        { type: 10, content: `### ${E('antena') || '📡'} Sistema de GIFs Automáticos\nEnvia mídias do canal fonte para o canal destino automaticamente.` },
        { type: 14 },
        { type: 10, content: `> **Status:** ${statusTxt}\n> **Fonte:** ${fonteTxt}\n> **Destino:** ${destinoTxt}\n> **Intervalo:** ${intervaloMin} minutos` },
        { type: 14 },
        { type: 10, content: `-# Configure os canais para poder ativar o sistema.` }
    ).with({ components: [row1, row2], flags: [64] });

    if (interaction.message == null) interaction.reply(container);
    else interaction.update(container);
}


async function DespacharGIF(client) {
    const fonteCanal = configuracao.get('gifs.canalFonte');
    const destinoCanal = configuracao.get('gifs.canalDestino');
    const habilitado = configuracao.get('gifs.habilitado');

    if (!habilitado || !fonteCanal || !destinoCanal) return;

    try {
        const chFonte = await client.channels.fetch(fonteCanal).catch(() => null);
        const chDestino = await client.channels.fetch(destinoCanal).catch(() => null);
        if (!chFonte || !chDestino) return;

        
        const msgs = await chFonte.messages.fetch({ limit: 50 }).catch(() => null);
        if (!msgs || msgs.size === 0) return;

        
        const mediaMsgs = msgs.filter(m => {
            if (m.author.id === client.user.id) return false;
            const hasAttachment = m.attachments.some(a => {
                const url = a.url || '';
                return (url.endsWith('.gif') || url.endsWith('.mp4') || url.endsWith('.webm') ||
                        a.contentType?.startsWith('image') || a.contentType?.startsWith('video'));
            });
            const hasGifEmbed = m.embeds.some(e => e.type === 'gifv' || e.video);
            return (hasAttachment || hasGifEmbed) && !sentUrlsCache.has(m.id);
        });

        if (mediaMsgs.size === 0) return;

        
        const mediaArr = [...mediaMsgs.values()];
        const escolhida = mediaArr[Math.floor(Math.random() * mediaArr.length)];
        sentUrlsCache.add(escolhida.id);

        
        if (sentUrlsCache.size > MAX_CACHE) {
            const first = sentUrlsCache.values().next().value;
            sentUrlsCache.delete(first);
        }

        
        const files = [...escolhida.attachments.values()].map(a => a.url);
        const content = escolhida.content || '';

        if (files.length > 0) {
            await chDestino.send({ content: content || null, files: files.slice(0, 10) });
        } else if (escolhida.embeds.length > 0) {
            await chDestino.send({ content: escolhida.url || escolhida.embeds[0]?.url || '' });
        }
    } catch (e) {
        
    }
}

function StartGIFsDispatcher(client) {
    if (dispatcherInterval) clearInterval(dispatcherInterval);
    dispatcherInterval = null;

    const habilitado = configuracao.get('gifs.habilitado');
    if (!habilitado) return;

    const intervaloMin = configuracao.get('gifs.intervaloMin') || 30;
    const ms = intervaloMin * 60 * 1000;
    dispatcherInterval = setInterval(() => DespacharGIF(client), ms);
}


async function HandleGIFsButtons(interaction, client) {
    const cid = interaction.customId;

    if (cid === 'gifs_config_fonte') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > GIFs > Canal Fonte` },
            { type: 14 },
            { type: 10, content: `### Selecione o canal de onde as mídias serão lidas` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('gifs_select_fonte').setPlaceholder('Canal fonte...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('gifs_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'gifs_config_destino') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > GIFs > Canal Destino` },
            { type: 14 },
            { type: 10, content: `### Selecione o canal de destino para as mídias` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('gifs_select_destino').setPlaceholder('Canal destino...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('gifs_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'gifs_config_intervalo') {
        const modal = new ModalBuilder().setCustomId('gifs_modal_intervalo').setTitle('Configurar Intervalo');
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gifs_intervalo_valor').setLabel('Intervalo em minutos (mínimo: 5)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('30').setMaxLength(4)
        ));
        return interaction.showModal(modal);
    }
    if (cid === 'gifs_toggle') {
        const hab = configuracao.get('gifs.habilitado') || false;
        const fonteCanal = configuracao.get('gifs.canalFonte');
        const destinoCanal = configuracao.get('gifs.canalDestino');
        if (!hab && (!fonteCanal || !destinoCanal)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure os canais primeiro.` }).with({ flags: [64] }));
        }
        configuracao.set('gifs.habilitado', !hab);
        StartGIFsDispatcher(client);
        return PainelGIFs(interaction, client);
    }
    if (cid === 'gifs_enviar_agora') {
        await interaction.deferUpdate().catch(() => {});
        await DespacharGIF(client);
        return PainelGIFs(interaction, client);
    }
    if (cid === 'gifs_voltar_painel') return PainelGIFs(interaction, client);
}

async function HandleGIFsSelect(interaction, client) {
    const cid = interaction.customId;
    if (cid === 'gifs_select_fonte') {
        configuracao.set('gifs.canalFonte', interaction.values[0]);
        return PainelGIFs(interaction, client);
    }
    if (cid === 'gifs_select_destino') {
        configuracao.set('gifs.canalDestino', interaction.values[0]);
        return PainelGIFs(interaction, client);
    }
}

async function HandleGIFsModal(interaction, client) {
    if (interaction.customId === 'gifs_modal_intervalo') {
        const val = parseInt(interaction.fields.getTextInputValue('gifs_intervalo_valor'));
        if (isNaN(val) || val < 5) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Intervalo mínimo é 5 minutos.` }).with({ flags: [64] }));
        }
        configuracao.set('gifs.intervaloMin', val);
        StartGIFsDispatcher(client);
        return PainelGIFs(interaction, client);
    }
}

module.exports = { PainelGIFs, HandleGIFsButtons, HandleGIFsSelect, HandleGIFsModal, StartGIFsDispatcher, DespacharGIF };