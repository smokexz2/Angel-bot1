const Discord = require("discord.js");
const { profileuser } = require("../../Functions/profile");
const { GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { produtos, configuracao } = require("../../database");

module.exports = {
  name: "📋 Manage Items",
  type: Discord.ApplicationCommandType.Message,



  run: async (client, interaction) => {

    const message = await interaction.channel.messages.fetch(interaction.targetId);

    const msg = message.components[0].components[0].data

    if (msg.type == 2) {
      const campo = msg.custom_id.split('_')[1]
      const produto = msg.custom_id.split('_')[2]

      if (produto == undefined) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })
      const aa = produtos.get(produto)
      if(aa == null) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })

      GerenciarCampos2(interaction, campo, produto, true, true)

    }
    if (msg.type == 3) {
      const campo = msg.options[0].value.split('_')[0]
      const produto = msg.options[0].value.split('_')[1]
      if (produto == undefined) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })
      const aa = produtos.get(produto)
      if(aa == null) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })

      const selectMenu = new Discord.StringSelectMenuBuilder()
        .setCustomId('asdihadbhawhdwhdaw')
        .setPlaceholder('Clique aqui para selecionar')
        .addOptions(msg.options)

      const row = new Discord.ActionRowBuilder()
        .addComponents(selectMenu)

      interaction.reply({ content: `${interaction.user} Qual campo de \`${produto}\` deseja gerenciar?`, flags: 64, components: [row] })
    }
  }
}