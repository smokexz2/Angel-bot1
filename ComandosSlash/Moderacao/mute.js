const { PermissionFlagsBits } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");
const ms = require("ms");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

async function sendLog(client, logCanalId, c) {
    if (!logCanalId) return;
    try { const ch = await client.channels.fetch(logCanalId); if (ch) await ch.send(c); } catch {}
}

module.exports = {
    name: 'mute',
    type: 1,
    description: 'Silencia (timeout) um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a silenciar.', required: true },
        { type: 3, name: 'duracao', description: 'Duração (ex: 10m, 1h, 7d). Máx: 28d.', required: true },
        { type: 3, name: 'motivo', description: 'Motivo.', required: false }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const durStr = interaction.options.getString('duracao');
        const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
        const durMs = ms(durStr);

        if (!durMs || isNaN(durMs) || durMs <= 0) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Duração inválida. Use: \`10m\`, \`1h\`, \`1d\`, \`7d\`` }).with({ flags: [64] }));
        }
        if (durMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Duração máxima é 28 dias.` }).with({ flags: [64] }));
        }

        try {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Usuário não encontrado.` }).with({ flags: [64] }));
            if (!member.moderatable) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não posso silenciar este usuário.` }).with({ flags: [64] }));

            await member.timeout(durMs, reason);
            const expira = Math.floor((Date.now() + durMs) / 1000);

            try { await target.send(`${E('negative') || '🔇'} Você foi **silenciado** no servidor **${interaction.guild.name}** por \`${durStr}\`.\n**Motivo:** ${reason}`); } catch {}

            const logCanalId = configuracao.get('moderacao.logCanal');
            const log = res.main(
                { type: 10, content: `-# Moderação > Mute` },
                { type: 14 },
                { type: 10, content: `### ${E('negative') || '🔇'} Usuário Silenciado\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Duração:** ${durStr}\n> **Expira:** <t:${expira}:R>\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
            );
            await sendLog(client, logCanalId, log);

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} **${target.tag}** foi silenciado por \`${durStr}\`.\n-# Expira: <t:${expira}:R>` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};