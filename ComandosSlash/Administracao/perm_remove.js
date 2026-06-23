const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "perm_remove",
  description: "[👑 | Owner] Use este comando para remover a permissão de um usuário para gerenciar meu sistema.",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "Usuário que terá a permissão removida",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  run: async (client, interaction, message) => {
    const user = interaction.options.getUser('user');
    const dono = require("../../database/dono.json");

    const permsFilePath = path.join(__dirname, '..', '..', 'database', 'perms.json');
    if (!fs.existsSync(permsFilePath)) {
      return interaction.reply({ content: "❌ O arquivo de permissões não existe.", flags: 64 });
    }

    if (dono.dono !== interaction.user.id) {
      return interaction.reply({ content: `❌ Você não possui permissão para remover um usuário da lista de permissões.`, flags: 64 });
    }

    let perms;
    try {
      perms = require(permsFilePath);
    } catch (error) {
      console.error("Erro ao carregar o arquivo de permissões:", error);
      return interaction.reply({ content: "❌ O arquivo de permissões não pôde ser carregado.", flags: 64 });
    }

    if (!perms[user.id]) {
      return interaction.reply({ content: `❌ O usuário ${user} não está na lista de permissões do BOT.`, flags: 64 });
    }

    delete perms[user.id];
    try {
      fs.writeFileSync(permsFilePath, JSON.stringify(perms, null, 2));
      interaction.reply({ content: `✅ O usuário ${user} foi removido da lista de permissões do BOT.`, flags: 64 });
    } catch (error) {
      console.error("Erro ao salvar o arquivo de permissões:", error);
      interaction.reply({ content: "❌ Houve um erro ao salvar o arquivo de permissões.", flags: 64 });
    }
  }
}