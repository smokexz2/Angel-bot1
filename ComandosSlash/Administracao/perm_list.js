const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const { configuracao } = require("../../database");

module.exports = {
  name: "perm_list",
  description: "[👑 | Owner] Confira os usuários autorizados para gerenciar meu sistema.",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction, message) => {
    const owner = require("../../config.json");
    const permsFilePath = path.join(__dirname, '..', '..', 'database', 'perms.json');

    
    if (!fs.existsSync(permsFilePath)) {
      return interaction.reply({ content: "❌ O arquivo de permissões não foi encontrado.", flags: 64 });
    }

    
    if (owner.owner !== interaction.user.id) {
      return interaction.reply({ content: `❌ Você não tem permissão para utilizar este comando.`, flags: 64 });
    }

    let perms;
    try {
      perms = require(permsFilePath);
    } catch (error) {
      console.error("Erro ao carregar o arquivo de permissões:", error);
      return interaction.reply({ content: "❌ O arquivo de permissões não pôde ser carregado.", flags: 64 });
    }

    
    const membersWithPerms = [];
    for (const userId in perms) {
      try {
        const member = await interaction.guild.members.fetch(userId);
        membersWithPerms.push(member);
      } catch (error) {
        console.error(`Erro ao buscar membro com ID ${userId}:`, error);
      }
    }

    
    if (membersWithPerms.length === 0) {
      return interaction.reply({ content: "Nenhum membro foi autorizado a utilizar o BOT.", flags: 64 });
    }

    
    let membersList = ``;
    for (const member of membersWithPerms) {
      membersList += `🔧 - ${member} \`(${member.id})\`\n`;
    }

    
    const embed = new Discord.EmbedBuilder()
      .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()
      .setTitle(`:regional_indicator_a: — Membros Autorizados (${membersWithPerms.length})`)
      .setDescription(membersList)
      .setColor(`${configuracao.get(`Cores.Principal`) == null ? `0cd4cc`: configuracao.get('Cores.Principal')}`)
      .setFooter(
        { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
      )
    interaction.reply({ embeds: [embed], flags: 64 });
  }
}