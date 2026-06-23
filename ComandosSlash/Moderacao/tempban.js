const { PermissionFlagsBits } = require("discord.js");
const { configuracao, SystemMod, EmojisHelper } = require("../../database");
const { res } = require("../../res");
const ms = require("ms");
const { schedulePunishment } = require("../../Functions/PunishmentScheduler");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

async function sendLog(client, logCanalId, c) {
    if (!logCanalId) return;
    try { const ch = await client.channels.fetch(logCanalId); if (ch) await ch.send(c); } catch {}
}

module.exports = {
    name: 'tempban',
    type: 1,
    description: 'Bane temporariamente um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a banir.', required: true },
        { type: 3, name: 'duracao', description: 'Duração (ex: 1h, 1d, 7d).', required: true },
        { type: 3, name: 'motivo', description: 'Motivo.', required: true }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const durStr = interaction.options.getString('duracao');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
        const durMs = ms(durStr);

        if (!durMs || isNaN(durMs) || durMs <= 0) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Duração inválida. Use: \`1h\`, \`1d\`, \`7d\`` }).with({ flags: [64] }));
        }

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member && !member.bannable) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não posso banir este usuário.` }).with({ flags: [64] }));

            const expiresAt = Date.now() + durMs;
            const expira = Math.floor(expiresAt / 1000);

            try { await target.send(`${E('negative') || '⏳'} Você foi **banido temporariamente** do servidor **${interaction.guild.name}** por \`${durStr}\`.\n**Motivo:** ${reason}`); } catch {}
            await interaction.guild.members.ban(target, { reason: `[TempBan ${durStr}] ${reason}` });

            
            schedulePunishment({ client, type: 'tempban', userId: target.id, guildId: interaction.guild.id, expiresAt, reason });

            const logCanalId = configuracao.get('moderacao.logCanal');
            const log = res.main(
                { type: 10, content: `-# Moderação > TempBan` },
                { type: 14 },
                { type: 10, content: `### ${E('negative') || '⏳'} Ban Temporário\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Duração:** ${durStr}\n> **Expira:** <t:${expira}:R>\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
            );
            await sendLog(client, logCanalId, log);

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} **${target.tag}** banido por \`${durStr}\`.\n-# Expira: <t:${expira}:R>` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};