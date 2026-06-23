const { processarMensagemIA } = require("../../Functions/SistemaIA");

module.exports = {
    name: 'messageCreate',

    run: async (message, client) => {
        if (message.author.bot) return;
        if (!message.guild) return;
        await processarMensagemIA(message, client);
    }
};