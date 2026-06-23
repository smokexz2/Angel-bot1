const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { resgatarGiftCard } = require("../../Functions/GiftCard");

module.exports = {
    name: "resgatar",
    description: "[🎁 | Público] Resgate um gift card com seu código",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "codigo",
            description: "Código do gift card",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const codigo = interaction.options.getString("codigo");
        await resgatarGiftCard(interaction, codigo);
    }
};