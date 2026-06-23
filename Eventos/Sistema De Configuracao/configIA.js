const { InteractionType } = require("discord.js");
const {
    painelIA,
    modalConfigCanal,
    modalConfigAPIKey,
    modalConfigPrompt,
    handleModalCanal,
    handleModalAPIKey,
    handleModalPrompt,
    handleLimparHistorico,
    iaConfig
} = require("../../Functions/SistemaIA");
const emojisDb = require("../../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'ia_modal_canal') return handleModalCanal(interaction);
            if (interaction.customId === 'ia_modal_apikey') return handleModalAPIKey(interaction);
            if (interaction.customId === 'ia_modal_prompt') return handleModalPrompt(interaction);
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ia_status_select') {
                const value = interaction.values[0];
                if (value === 'ativar_ia') {
                    if (!iaConfig.get('openai_key')) return interaction.reply({ content: `${Emojis.get('negative')||''} | Configure a API Key antes de ativar o sistema!`, flags: 64 });
                    if (!iaConfig.get('canal')) return interaction.reply({ content: `${Emojis.get('negative')||''} | Configure o canal antes de ativar o sistema!`, flags: 64 });
                    iaConfig.set('status', true);
                    await painelIA(interaction);
                    return interaction.followUp({ content: `${Emojis.get('checker')||''} | Sistema de IA ativado!`, flags: 64 });
                } else {
                    iaConfig.set('status', false);
                    await painelIA(interaction);
                    return interaction.followUp({ content: `${Emojis.get('checker')||''} | Sistema de IA desativado!`, flags: 64 });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'ia_config_canal') return modalConfigCanal(interaction);
            if (interaction.customId === 'ia_config_apikey') return modalConfigAPIKey(interaction);
            if (interaction.customId === 'ia_config_prompt') return modalConfigPrompt(interaction);
            if (interaction.customId === 'ia_limpar_historico') return handleLimparHistorico(interaction);
        }
    }
};