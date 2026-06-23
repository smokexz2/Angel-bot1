const { InteractionType } = require("discord.js");
const {
    painelGiftCard,
    modalCriarGiftCard,
    handleModalCriarGiftCard,
    listarGiftCards,
    limparExpirados
} = require("../../Functions/GiftCard");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'gc_modal_criar') {
                return handleModalCriarGiftCard(interaction);
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'gc_painel') {
                return painelGiftCard(interaction);
            }

            if (interaction.customId === 'gc_criar') {
                return modalCriarGiftCard(interaction);
            }

            if (interaction.customId === 'gc_listar') {
                return listarGiftCards(interaction);
            }

            if (interaction.customId === 'gc_limpar') {
                return limparExpirados(interaction);
            }
        }
    }
};