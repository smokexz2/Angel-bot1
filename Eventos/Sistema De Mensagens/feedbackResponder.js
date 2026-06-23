const { InteractionType } = require("discord.js");
const {
    painelFeedbackMonitor,
    processarFeedback,
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
    name: 'messageCreate',
    run: async (message, client) => {
        if (message.author.bot) return;
        await processarFeedback(message, client);
    }
};