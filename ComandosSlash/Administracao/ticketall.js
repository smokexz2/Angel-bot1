const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const { Emojis } = require("../../database");

module.exports = {
    name: "deletartickets",
    description: "Deleta todos os tickets",
    type: ApplicationCommandType.ChatInput,
    run: async(client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `${Emojis.get(`negative`)} Faltam permissões.`, flags: 64 });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('delete')
                    .setLabel('Deletar')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Secondary)
            );

        const reply = await interaction.reply({
            content: `Deseja realmente deletar todos os tickets?`,
            components: [row],
            flags: 64,
            fetchReply: true
        });

        const filter = i => ['delete', 'cancel'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'delete') {
                await i.update({ content: `${Emojis.get(`loading`)} Deletando Tickets...`, components: [] });

                const allThreads = await interaction.guild.channels.fetchActiveThreads();
                let count = 0;

                for (const thread of allThreads.threads.values()) {
                    if (!thread.name.includes('🛒')) {
                        await thread.delete();
                        count++;
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('Tickets Deletados')
                    .setDescription(`${Emojis.get(`check`)} Todos os **${count}** tickets foram deletados com sucesso`)
                    .setColor('#00FF00')
                    .setFooter({ text: `${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ content: '', embeds: [embed] });
            } else if (i.customId === 'cancel') {
                await i.update({ content: `${Emojis.get(`check`)} Ação cancelada.`, components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: `⏱ | Tempo esgotado. Ação cancelada.`, components: [] });
            }
        });
    }
};