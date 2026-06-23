const { PermissionFlagsBits } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'unban',
    type: 1,
    description: 'Remove o banimento de um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        { type: 3, name: 'id', description: 'ID do usuário a desbanir.', required: true },
        { type: 3, name: 'motivo', description: 'Motivo.', required: false }
    ],
    run: async (client, interaction) => {
        const userId = interaction.options.getString('id');
        const reason = interaction.options.getString('motivo') || 'Desbanido por moderador';

        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} ID inválido. Use o ID numérico do usuário.` }).with({ flags: [64] }));
        }

        try {
            const banEntry = await interaction.guild.bans.fetch(userId).catch(() => null);
            if (!banEntry) {
                return interaction.reply(res.main({ type: 10, content: `${E('negative')} Este usuário não está banido.` }).with({ flags: [64] }));
            }

            await interaction.guild.members.unban(userId, reason);

            const logCanalId = configuracao.get('moderacao.logCanal');
            if (logCanalId) {
                try {
                    const ch = await client.channels.fetch(logCanalId);
                    if (ch) await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Unban` },
                        { type: 14 },
                        { type: 10, content: `### ${E('checker') || '🔓'} Banimento Removido\n> **Usuário:** ${banEntry.user.tag} (\`${userId}\`)\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
                    ));
                } catch {}
            }

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Banimento de **${banEntry.user.tag}** removido.\n-# Motivo: ${reason}` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};