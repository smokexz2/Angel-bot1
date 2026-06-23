













const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const { SystemMod, configuracao, EmojisHelper } = require('../database');
const { res } = require('../res');
const { schedulePunishment } = require('./PunishmentScheduler');
const ms = require('ms');

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

function getThresholds(guildId) {
    return SystemMod.get(`warnThresholds.${guildId}`) || [];
}

function setThresholds(guildId, arr) {
    SystemMod.set(`warnThresholds.${guildId}`, arr);
}

const ACTION_LABELS = {
    mute: '🔇 Mute',
    kick: '👟 Kick',
    tempban: '⏳ Ban Temporário',
    ban: '🔨 Ban Permanente',
};


async function PainelWarnThresholds(interaction, client) {
    const guildId = interaction.guild.id;
    const thresholds = getThresholds(guildId);

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mod_voltar_painel').setLabel('Voltar').setStyle(2).setEmoji('⬅️')
    );

    const thresholdLines = thresholds.length === 0
        ? '> *Nenhum threshold configurado.*'
        : thresholds
            .sort((a, b) => a.warns - b.warns)
            .map(t => `> **${t.warns} warns** → ${ACTION_LABELS[t.action] || t.action}${t.duration ? ` por \`${t.duration}\`` : ''}`)
            .join('\n');

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('warnth_add').setLabel('Adicionar Threshold').setStyle(1).setEmoji('➕'),
        new ButtonBuilder().setCustomId('warnth_remove').setLabel('Remover Threshold').setStyle(4).setEmoji('🗑️').setDisabled(thresholds.length === 0),
    );

    const container = res.main(
        { type: 10, content: `-# Moderação > Punições por Warns` },
        { type: 14 },
        { type: 10, content: `### ⚠️ Punições Automáticas por Warns\n\nConfigure quais punições são aplicadas automaticamente quando um usuário acumula avisos.` },
        { type: 14 },
        { type: 10, content: `**Thresholds configurados:**\n${thresholdLines}` },
        { type: 14 },
        { type: 10, content: `-# Dica: quando o usuário atingir o número de warns, a punição é aplicada automaticamente.` }
    ).with({ components: [rowBotoes, rowVoltar], flags: [64] });

    try {
        if (interaction.replied || interaction.deferred) await interaction.editReply(container);
        else await interaction.update(container);
    } catch { try { await interaction.reply(container); } catch {} }
}

async function ModalAddThreshold(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('warnth_modal_add')
        .setTitle('Adicionar Threshold de Warn')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('wt_warns').setLabel('Quantidade de warns').setPlaceholder('Ex: 3').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('wt_action').setLabel('Ação (mute / kick / tempban / ban)').setPlaceholder('mute').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('wt_duration').setLabel('Duração (ex: 1h, 1d) — deixe vazio pra permanente').setPlaceholder('1h').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
            )
        );
    await interaction.showModal(modal);
}

async function HandleAddThresholdModal(interaction, client) {
    const guildId = interaction.guild.id;
    const warnsRaw = interaction.fields.getTextInputValue('wt_warns').trim();
    const action = interaction.fields.getTextInputValue('wt_action').trim().toLowerCase();
    const durationRaw = interaction.fields.getTextInputValue('wt_duration').trim();

    const warns = parseInt(warnsRaw);
    if (isNaN(warns) || warns <= 0) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Quantidade de warns inválida.` }).with({ flags: [64] }));
    }

    const validActions = ['mute', 'kick', 'tempban', 'ban'];
    if (!validActions.includes(action)) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Ação inválida. Use: \`mute\`, \`kick\`, \`tempban\`, \`ban\`.` }).with({ flags: [64] }));
    }

    let duration = null;
    if (durationRaw) {
        const durMs = ms(durationRaw);
        if (!durMs || isNaN(durMs)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Duração inválida. Exemplos: \`1h\`, \`1d\`, \`7d\`.` }).with({ flags: [64] }));
        }
        if ((action === 'mute') && durMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Mute máx 28 dias.` }).with({ flags: [64] }));
        }
        duration = durationRaw;
    }

    const thresholds = getThresholds(guildId);
    const existing = thresholds.findIndex(t => t.warns === warns);
    if (existing >= 0) thresholds.splice(existing, 1);
    thresholds.push({ warns, action, duration, label: `${warns} warns → ${ACTION_LABELS[action]}${duration ? ` por ${duration}` : ''}` });
    setThresholds(guildId, thresholds);

    await interaction.reply(res.main({ type: 10, content: `${E('checker') || '✅'} Threshold adicionado: **${warns} warns → ${ACTION_LABELS[action]}${duration ? ` por \`${duration}\`` : ''}**` }).with({ flags: [64] }));
    setTimeout(() => PainelWarnThresholds(interaction, client).catch(() => {}), 1200);
}

async function HandleRemoveThreshold(interaction, client) {
    const guildId = interaction.guild.id;
    const thresholds = getThresholds(guildId);

    if (thresholds.length === 0) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Nenhum threshold para remover.` }).with({ flags: [64] }));
    }

    const options = thresholds.sort((a, b) => a.warns - b.warns).map(t => ({
        label: `${t.warns} warns → ${ACTION_LABELS[t.action] || t.action}${t.duration ? ` por ${t.duration}` : ''}`,
        value: String(t.warns),
        description: t.action
    }));

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('warnth_select_remove').setPlaceholder('Selecione o threshold para remover').addOptions(options)
    );
    const rowCancelar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('warnth_cancelremove').setLabel('Cancelar').setStyle(2)
    );

    const container = res.main(
        { type: 10, content: `### 🗑️ Remover Threshold\nSelecione qual threshold remover:` }
    ).with({ components: [row, rowCancelar], flags: [64] });

    try {
        if (interaction.replied || interaction.deferred) await interaction.editReply(container);
        else await interaction.update(container);
    } catch { try { await interaction.reply(container); } catch {} }
}

