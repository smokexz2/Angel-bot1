const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { configuracao, SystemMod, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

function logMod(type, mod, target, reason, extra = '') {
    const db = SystemMod;
    const logCanalId = configuracao.get('moderacao.logCanal');
    const entry = { type, modId: mod.id, targetId: target.id || target, reason, extra, ts: Date.now() };
    const key = `logs.${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
    db.set(key, entry);
    return { logCanalId, entry };
}

async function sendLog(client, logCanalId, containerContent) {
    if (!logCanalId) return;
    try {
        const ch = await client.channels.fetch(logCanalId);
        if (ch) await ch.send(containerContent);
    } catch {}
}

module.exports = {
    name: 'ban',
    type: 1,
    description: 'Bane um usuário do servidor.',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a ser banido.', required: true },
        { type: 4, name: 'dias', description: 'Dias de mensagens a deletar (0-7).', required: false, min_value: 0, max_value: 7 },
        { type: 3, name: 'motivo', description: 'Motivo do banimento.', required: false }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
        const days = interaction.options.getInteger('dias') ?? 0;

        if (target.id === interaction.user.id) {
            return interaction.reply(res.main(
                { type: 10, content: `${E('negative')} Você não pode se banir!` }
            ).with({ flags: [64] }));
        }

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member && !member.bannable) {
                return interaction.reply(res.main(
                    { type: 10, content: `${E('negative')} Não tenho permissão para banir este usuário.` }
                ).with({ flags: [64] }));
            }

            try { await target.send(`${E('negative') || '🔨'} Você foi **banido** do servidor **${interaction.guild.name}**.\n**Motivo:** ${reason}`); } catch {}
            await interaction.guild.members.ban(target, { reason, deleteMessageSeconds: days * 86400 });

            const { logCanalId } = logMod('ban', interaction.user, target, reason, `dias:${days}`);

            const log = res.main(
                { type: 10, content: `-# Moderação > Ban` },
                { type: 14 },
                { type: 10, content: `### ${E('negative') || '🔨'} Usuário Banido\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Motivo:** ${reason}\n> **Dias deletados:** ${days}\n> **Moderador:** ${interaction.user.tag}\n> **Quando:** <t:${Math.floor(Date.now()/1000)}:R>` }
            );
            await sendLog(client, logCanalId, log);

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} **${target.tag}** foi banido.\n-# Motivo: ${reason}` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main(
                { type: 10, content: `${E('negative')} Erro ao banir: \`${e.message}\`` }
            ).with({ flags: [64] }));
        }
    }
};