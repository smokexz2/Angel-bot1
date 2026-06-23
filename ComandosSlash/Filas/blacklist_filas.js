const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPermissions } = require('../../Functions/PermissionsCache.js');

module.exports = {
    name: 'blacklist-filas',
    description: '[⛔ | Filas] Painel de gerenciamento da blacklist das filas de apostas.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ | Você não possui permissão para usar esse comando.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setTitle('⛔ Painel de Blacklist — Filas')
            .setDescription('Gerencie a blacklist de usuários das filas de apostas.\n\nAnalistas e administradores podem adicionar, remover ou procurar usuários.')
            .setThumbnail(interaction.guild?.iconURL() || null)
            .setFooter({ text: 'WinnBuxx • Sistema de Filas' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('blacklist_add').setLabel('Adicionar').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId('blacklist_remove').setLabel('Remover').setStyle(ButtonStyle.Danger).setEmoji('➖'),
            new ButtonBuilder().setCustomId('blacklist_search').setLabel('Procurar').setStyle(ButtonStyle.Primary).setEmoji('🔍')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};