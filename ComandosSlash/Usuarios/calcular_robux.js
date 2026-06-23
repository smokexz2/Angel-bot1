const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { perguntarTipoCalculadora } = require("../../Functions/CalculadoraRobux");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "calcular-robux",
    description: "[💎 | Público] Calcule o preço estimado de uma quantidade de Robux",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "quantidade",
            description: "Quantidade de Robux a calcular",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 100000
        }
    ],

    run: async (client, interaction) => {
        const quantidade = interaction.options.getInteger("quantidade");
        await perguntarTipoCalculadora(interaction, quantidade);
    }
};