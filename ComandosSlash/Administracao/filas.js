const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getFilas1v1, getFilasNormal, getMediadores } = require('../../Functions/FilasSystem');
const { getPermissions } = require('../../Functions/PermissionsCache.js');

function countFila(db) {
    return Object.values(db).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
}

module.exports = {
    name: 'filas',
    description: '[🎮 | Filas] Abre o painel de gerenciamento de filas de apostas.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ | Você não possui permissão para usar esse comando.', flags: 64 });
        }

        const filas1v1 = getFilas1v1();
        const filasNormal = getFilasNormal();
        const mediadores = getMediadores();

        const embed = new EmbedBuilder()
            .setTitle('🎮 Painel de Filas de Apostas')
            .setDescription('Gerencie as filas de apostas do servidor.\nUse os botões abaixo para criar painéis ou gerenciar mediadores.')
            .addFields(
                { name: '🎯 Jogadores em Fila 1v1', value: `\`${countFila(filas1v1)}\``, inline: true },
                { name: '👥 Jogadores em Fila Normal', value: `\`${countFila(filasNormal)}\``, inline: true },
                { name: '🛡️ Mediadores Disponíveis', value: `\`${mediadores.length}\``, inline: true }
            )
            .setColor(0x5865F2)
            .setFooter({ text: 'WinnBuxx • Sistema de Filas' })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fila_enviar_1v1').setLabel('Criar Painel 1v1').setStyle(ButtonStyle.Primary).setEmoji('🎯'),
            new ButtonBuilder().setCustomId('fila_enviar_normal').setLabel('Criar Painel Normal').setStyle(ButtonStyle.Secondary).setEmoji('👥'),
            new ButtonBuilder().setCustomId('fila_mediadores').setLabel('Ver Mediadores').setStyle(ButtonStyle.Success).setEmoji('🛡️')
        );

        await interaction.reply({ embeds: [embed], components: [row1], flags: 64 });
    }
};