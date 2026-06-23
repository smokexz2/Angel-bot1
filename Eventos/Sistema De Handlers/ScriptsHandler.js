const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const {
    listGamesWithScripts, getScriptById, addCategory, addScript, removeScript, hasCategories
} = require('../../Functions/ScriptsSystem');

const COOLDOWNS = new Map();
const COOLDOWN_SECONDS = 30;

function buildSimpleNotice(msg) {
    return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));
}

function buildScriptsGamesPanel() {
    const games = listGamesWithScripts();
    if (games.length === 0) {
        return new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 📜 Painel de Scripts'),
                new TextDisplayBuilder().setContent('Nenhum jogo cadastrado ainda.')
            );
    }
    const options = games.slice(0, 25).map(g => ({
        label: g.name,
        value: g.id,
        description: g.scripts.length > 0 ? `${g.scripts.length} script(s)` : 'Sem scripts'
    }));
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 📜 Painel de Scripts'),
            new TextDisplayBuilder().setContent('Selecione um jogo para ver os scripts disponíveis.')
        )
        .addSeparatorComponents(sep => sep.setDivider(true))
        .addActionRowComponents(row =>
            row.addComponents(
                new StringSelectMenuBuilder().setCustomId('scripts_game_select').setPlaceholder('🎮 Selecione um jogo...').addOptions(options)
            )
        );
}

function buildScriptsFromGamePanel(game) {
    const components = [];

    if (game.imageUrl) {
        try {
            components.push(
                new MediaGalleryBuilder().addItems(item => item.setURL(game.imageUrl).setDescription(game.name))
            );
        } catch {}
    }

    if (!game.scripts || game.scripts.length === 0) {
        components.push(
            new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${game.name}** não tem scripts disponíveis.`)
            )
        );
        return components;
    }

    components.push(
        new ContainerBuilder()
            .addActionRowComponents(row =>
                row.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`scripts_script_select:${game.id}`)
                        .setPlaceholder('📋 Selecione um script...')
                        .addOptions(game.scripts.slice(0, 25).map(s => ({ label: s.label, value: s.id })))
                )
            )
    );
    return components;
}

function buildScriptDetailsPanel(script, gameId) {
    return [
        new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${script.label}`),
                new TextDisplayBuilder().setContent(`\`\`\`lua\n${script.content}\n\`\`\``)
            )
            .addSeparatorComponents(sep => sep.setDivider(true))
            .addActionRowComponents(row =>
                row.addComponents(
                    new ButtonBuilder().setCustomId(`scripts_back_to_game:${gameId}`).setLabel('← Voltar').setStyle(ButtonStyle.Secondary)
                )
            )
    ];
}


function buildScriptsConfigAdminPanel() {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## ⚙️ Configuração de Scripts'),
            new TextDisplayBuilder().setContent('Gerencie jogos e scripts do painel.')
        )
        .addSeparatorComponents(sep => sep.setDivider(true))
        .addActionRowComponents(row =>
            row.addComponents(
                new StringSelectMenuBuilder().setCustomId('scripts_config_menu').setPlaceholder('Selecione uma ação...')
                    .addOptions([
                        { label: 'Adicionar Jogo', value: 'add_game', description: 'Criar nova categoria de jogo' },
                        { label: 'Adicionar Script', value: 'add_script', description: 'Adicionar script a um jogo' },
                        { label: 'Remover Script', value: 'remove_script', description: 'Remover um script existente' }
                    ])
            )
        );
}

