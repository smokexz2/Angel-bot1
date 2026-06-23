const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { configuracao, SystemMod, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

async function sendLog(client, logCanalId, containerContent) {
    if (!logCanalId) return;
    try { const ch = await client.channels.fetch(logCanalId); if (ch) await ch.send(containerContent); } catch {}
}

module.exports = {
    name: 'kick',
    type: 1,
    description: 'Expulsa um usuário do servidor.',
    defaultMemberPermissions: PermissionFlagsBits.KickMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a ser expulso.', required: true },
        { type: 3, name: 'motivo', description: 'Motivo da expulsão.', required: false }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';

        if (target.id === interaction.user.id) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Você não pode se expulsar!` }).with({ flags: [64] }));
        }

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Usuário não encontrado no servidor.` }).with({ flags: [64] }));
            if (!member.kickable) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não tenho permissão para expulsar este usuário.` }).with({ flags: [64] }));

            try { await target.send(`${E('negative') || '👢'} Você foi **expulso** do servidor **${interaction.guild.name}**.\n**Motivo:** ${reason}`); } catch {}
            await member.kick(reason);

            const logCanalId = configuracao.get('moderacao.logCanal');
            const log = res.main(
                { type: 10, content: `-# Moderação > Kick` },
                { type: 14 },
                { type: 10, content: `### ${E('negative') || '👢'} Usuário Expulso\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}\n> **Quando:** <t:${Math.floor(Date.now()/1000)}:R>` }
            );
            await sendLog(client, logCanalId, log);

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} **${target.tag}** foi expulso.\n-# Motivo: ${reason}` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro ao expulsar: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};