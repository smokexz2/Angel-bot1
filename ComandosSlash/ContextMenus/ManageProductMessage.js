const Discord = require("discord.js");
const { profileuser } = require("../../Functions/profile");
const { GerenciarProduto } = require("../../Functions/CreateProduto");
const { produtos } = require("../../database");

module.exports = {
  name: "🧵 Manage Product",
  type: Discord.ApplicationCommandType.Message,



  run: async (client, interaction) => {

    const message = await interaction.channel.messages.fetch(interaction.targetId);

    
    

    const msg = message.components[0].components[0].data

    if (msg.type == 2) {
      const produto = msg.custom_id.split('_')[2]
      if (produto == undefined) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })
      const aa = produtos.get(produto)
      if (aa == null) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })

      GerenciarProduto(interaction, 3, produto)

    }
    if (msg.type == 3) {

      const campo = msg.options[0].value.split('_')[0]
      const produto = msg.options[0].value.split('_')[1]

      if (produto == undefined) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })
      const aa = produtos.get(produto)
      if (aa == null) return interaction.reply({ content: `❌ | Produto não encontrado.`, flags: 64 })

      GerenciarProduto(interaction, 3, produto)
    }
  }
}