const { PermissionFlagsBits } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'softban',
    type: 1,
    description: 'Bane e desbane para limpar mensagens do usuário.',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário alvo.', required: true },
        { type: 4, name: 'dias', description: 'Dias de mensagens a deletar (1-7).', required: false, min_value: 1, max_value: 7 },
        { type: 3, name: 'motivo', description: 'Motivo.', required: false }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const days = interaction.options.getInteger('dias') ?? 1;
        const reason = interaction.options.getString('motivo') || 'Softban — limpeza de mensagens';

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member && !member.bannable) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não posso banir este usuário.` }).with({ flags: [64] }));

            try { await target.send(`${E('negative') || '🔄'} Você recebeu um **softban** no servidor **${interaction.guild.name}**.\n**Motivo:** ${reason}`); } catch {}
            await interaction.guild.members.ban(target, { reason: `[Softban] ${reason}`, deleteMessageSeconds: days * 86400 });
            await interaction.guild.members.unban(target.id, 'Softban — desbane automático');

            const logCanalId = configuracao.get('moderacao.logCanal');
            if (logCanalId) {
                try {
                    const ch = await client.channels.fetch(logCanalId);
                    if (ch) await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Softban` },
                        { type: 14 },
                        { type: 10, content: `### ${E('negative') || '🔄'} Softban Aplicado\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Dias de msgs deletados:** ${days}\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
                    ));
                } catch {}
            }

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Softban em **${target.tag}** aplicado. \`${days}d\` de mensagens deletadas.\n-# Motivo: ${reason}` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};