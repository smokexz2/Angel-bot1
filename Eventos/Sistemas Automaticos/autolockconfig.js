const {
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require("discord.js");
const { configuracao, Emojis, autolock } = require("../../database");
const { res } = require("../../res");

function readAutomaticos() {
    return autolock.all() || {};
}

function writeAutomaticos(guildId, data) {
    if (data === null) {
        autolock.delete(guildId);
    } else {
        autolock.set(guildId, data);
    }
}

function isValidTime(time) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
}

async function isValidChannelId(client, guildId, channelId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        return !!channel;
    } catch {
        return false;
    }
}

async function validateChannelIds(client, guildId, channelIds) {
    const invalidIds = [];
    for (const channelId of channelIds) {
        if (!await isValidChannelId(client, guildId, channelId.trim())) {
            invalidIds.push(channelId);
        }
    }
    return invalidIds;
}

async function showLockConfig(interaction) {
    const automaticos = readAutomaticos();
    const guildId = interaction.guild.id;
    const config = automaticos[guildId] || {};

    let channelNames = config.channels
        ? config.channels.map(id => `<#${id}>`).join(', ')
        : `*Não configurado*`;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltarautomaticos")
            .setEmoji(Emojis.get(`_back_emoji`) || '🔙')
            .setLabel(`Voltar`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > Lock Automático` },
        { type: 14 },
        { type: 10, content: `**Configuração de Lock Automático**\n\n> Bloqueie e desbloqueie canais automaticamente em horários específicos.` },
        { type: 14 },
        { type: 10, content: `**Configurações Atuais:**\n> **Horário de Bloqueio:** \`${config.abrir || `Não configurado`}\`\n> **Horário de Desbloqueio:** \`${config.fechar || `Não configurado`}\`\n> **Canais:** ${channelNames}` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Modificar",
                    emoji: { id: "1236318155056349224" },
                    custom_id: "modifyConfig"
                },
                {
                    type: 2,
                    style: 4,
                    label: "Desativar",
                    emoji: { id: "1178076767567757312" },
                    custom_id: "disableConfig"
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            
            if (!interaction.guild) return;
            
            if (interaction.isButton()) {
                const guildId = interaction.guild.id;

                if (interaction.customId === 'configlock') {
                    await showLockConfig(interaction);
                }

                if (interaction.customId === 'modifyConfig') {
                    const modal = new ModalBuilder()
                        .setCustomId('configurarBloqueio')
                        .setTitle('Configurar Bloqueio Automático');

                    const lockTimeInput = new TextInputBuilder()
                        .setCustomId('lockTime')
                        .setLabel('Horário de Bloqueio (HH:mm)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const unlockTimeInput = new TextInputBuilder()
                        .setCustomId('unlockTime')
                        .setLabel('Horário de Desbloqueio (HH:mm)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const channelIdsInput = new TextInputBuilder()
                        .setCustomId('channelIds')
                        .setLabel('IDs dos Canais (separados por vírgula)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(lockTimeInput),
                        new ActionRowBuilder().addComponents(unlockTimeInput),
                        new ActionRowBuilder().addComponents(channelIdsInput)
                    );

                    await interaction.showModal(modal);
                }

                if (interaction.customId === `disableConfig`) {
                    const automaticos = readAutomaticos();

                    if (automaticos[guildId]) {
                        writeAutomaticos(guildId, null);
                        
                        await showLockConfig(interaction);
                        await interaction.followUp({ content: `${Emojis.get(`checker`)} Configuração de bloqueio automático desativada.`, flags: 64 });
                    } else {
                        await interaction.reply({ content: `${Emojis.get(`negative`)} Nenhuma configuração encontrada para desativar.`, flags: 64 });
                    }
                }

                
                if (interaction.customId === `unlock_channel`) {
                    
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return await interaction.reply({
                            content: `${Emojis.get(`negative`)} Você não tem permissão para destrancar este canal. Apenas administradores podem usar este botão.`,
                            flags: 64
                        });
                    }

                    const channel = interaction.channel;

                    try {
                        
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: true
                        });

                        
                        await interaction.message.delete().catch(() => {});

                        await interaction.reply({
                            content: `${Emojis.get(`checker`)} Canal destrancado com sucesso por ${interaction.user}!`,
                            ephemeral: false
                        });
                    } catch (error) {
                        console.error(`Erro ao destrancar canal:`, error);
                        await interaction.reply({
                            content: `${Emojis.get(`negative`)} Ocorreu um erro ao destrancar o canal.`,
                            flags: 64
                        });
                    }
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'configurarBloqueio') {
                    const lockTime = interaction.fields.getTextInputValue('lockTime');
                    const unlockTime = interaction.fields.getTextInputValue('unlockTime');
                    const channelIds = interaction.fields.getTextInputValue('channelIds').split(`,`);
                    const guildId = interaction.guild.id;

                    if (!isValidTime(lockTime) || !isValidTime(unlockTime)) {
                        return await interaction.reply({
                            content: `${Emojis.get(`negative`)} Horário inválido. Use o formato HH:mm.`,
                            flags: 64
                        });
                    }

                    const invalidIds = await validateChannelIds(client, guildId, channelIds);
                    if (invalidIds.length > 0) {
                        return await interaction.reply({
                            content: `${Emojis.get(`negative`)} ID(s) de canal inválido(s): ${invalidIds.join(`, `)}`,
                            flags: 64
                        });
                    }

                    const automaticos = readAutomaticos();
                    const configData = {
                        abrir: lockTime,
                        fechar: unlockTime,
                        channels: channelIds.map(id => id.trim()),
                        serverid: guildId
                    };
                    writeAutomaticos(guildId, configData);

                    await interaction.deferUpdate();
                    await showLockConfig(interaction);
                    await interaction.followUp({ content: `${Emojis.get(`checker`)} Configuração de bloqueio automático atualizada!`, flags: 64 });
                }
            }

        } catch (error) {
            console.error(`Erro no interactionCreate:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: `${Emojis.get(`negative`)} Ocorreu um erro ao processar sua solicitação.`,
                    flags: 64
                });
            } else {
                await interaction.reply({
                    content: `${Emojis.get(`negative`)} Ocorreu um erro ao processar sua solicitação.`,
                    flags: 64
                });
            }
        }
    }
};