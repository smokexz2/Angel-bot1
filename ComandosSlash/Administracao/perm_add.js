const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json"); 
const { Emojis } = require("../../database");

module.exports = {
  name: "perm_add",
  description: "[👑 | Owner] Use este comando para conceder permissão a um usuário para gerenciar meu sistema.",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "user",
      description: "Usuário que vai receber a permissão",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  run: async (client, interaction, message) => {
    const user = interaction.options.getUser(`user`);

    
    if (interaction.user.id !== config.owner) {
      return interaction.reply({
        content: `${Emojis.get(`negative`)} Apenas o Titular da Compra pode usar Esse Comando`,
        flags: 64,
      });
    }

    let perms;
    const filePath = path.join(__dirname, '..', '..', 'database', `perms.json`);
    try {
      if (fs.existsSync(filePath)) {
        perms = require(filePath);
      } else {
        perms = {};
      }
    } catch (error) {
      console.error("Erro ao carregar o arquivo de permissões:", error);
      return interaction.reply({
        content: `${Emojis.get(`negative`)} O arquivo de permissões não pôde ser carregado.`,
        flags: 64,
      });
    }

    if (!perms[user.id]) {
      perms[user.id] = user.id;
      try {
        fs.writeFileSync(filePath, JSON.stringify(perms, null, 2));
        interaction.reply({
          content: `${Emojis.get(`checker`)} O usuário ${user} foi adicionado à lista de permissões do BOT.`,
          flags: 64,
        });
      } catch (error) {
        console.error("Erro ao salvar o arquivo de permissões:", error);
        interaction.reply({
          content: `${Emojis.get(`negative`)} Houve um erro ao salvar o arquivo de permissões.`,
          flags: 64,
        });
      }
    } else {
      return interaction.reply({
        content: `${Emojis.get(`negative`)} O usuário já possui permissão no BOT.`,
        flags: 64,
      });
    }
  }
};