const { ApplicationCommandType } = require("discord.js");
const { modalCriarGiftCard } = require("../../Functions/GiftCard");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "criar-giftcard",
    description: "[👑 | Admin] Crie um gift card com código e recompensa customizada",
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `❌ | Você não possui permissão para usar esse comando.`, flags: 64 });
        }
        await modalCriarGiftCard(interaction);
    }
};