async function HandleSelectRemoveThreshold(interaction, client) {
    const guildId = interaction.guild.id;
    const warns = parseInt(interaction.values[0]);
    const thresholds = getThresholds(guildId);
    const newList = thresholds.filter(t => t.warns !== warns);
    setThresholds(guildId, newList);

    await interaction.update(res.main({ type: 10, content: `${E('checker') || '✅'} Threshold de **${warns} warns** removido.` }).with({ flags: [64] }));
    setTimeout(() => PainelWarnThresholds(interaction, client).catch(() => {}), 1200);
}


async function checkAndApplyThresholds({ client, interaction, target, warnCount, guildId }) {
    const thresholds = getThresholds(guildId)
        .filter(t => t.warns === warnCount)
        .sort((a, b) => a.warns - b.warns);

    if (thresholds.length === 0) return null;

    const threshold = thresholds[0];
    const { action, duration } = threshold;
    const guild = interaction.guild;
    const reason = `Atingiu ${warnCount} warn(s) — punição automática`;
    const durMs = duration ? ms(duration) : null;

    try {
        const member = await guild.members.fetch(target.id).catch(() => null);

        if (action === 'mute') {
            if (!member || !member.moderatable) return null;
            if (!durMs) return null;
            await member.timeout(durMs, reason);

        } else if (action === 'kick') {
            if (!member || !member.kickable) return null;
            await member.kick(reason);

        } else if (action === 'tempban') {
            if (member && !member.bannable) return null;
            const expiresAt = Date.now() + (durMs || 86400000);
            schedulePunishment({ client, type: 'tempban', userId: target.id, guildId, expiresAt, reason });
            await guild.members.ban(target, { reason: `[TempBan ${duration}] ${reason}` });

        } else if (action === 'ban') {
            if (member && !member.bannable) return null;
            await guild.members.ban(target, { reason });
        }

        try { await target.send(`${E('negative') || '⚠️'} Você recebeu uma punição automática no servidor **${guild.name}** por acumular **${warnCount} aviso(s)**.\n**Punição:** ${ACTION_LABELS[action]}${duration ? ` por \`${duration}\`` : ''}`); } catch {}

        const logCanalId = configuracao.get('moderacao.logCanal');
        if (logCanalId) {
            try {
                const ch = await client.channels.fetch(logCanalId);
                if (ch) await ch.send(res.main(
                    { type: 10, content: `-# Moderação > Punição Automática` },
                    { type: 14 },
                    { type: 10, content: `### ⚠️ Punição Automática Aplicada\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Warns:** ${warnCount}\n> **Punição:** ${ACTION_LABELS[action]}${duration ? ` por \`${duration}\`` : ''}\n> **Motivo:** ${reason}` }
                ));
            } catch {}
        }

        return `\n-# ⚠️ Punição automática aplicada: **${ACTION_LABELS[action]}${duration ? ` por \`${duration}\`` : ''}** (${warnCount} warns)`;
    } catch (err) {
        console.error('[WarnThresholds] Erro ao aplicar punição:', err.message);
        return null;
    }
}

module.exports = {
    PainelWarnThresholds,
    ModalAddThreshold,
    HandleAddThresholdModal,
    HandleRemoveThreshold,
    HandleSelectRemoveThreshold,
    checkAndApplyThresholds,
    getThresholds,
};