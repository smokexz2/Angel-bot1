const { PermissionFlagsBits, ChannelType } = require("discord.js");
const { EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

let voiceLib = null;
try { voiceLib = require('@discordjs/voice'); } catch { console.warn('[Call] @discordjs/voice não disponível.'); }

const activeConnections = new Map();

module.exports = {
    name: 'call',
    type: 1,
    description: 'Adiciona o bot em um canal de voz.',
    defaultMemberPermissions: PermissionFlagsBits.MoveMembers,
    options: [
        { type: 7, name: 'canal', description: 'Canal de voz para entrar (padrão: seu canal atual).', required: false, channel_types: [2, 13] },
        { type: 5, name: 'desconectar', description: 'Desconecta o bot do canal de voz atual.', required: false }
    ],
    run: async (client, interaction) => {
        if (!voiceLib) {
            return interaction.reply(res.main({
                type: 10,
                content: `${E('negative')} Módulo de voz não disponível neste ambiente.`
            }).with({ flags: [64] }));
        }

        const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = voiceLib;
        const desconectar = interaction.options.getBoolean('desconectar');

        
        if (desconectar) {
            const existing = getVoiceConnection(interaction.guild.id);
            if (!existing) {
                return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não estou conectado a nenhum canal de voz.` }).with({ flags: [64] }));
            }
            existing.destroy();
            activeConnections.delete(interaction.guild.id);
            return interaction.reply(res.main({ type: 10, content: `${E('checker') || '✅'} Desconectado do canal de voz.` }).with({ flags: [64] }));
        }

        
        let targetChannel = interaction.options.getChannel('canal');
        if (!targetChannel) {
            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            targetChannel = member?.voice?.channel || null;
        }

        if (!targetChannel) {
            return interaction.reply(res.main({
                type: 10,
                content: `${E('negative')} Selecione um canal de voz ou entre em um canal primeiro.`
            }).with({ flags: [64] }));
        }

        if (targetChannel.type !== ChannelType.GuildVoice && targetChannel.type !== ChannelType.GuildStageVoice) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Canal inválido. Selecione um canal de voz.` }).with({ flags: [64] }));
        }

        const permissions = targetChannel.permissionsFor(client.user);
        if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.ViewChannel)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não tenho permissão para entrar nesse canal.` }).with({ flags: [64] }));
        }

        try {
            const existing = getVoiceConnection(interaction.guild.id);
            if (existing) existing.destroy();

            const connection = joinVoiceChannel({
                channelId: targetChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true,
            });

            activeConnections.set(interaction.guild.id, connection);

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        new Promise(r => connection.once(VoiceConnectionStatus.Signalling, r)),
                        new Promise(r => connection.once(VoiceConnectionStatus.Connecting, r)),
                        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
                    ]);
                } catch {
                    connection.destroy();
                    activeConnections.delete(interaction.guild.id);
                }
            });

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Entrei no canal **${targetChannel.name}**!\n-# Use \`/call desconectar:True\` para sair.` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro ao entrar no canal: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};