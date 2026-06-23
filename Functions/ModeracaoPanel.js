const { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require("discord.js");
const { configuracao, EmojisHelper } = require("../database");
const { res } = require("../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

function btn(id, label, style, emojiKey) {
    const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
    const e = E(emojiKey);
    if (e) b.setEmoji(e);
    return b;
}

async function PainelModeracao(interaction, client) {
    const logCanal = configuracao.get('moderacao.logCanal');
    const reportCanal = configuracao.get('moderacao.reportCanal');
    const cargoMod = configuracao.get('moderacao.cargoMod');
    const habilitado = configuracao.get('moderacao.habilitado') || false;

    const logTxt = logCanal ? `<#${logCanal}>` : '`Não configurado`';
    const reportTxt = reportCanal ? `<#${reportCanal}>` : '`Não configurado`';
    const cargoTxt = cargoMod ? `<@&${cargoMod}>` : '`Não configurado`';
    const statusTxt = habilitado ? `${E('ligado')} Habilitado` : `${E('desligado')} Desabilitado`;

    const podeHabilitar = !!(logCanal && cargoMod);

    const row1 = new ActionRowBuilder().addComponents(
        btn('mod_config_logcanal', 'Canal de Logs', 2, 'logss'),
        btn('mod_config_reportcanal', 'Canal de Reports', 2, 'logss'),
        btn('mod_config_cargo', 'Cargo Moderador', 2, 'cargovery'),
    );
    const row2 = new ActionRowBuilder().addComponents(
        btn('mod_warn_thresholds', '⚠️ Punições por Warns', 2, '_settings_emoji'),
        btn('mod_toggle', habilitado ? 'Desabilitar Moderação' : 'Habilitar Moderação', habilitado ? 4 : 3, habilitado ? 'desligado' : 'ligado'),
    );
    const row3 = new ActionRowBuilder().addComponents(
        btn('voltarconfigs', 'Voltar', 2, '_back_emoji'),
    );

    const container = res.main(
        { type: 10, content: `-# Painel > Moderação` },
        { type: 14 },
        { type: 10, content: `### ${E('negative') || '🛡️'} Sistema de Moderação\nComandos: \`/ban\`, \`/kick\`, \`/mute\`, \`/unmute\`, \`/tempban\`, \`/unban\`, \`/softban\`, \`/slowmode\`, \`/warn\`, \`/warns\`, \`/report\`, \`/lock\`, \`/unlock\`, \`/call\`` },
        { type: 14 },
        { type: 10, content: `> **Status:** ${statusTxt}\n> **Log:** ${logTxt}\n> **Reports:** ${reportTxt}\n> **Cargo Mod:** ${cargoTxt}` },
        { type: 14 },
        { type: 10, content: `-# Configure o canal de logs e cargo para habilitar.\n-# Punições por Warns: defina ações automáticas ao atingir X avisos.` }
    ).with({ components: [row1, row2, row3], flags: [64] });

    if (interaction.message == null) interaction.reply(container);
    else interaction.update(container);
}

async function ModConfigLogCanal(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId('mod_select_logcanal').setPlaceholder('Selecione o canal de logs...').setChannelTypes(ChannelType.GuildText)
    );
    const rowV = new ActionRowBuilder().addComponents(btn('mod_voltar_painel', 'Voltar', 2, '_back_emoji'));
    interaction.update(res.main(
        { type: 10, content: `-# Painel > Moderação > Canal de Logs` },
        { type: 14 },
        { type: 10, content: `### ${E('logss') || '📋'} Configurar Canal de Logs\nSelecione o canal onde as ações de moderação serão registradas.` }
    ).with({ components: [row, rowV], flags: [64] }));
}

async function ModConfigReportCanal(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId('mod_select_reportcanal').setPlaceholder('Selecione o canal de reports...').setChannelTypes(ChannelType.GuildText)
    );
    const rowV = new ActionRowBuilder().addComponents(btn('mod_voltar_painel', 'Voltar', 2, '_back_emoji'));
    interaction.update(res.main(
        { type: 10, content: `-# Painel > Moderação > Canal de Reports` },
        { type: 14 },
        { type: 10, content: `### ${E('logss') || '📋'} Configurar Canal de Reports\nSelecione o canal onde os reports dos usuários serão enviados.` }
    ).with({ components: [row, rowV], flags: [64] }));
}

async function ModConfigCargo(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId('mod_select_cargo').setPlaceholder('Selecione o cargo moderador...')
    );
    const rowV = new ActionRowBuilder().addComponents(btn('mod_voltar_painel', 'Voltar', 2, '_back_emoji'));
    interaction.update(res.main(
        { type: 10, content: `-# Painel > Moderação > Cargo Moderador` },
        { type: 14 },
        { type: 10, content: `### ${E('cargovery') || '🛡️'} Configurar Cargo Moderador\nSelecione o cargo que identifica os moderadores do servidor.` }
    ).with({ components: [row, rowV], flags: [64] }));
}

async function ModToggle(interaction, client) {
    const habilitado = configuracao.get('moderacao.habilitado') || false;
    const logCanal = configuracao.get('moderacao.logCanal');
    const cargoMod = configuracao.get('moderacao.cargoMod');
    if (!habilitado && (!logCanal || !cargoMod)) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure o canal de logs e o cargo moderador primeiro.` }).with({ flags: [64] }));
    }
    configuracao.set('moderacao.habilitado', !habilitado);
    PainelModeracao(interaction, client);
}

async function HandleModSelect(interaction, client) {
    const cid = interaction.customId;

    if (cid === 'mod_select_logcanal') {
        configuracao.set('moderacao.logCanal', interaction.values[0]);
        return PainelModeracao(interaction, client);
    }
    if (cid === 'mod_select_reportcanal') {
        configuracao.set('moderacao.reportCanal', interaction.values[0]);
        return PainelModeracao(interaction, client);
    }
    if (cid === 'mod_select_cargo') {
        configuracao.set('moderacao.cargoMod', interaction.values[0]);
        return PainelModeracao(interaction, client);
    }
}

module.exports = { PainelModeracao, ModConfigLogCanal, ModConfigReportCanal, ModConfigCargo, ModToggle, HandleModSelect };