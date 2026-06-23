const { PermissionFlagsBits } = require("discord.js");
const { SystemMod, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'warns',
    type: 1,
    description: 'Vê os avisos de um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário.', required: true }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const warns = SystemMod.get(`warns.${target.id}`) || [];

        if (warns.length === 0) {
            return interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} **${target.tag}** não possui avisos.` }
            ).with({ flags: [64] }));
        }

        const lista = warns.slice(-10).map((w, i) => `> **${i+1}.** ${w.reason} — <t:${Math.floor(w.ts/1000)}:d>`).join('\n');

        interaction.reply(res.main(
            { type: 10, content: `-# Moderação > Warns` },
            { type: 14 },
            { type: 10, content: `### ${E('negative') || '⚠️'} Avisos de ${target.tag}\n**Total:** ${warns.length}\n\n${lista}` }
        ).with({ flags: [64] }));
    }
};