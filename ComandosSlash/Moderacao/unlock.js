const { PermissionFlagsBits } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'unlock',
    type: 1,
    description: 'Desbloqueia o envio de mensagens no canal.',
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        { type: 7, name: 'canal', description: 'Canal para desbloquear (padrão: canal atual).', required: false, channel_types: [0, 5] },
        { type: 3, name: 'motivo', description: 'Motivo do unlock.', required: false }
    ],
    run: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('motivo') || 'Sem motivo';

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null,
                SendMessagesInThreads: null,
            }, { reason: `[Unlock] ${reason} — por ${interaction.user.tag}` });

            const logCanalId = configuracao.get('moderacao.logCanal');
            if (logCanalId) {
                try {
                    const ch = await client.channels.fetch(logCanalId);
                    if (ch) await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Unlock` },
                        { type: 14 },
                        { type: 10, content: `### 🔓 Canal Desbloqueado\n> **Canal:** ${channel}\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
                    ));
                } catch {}
            }

            await channel.send(res.main(
                { type: 10, content: `🔓 **Canal desbloqueado** por ${interaction.user}.\n-# Motivo: ${reason}` }
            ));

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Canal ${channel} desbloqueado com sucesso.` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};