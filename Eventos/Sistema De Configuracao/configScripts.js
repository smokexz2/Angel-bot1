const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { listGamesWithScripts, listScripts, hasCategories } = require('../../Functions/ScriptsSystem');


function buildScriptsAdminPanel() {
    const games = listGamesWithScripts();
    const totalScripts = games.reduce((acc, g) => acc + g.scripts.length, 0);

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📜 Configuração de Scripts')
        .setDescription('Gerencie os jogos e scripts do painel de scripts.')
        .addFields(
            { name: '🎮 Jogos Cadastrados', value: `\`${games.length}\``, inline: true },
            { name: '📋 Scripts Disponíveis', value: `\`${totalScripts}\``, inline: true }
        )
        .setFooter({ text: 'WinnBuxx • Config de Scripts' });
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        
        if ((interaction.isButton() && interaction.customId === 'painelconfigscripts') || (interaction.isStringSelectMenu?.() && interaction.customId?.startsWith('panel_select_') && interaction.values?.[0] === 'painelconfigscripts')) {
            const embed = buildScriptsAdminPanel();
            const select = new StringSelectMenuBuilder()
                .setCustomId('scripts_config_menu')
                .setPlaceholder('Selecione uma ação...')
                .addOptions([
                    { label: 'Adicionar Jogo', value: 'add_game', description: 'Criar nova categoria de jogo' },
                    { label: 'Adicionar Script', value: 'add_script', description: 'Adicionar script a um jogo' },
                    { label: 'Remover Script', value: 'remove_script', description: 'Remover um script existente' }
                ]);
            const row = new ActionRowBuilder().addComponents(select);
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    }
};