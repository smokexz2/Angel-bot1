const { ApplicationCommandType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { listGamesWithScripts } = require('../../Functions/ScriptsSystem');
const { getPermissions } = require('../../Functions/PermissionsCache.js');

function buildScriptsGamesPanel() {
    const games = listGamesWithScripts();

    if (games.length === 0) {
        return new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 📜 Painel de Scripts'),
                new TextDisplayBuilder().setContent('Nenhum jogo cadastrado ainda.\nUm administrador precisa adicionar jogos pelo painel de configuração.')
            );
    }

    const options = games.slice(0, 25).map(game => ({
        label: game.name,
        value: game.id,
        description: game.scripts.length > 0 ? `${game.scripts.length} script(s) disponível(is)` : 'Sem scripts'
    }));

    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📜 Painel de Scripts'),
            new TextDisplayBuilder().setContent('Selecione um jogo abaixo para ver os scripts disponíveis.')
        )
        .addSeparatorComponents(sep => sep.setDivider(true))
        .addActionRowComponents(row =>
            row.addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('scripts_game_select')
                    .setPlaceholder('🎮 Selecione um jogo...')
                    .addOptions(options)
            )
        );
}

module.exports = {
    name: 'scripts-painel',
    description: '[📜 | Scripts] Envia o painel público de scripts Roblox no canal atual.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ | Você não possui permissão para usar esse comando.', flags: 64 });
        }

        const panel = buildScriptsGamesPanel();

        await interaction.channel.send({
            components: [panel],
            flags: MessageFlags.IsComponentsV2
        });

        await interaction.reply({ content: '✅ Painel de scripts enviado no canal!', flags: 64 });
    }
};