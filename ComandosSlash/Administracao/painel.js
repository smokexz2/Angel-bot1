const { EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const startTime = Date.now();
const maxMemory = 100;
const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
const memoryUsagePercentage = (usedMemory / maxMemory) * 100;
const roundedPercentage = Math.min(100, Math.round(memoryUsagePercentage));
const { Painel } = require("../../Functions/Painel");
const { getPermissions } = require("../../Functions/PermissionsCache.js");


module.exports = {
  name: "panel",
  description: "[👑 | Owner] Use para configurar minhas funções",
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),

  run: async (client, interaction, message) => {
    const perm = await getPermissions(client.user.id)
    if (perm === null || !perm.includes(interaction.user.id)) {
      return interaction.reply({ content: `❌ | Você não possui permissão para usar esse comando.`, flags: MessageFlags.Ephemeral });
    }

    return Painel(interaction, client)
  }
}