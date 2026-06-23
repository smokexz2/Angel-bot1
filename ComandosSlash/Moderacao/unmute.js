const { PermissionFlagsBits } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'unmute',
    type: 1,
    description: 'Remove o silenciamento de um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a dessilenciar.', required: true },
        { type: 3, name: 'motivo', description: 'Motivo.', required: false }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Silenciamento removido';

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Usuário não encontrado.` }).with({ flags: [64] }));
            if (!member.isCommunicationDisabled()) {
                return interaction.reply(res.main({ type: 10, content: `${E('negative')} Este usuário não está silenciado.` }).with({ flags: [64] }));
            }

            await member.timeout(null, reason);

            try { await target.send(`${E('checker') || '🔊'} Seu silenciamento foi removido no servidor **${interaction.guild.name}**.\n**Motivo:** ${reason}`); } catch {}

            const logCanalId = configuracao.get('moderacao.logCanal');
            if (logCanalId) {
                try {
                    const ch = await interaction.client.channels.fetch(logCanalId);
                    if (ch) await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Unmute` },
                        { type: 14 },
                        { type: 10, content: `### ${E('checker') || '🔊'} Silenciamento Removido\n> **Usuário:** ${target.tag}\n> **Moderador:** ${interaction.user.tag}\n> **Motivo:** ${reason}` }
                    ));
                } catch {}
            }

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Silenciamento de **${target.tag}** removido.` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};