module.exports = {
    name: 'interactionCreate',
    async run(interaction, client) {

        
        if (interaction.isStringSelectMenu() && interaction.customId === 'scripts_game_select') {
            const selectedGameId = interaction.values[0];
            const game = listGamesWithScripts().find(g => g.id === selectedGameId);

            if (!game) {
                return interaction.update({ components: [buildScriptsGamesPanel()] });
            }

            if (game.scripts.length === 0) {
                await interaction.update({ components: [buildScriptsGamesPanel()] });
                return interaction.followUp({
                    components: [buildSimpleNotice(`**${game.name}** não tem scripts ainda.`)],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                });
            }

            await interaction.update({ components: [buildScriptsGamesPanel()] });
            return interaction.followUp({
                components: buildScriptsFromGamePanel(game),
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });
        }

        
        if (interaction.isStringSelectMenu() && interaction.customId?.startsWith('scripts_script_select:')) {
            const gameId = interaction.customId.split(':')[1];
            const scriptId = interaction.values[0];
            const game = listGamesWithScripts().find(g => g.id === gameId);

            const now = Date.now();
            const cooldownEnd = COOLDOWNS.get(interaction.user.id) || 0;
            if (cooldownEnd > now) {
                const secsLeft = Math.ceil((cooldownEnd - now) / 1000);
                return interaction.reply({
                    components: [buildSimpleNotice(`⏳ Aguarde **${secsLeft}s** antes de pegar outro script.`)],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                });
            }

            COOLDOWNS.set(interaction.user.id, now + COOLDOWN_SECONDS * 1000);

            const script = getScriptById(scriptId);
            if (!script) {
                return interaction.update({ components: [buildSimpleNotice('❌ Script não encontrado.')] });
            }

            return interaction.update({ components: buildScriptDetailsPanel(script, gameId) });
        }

        
        if (interaction.isButton() && interaction.customId?.startsWith('scripts_back_to_game:')) {
            const gameId = interaction.customId.split(':')[1];
            const game = listGamesWithScripts().find(g => g.id === gameId);
            if (!game) return interaction.update({ components: [buildScriptsGamesPanel()] });
            return interaction.update({ components: buildScriptsFromGamePanel(game) });
        }

        
        if (interaction.isStringSelectMenu() && interaction.customId === 'scripts_config_menu') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const val = interaction.values[0];

            if (val === 'add_game') {
                const modal = new ModalBuilder().setCustomId('modal_scripts_add_game').setTitle('Adicionar Jogo');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('game_name').setLabel('Nome do Jogo').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('game_image').setLabel('URL da Imagem').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(500)
                    )
                );
                return interaction.showModal(modal);
            }

            if (val === 'add_script') {
                if (!hasCategories()) {
                    return interaction.reply({
                        components: [buildSimpleNotice('❌ Adicione um jogo primeiro!')],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                    });
                }
                const modal = new ModalBuilder().setCustomId('modal_scripts_add_script').setTitle('Adicionar Script');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('script_name').setLabel('Nome do Script').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('game_name').setLabel('Nome do Jogo').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('script_content').setLabel('Conteúdo do Script').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
                    )
                );
                return interaction.showModal(modal);
            }

            if (val === 'remove_script') {
                const modal = new ModalBuilder().setCustomId('modal_scripts_remove_script').setTitle('Remover Script');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('script_name').setLabel('Nome do Script').setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('game_name').setLabel('Nome do Jogo').setStyle(TextInputStyle.Short).setRequired(true)
                    )
                );
                return interaction.showModal(modal);
            }
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_scripts_add_game') {
            const name = interaction.fields.getTextInputValue('game_name');
            const imageUrl = interaction.fields.getTextInputValue('game_image');
            const result = addCategory(name, imageUrl);
            const msg = result.ok ? `✅ Jogo **${result.category.name}** adicionado!` : `❌ ${result.reason === 'exists' ? 'Jogo já existe!' : result.reason === 'invalid_image_url' ? 'URL de imagem inválida!' : 'Nome inválido!'}`;
            return interaction.reply({ components: [buildSimpleNotice(msg)], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_scripts_add_script') {
            const name = interaction.fields.getTextInputValue('script_name');
            const gameName = interaction.fields.getTextInputValue('game_name');
            const content = interaction.fields.getTextInputValue('script_content');
            const result = addScript({ name, content, categoryName: gameName });
            const msg = result.ok ? `✅ Script **${result.script.label}** adicionado em **${result.script.categoryName}**!` : `❌ ${result.reason === 'category_not_found' ? `Jogo "${gameName}" não encontrado!` : 'Erro ao adicionar script.'}`;
            return interaction.reply({ components: [buildSimpleNotice(msg)], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_scripts_remove_script') {
            const name = interaction.fields.getTextInputValue('script_name');
            const gameName = interaction.fields.getTextInputValue('game_name');
            const result = removeScript({ name, categoryName: gameName });
            const msg = result.ok ? `✅ Script **${result.script.label}** removido!` : '❌ Script não encontrado!';
            return interaction.reply({ components: [buildSimpleNotice(msg)], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        }
    }
};