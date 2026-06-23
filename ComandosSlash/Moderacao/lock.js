const { PermissionFlagsBits, ChannelType } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'lock',
    type: 1,
    description: 'Bloqueia o envio de mensagens no canal.',
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        { type: 7, name: 'canal', description: 'Canal para bloquear (padrão: canal atual).', required: false, channel_types: [0, 5] },
        { type: 3, name: 'motivo', description: 'Motivo do lock.', required: false }
    ],
    run: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('motivo') || 'Sem motivo';

        if (!channel.permissionsFor(interaction.guild.roles.everyone)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não consigo gerenciar permissões deste canal.` }).with({ flags: [64] }));
        }

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false,
                SendMessagesInThreads: false,
            }, { reason: `[Lock] ${reason} — por ${interaction.user.tag}` });

            const logCanalId = configuracao.get('moderacao.logCanal');
            if (logCanalId) {
                try {
                    const ch = await client.channels.fetch(logCanalId);
                    if (ch) await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Lock` },
                        { type: 14 },
                        { type: 10, content: `### 🔒 Canal Bloqueado\n> **Canal:** ${channel}\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
                    ));
                } catch {}
            }

            await channel.send(res.main(
                { type: 10, content: `🔒 **Canal bloqueado** por ${interaction.user}.\n-# Motivo: ${reason}` }
            ));

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Canal ${channel} bloqueado com sucesso.` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};