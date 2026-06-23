const { InteractionType } = require("discord.js");
const {
    painelFeedbackMonitor,
    modalAddCanal,
    modalRemoveCanal,
    modalConfigEmoji,
    modalConfigLogs,
    handleModalAddCanal,
    handleModalRemoveCanal,
    handleModalEmoji,
    handleModalLogs,
    feedbackConfig
} = require("../../Functions/FeedbackMonitor");

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'feedback_status_select') {
                const value = interaction.values[0];
                let config = feedbackConfig.get('config') || {};
                if (value === 'ativar_feedback') {
                    if (!config.canais || config.canais.length === 0) {
                        return interaction.reply({ content: `❌ | Configure pelo menos um canal antes de ativar!`, flags: 64 });
                    }
                    config.status = true;
                    feedbackConfig.set('config', config);
                    await painelFeedbackMonitor(interaction);
                    return interaction.followUp({ content: `✅ | Monitorador de Feedbacks ativado!`, flags: 64 });
                } else {
                    config.status = false;
                    feedbackConfig.set('config', config);
                    await painelFeedbackMonitor(interaction);
                    return interaction.followUp({ content: `✅ | Monitorador de Feedbacks desativado!`, flags: 64 });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'painel_feedback_monitor') {
                return painelFeedbackMonitor(interaction);
            }
            if (interaction.customId === 'feedback_add_canal') {
                return modalAddCanal(interaction);
            }
            if (interaction.customId === 'feedback_remove_canal') {
                return modalRemoveCanal(interaction);
            }
            if (interaction.customId === 'feedback_config_emoji') {
                return modalConfigEmoji(interaction);
            }
            if (interaction.customId === 'feedback_config_logs') {
                return modalConfigLogs(interaction);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'feedback_modal_add_canal') {
                return handleModalAddCanal(interaction);
            }
            if (interaction.customId === 'feedback_modal_remove_canal') {
                return handleModalRemoveCanal(interaction);
            }
            if (interaction.customId === 'feedback_modal_emoji') {
                return handleModalEmoji(interaction);
            }
            if (interaction.customId === 'feedback_modal_logs') {
                return handleModalLogs(interaction);
            }
        }
    }
};