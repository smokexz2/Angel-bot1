const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        
        if ((interaction.isButton() && interaction.customId === 'painelrankingcompras') || (interaction.isStringSelectMenu?.() && interaction.customId?.startsWith('panel_select_') && interaction.values?.[0] === 'painelrankingcompras')) {
            const rankingCmd = client.slashCommands.get('ranking-compras');
            if (!rankingCmd) {
                return interaction.reply({ content: '❌ Comando de ranking não carregado.', flags: 64 });
            }
            return rankingCmd.run(client, interaction);
        }
    }
};