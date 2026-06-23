const { EmbedBuilder, ApplicationCommandType } = require("discord.js");
const { Painel } = require("../../Functions/Painel");
const { pedidos, pagamentos, carrinhos, configuracao, produtos } = require("../../database");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { Emojis } = require("../../database");

module.exports = {
  name: "entregar",
  description: "[🛠️ | Moderação] Use para aprovar algum carrinho",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const startTime = Date.now();

    try {
      const perm = await getPermissions(client.user.id);
      if (!perm || !perm.includes(interaction.user.id)) {
        return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não possui permissão para usar esse comando.`, flags: 64 });
      }

      if (!carrinhos.has(interaction.channel.id)) {
        return interaction.reply({ content: `${Emojis.get(`negative`)} Não há um carrinho aberto neste canal.`, flags: 64 });
      }

      await interaction.reply({ content: `${Emojis.get(`checker`)} Pagamento aprovado manualmente. Aguarde..`, flags: 64 });

      const yy = carrinhos.get(interaction.channel.id);

      if (!yy || !yy.infos) {
        return interaction.editReply({ content: `${Emojis.get(`negative`)} Dados do carrinho inválidos.` });
      }

      const hhhh = yy.infos.produto ? produtos.get(`${yy.infos.produto}.Campos`) : null;
      const gggaaa = hhhh ? hhhh.find(campo22 => campo22.Nome === yy.infos.campo) : null;

      if (!gggaaa && yy.infos.tipo !== 'jogo') {
        return interaction.editReply({ content: `${Emojis.get(`negative`)} Campo do produto não encontrado. Verifique as configurações.` });
      }

      let valor = gggaaa ? (gggaaa.valor * (yy.quantidadeselecionada || 1)) : (yy.infos.preco || 0);
      if (yy.cupomadicionado && hhhh) {
        const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
        const gggaaaawdwadwa = hhhh2 ? hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado) : null;
        if (gggaaaawdwadwa) valor *= (1 - gggaaaawdwadwa.desconto / 100);
      }

      const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const embedColor = configuracao.get('Cores.Processamento') || '#fcba03';

      const detalhesValue = yy.infos.tipo === 'jogo'
        ? `\`${yy.quantidadeselecionada || 1}x ${yy.infos.nome} | R$ ${valorFormatado}\``
        : `\`${yy.quantidadeselecionada || 1}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\``;

      const mandanopvdocara = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: 'Pedido #Aprovado Manualmente' })
        .setTitle('🛍️ Pedido solicitado')
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp()
        .setDescription('Seu pedido foi criado e agora está aguardando a confirmação do pagamento')
        .addFields({ name: '**Detalhes**', value: detalhesValue });

      try {
        await interaction.user.send({ embeds: [mandanopvdocara] });
      } catch (error) {
        console.error('Não foi possível enviar mensagem ao usuário:', error);
      }

      const dsfjmsdfjnsdfj = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: 'Pedido #Aprovado Manualmente' })
        .setTitle('🛍️ Pedido solicitado')
        .setDescription(`Usuário ${interaction.user} solicitou um pedido`)
        .addFields(
          { name: '**Detalhes**', value: detalhesValue },
          { name: '**Forma de pagamento**', value: 'Manualmente' }
        )
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      try {
        const channela = await client.channels.fetch(configuracao.get('ConfigChannels.logpedidos'));
        const logMessage = await channela.send({ embeds: [dsfjmsdfjnsdfj] });
        carrinhos.set(`${interaction.channel.id}.replys`, { channelid: logMessage.channel.id, idmsg: logMessage.id });
      } catch (error) {
        console.error('Não foi possível enviar mensagem para o canal de log:', error);
      }

      pagamentos.set(`${interaction.channel.id}`, {
        pagamentos: { id: 'Aprovado Manualmente', method: `pix`, data: Date.now() }
      });

      await interaction.editReply({ content: `${Emojis.get(`checker`)} Pagamento aprovado com sucesso!` });

      const endTime = Date.now();

    } catch (error) {
      console.error(`Erro ao executar o comando:`, error);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: `${Emojis.get(`negative`)} Ocorreu um erro ao processar seu pedido. Tente novamente mais tarde.` });
        } else {
          await interaction.reply({ content: `${Emojis.get(`negative`)} Ocorreu um erro ao processar seu pedido. Tente novamente mais tarde.`, flags: 64 });
        }
      } catch (e) {}
    }
  }
};