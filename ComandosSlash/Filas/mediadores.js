const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMediadores } = require('../../Functions/FilasSystem');
const { getPermissions } = require('../../Functions/PermissionsCache.js');

module.exports = {
    name: 'mediadores',
    description: '[🛡️ | Filas] Veja e gerencie a fila de mediadores de apostas.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ | Você não possui permissão para usar esse comando.', flags: 64 });
        }

        const fila = getMediadores();
        const desc = fila.length > 0
            ? fila.map(u => `<@${u}> \`${u}\``).join('\n')
            : 'Nenhum mediador disponível no momento.';

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Fila de Mediadores')
            .setDescription('Entre ou saia da fila de mediadores usando os botões abaixo.')
            .addFields({ name: 'Mediadores Disponíveis', value: desc })
            .setColor(0x2ecc71)
            .setFooter({ text: 'WinnBuxx • Sistema de Filas' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('entrar_fila').setLabel('Entrar na Fila').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId('sair_fila').setLabel('Sair da Fila').setStyle(ButtonStyle.Danger).setEmoji('➖')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};