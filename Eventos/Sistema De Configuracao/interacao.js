const client = require("../../index");
const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { Painel } = require("../../Functions/Painel");
const { Gerenciar } = require("../../Functions/Gerenciar");
const { ConfigRoles } = require("../../Functions/ConfigRoles");
const { produtos, configuracao } = require("../../database");
const { GerenciarProduto } = require("../../Functions/CreateProduto");
const { semiConfigs } = require("../../Functions/semiConfigs");
const { QuickDB } = require("../../database/jsondb");
const { GerenciarCampos, GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { UpdateMessageProduto } = require("../../Functions/SenderMessagesOrUpdates");
const { FormasDePagamentos } = require("../../Functions/FormasDePagamentosConfig");
const { res } = require("../../res");
const db = new QuickDB();
const emojis = require("../../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};


module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('configproduto_')) {
                GerenciarProduto(interaction, 2, interaction.values[0])
            }


            if (interaction.customId.startsWith('deletarprodutocampo_')) {

                const produtoName = interaction.customId.split(`_`)[1];
                
                if (interaction.values.length == 0) {
                    return interaction.reply({ content: `${Emojis.get(`negative`)} Nenhum campo selecionado.`, flags: 64 })
                }

                
                const camposAtuais = produtos.get(`${produtoName}.Campos`) || [];
                const camposRemovidos = interaction.values;
                const camposRestantes = camposAtuais.filter(campo => !camposRemovidos.includes(campo.Nome));
                produtos.set(`${produtoName}.Campos`, camposRestantes);

                await interaction.update({ content: `${Emojis.get(`checker`)} | ${camposRemovidos.length} campo(s) removido(s) com sucesso!`, components: [] })
                await UpdateMessageProduto(client, produtoName)
            }



            if (interaction.customId == 'configurarcampooo') {



                GerenciarCampos2(interaction, interaction.values[0])
            }

        }

        if (interaction.type == Discord.InteractionType.ModalSubmit) {
            if (interaction.customId === 'ConfigurarPagamentoManual2') {
                let a2 = interaction.fields.getTextInputValue('tokenMP2');
                let a3 = interaction.fields.getTextInputValue(`tokenMP3`);

                const statusAtual = configuracao.get(`pagamentos.SemiAutomatico.status`) || false;
                configuracao.set(`pagamentos.SemiAutomatico`, { status: statusAtual, pix: a2, msg: a3 })

                semiConfigs(interaction, client);

                interaction.followUp({ content: `${Emojis.get(`checker`)} Configuração salva.`, flags: 64 })

            }
        }

        if (interaction.isButton()) {

             if (interaction.customId == "ConfigurarPagamentoManual") {

             await interaction.update({ content: `${Emojis.get(`loading`)} Carregando...`, embeds: [], components: [] })

              semiConfigs(interaction, client);

            }

            if (interaction.customId == 'editConfigSemi') {

                const dd = configuracao.get(`pagamentos.SemiAutomatico`)

                const modalaAA = new ModalBuilder()
                    .setCustomId('ConfigurarPagamentoManual2')
                    .setTitle(`Configurar Pagamento Manual`);

                const newnameboteE = new TextInputBuilder()
                    .setCustomId(`tokenMP2`)
                    .setLabel(`CHAVE PIX`)
                    .setPlaceholder(`Insira uma chave pix válida`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`${dd == null ? `` : dd.pix || ''}`)
                    .setRequired(true)

                const newnameboteD = new TextInputBuilder()
                    .setCustomId(`tokenMP3`)
                    .setLabel(`MENSAGEM APÓS REQUISIÇÃO DO PEDIDO`)
                    .setPlaceholder(`Insira aqui uma mensagem, ex: após o pagamento, envie o comprovante aqui.`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`${dd == null ? `` : dd.msg || ''}`)
                    .setRequired(true)

                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteE);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteD);


                modalaAA.addComponents(firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'onOffSemi') {
                const statusAtual = configuracao.get(`pagamentos.SemiAutomatico.status`);
                const novoStatus = statusAtual === true ? false : true;
                configuracao.set(`pagamentos.SemiAutomatico.status`, novoStatus);
                
                semiConfigs(interaction, client);
            }



            if (interaction.customId == 'Voltar4') {
                const ggg2 = await db.get(interaction.message.id)
                GerenciarCampos(interaction, ggg2.name)
            }

            if (interaction.customId == 'Voltar10') {
                const ggg2 = await db.get(interaction.message.id)
                GerenciarCampos2(interaction, ggg2.camposelect, ggg2.name, true)
            }



            if (interaction.customId == 'gerenciarcampossss') {

                const ggg2 = await db.get(interaction.message.id)
                await db.set(`${interaction.user.id}.createCampoProduto`, ggg2)
                const ggg = produtos.get(`${ggg2.name}.Campos`)
                const gggaa = produtos.get(`${ggg2.name}`)


                if (ggg.length == 1) {
                    GerenciarCampos2(interaction, ggg[0].Nome)

                } else {


                    const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
                        .setCustomId('configurarcampooo')
                        .setPlaceholder('Clique aqui para selecionar')
                        .setMinValues(0)

                    for (const gggg of ggg) {

                        const gggag = gggg.desc == '' ? `Não definido` : `${gggg.desc}`

                        const option = {
                            label: `${gggg.Nome}`,
                            description: `${gggag}`,
                            value: gggg.Nome,
                            emoji: '1178163524443316285'
                        };

                        selectMenuBuilder.addOptions(option);
                    }

                    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
                    try {
                        await interaction.update({ components: [style2row], content: `${interaction.user} Quais campos de \`${gggaa.Config.name}\` deseja gerenciar?`, embeds: [] })
                    } catch (error) {
                    }
                }
            }





            if (interaction.customId == `remcampo`) {
                const ggg2 = await db.get(interaction.message.id)
                const ggg = produtos.get(`${ggg2.name}.Campos`)

                if (ggg == 0 || !ggg || ggg.length === 0) {
                    interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Esse produto ainda não possuí nenhum campo.` })
                    return
                }

                const ggg22 = produtos.get(`${ggg2.name}`)

                const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
                    .setCustomId(`deletarprodutocampo_${ggg2.name}`)
                    .setPlaceholder('Clique aqui para selecionar')
                    .setMinValues(1)

                for (const gggg of ggg) {

                    const gggag = gggg.desc == '' ? `Não definido` : `${gggg.desc}`
                    const option = {
                        label: `${gggg.Nome}`,
                        description: `${gggag.slice(0, 70)}`,
                        value: gggg.Nome,
                        emoji: `1178163524443316285`
                    };

                    selectMenuBuilder.addOptions(option);
                }

                selectMenuBuilder.setMaxValues(selectMenuBuilder.options.length)
                const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);

                try {
                    await interaction.reply({ components: [style2row], content: `${Emojis.get(`info`)} Quais campos de \`${ggg22.Config.name}\` deseja remover?`, flags: 64 })
                } catch (error) {
                }
            }


            if (interaction.customId == `addcampoo`) {
                const ggg2 = await db.get(interaction.message.id)
                const ggg = produtos.get(`${ggg2.name}.Campos`)
                if (ggg.length >= 24) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Você já adicionou o máximo de campos possível nesse produto.` })


                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju112341111idsjjsdua')
                    .setTitle(`Criar campo`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DO CAMPO`)
                    .setPlaceholder(`Insira o nome desejado`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`DESCRIÇÃO DO CAMPO`)
                    .setPlaceholder(`Insira uma descriação desejada`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setMaxLength(4000)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`PREÇO DO CAMPO`)
                    .setPlaceholder(`Insira um preço desejado (BRL)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
              const newnameboteN24 = new TextInputBuilder()
                    .setCustomId('tokenMP7')
                    .setLabel(`Ponha um emoji`)
                    .setPlaceholder(`Ponha Um Emoji`)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(20)
                    .setRequired(false)


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN24)



                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5,firstActionRow6);
                await interaction.showModal(modalaAA);


            }




            if (interaction.customId == 'voltargerenciarproduto') {
                const ggg = await db.get(interaction.message?.id) || await db.get(`${interaction.user.id}.createCampoProduto`)
                GerenciarProduto(interaction, 2, ggg.name)
            }


            if (interaction.customId == 'gencampos') {

                const ggg = await db.get(interaction.message.id)
                GerenciarCampos(interaction, ggg.name)


            }



            if (interaction.customId == 'editproduto') {

                const ggg = await db.get(interaction.message.id)

                const hhh = produtos.get(ggg.name)

                const modalaAA = new ModalBuilder()
                    .setCustomId('Editar')
                    .setTitle(`Criação`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME`)
                    .setPlaceholder(`Insira o nome desejado`)
                    .setValue(`${hhh.Config.name}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`DESCRIÇÃO`)
                    .setPlaceholder(`Insira uma descriação desejada`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(`${hhh.Config.desc}`)
                    .setRequired(false)
                    .setMaxLength(1024)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`ENTREGA NA DM DO CLIENTE?`)
                    .setPlaceholder(`Digite "sim" ou "não"`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`${hhh.Config.entrega}`)
                    .setMaxLength(3)
                    .setRequired(false)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId(`tokenMP4`)
                    .setLabel(`ICONE`)
                    .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`${hhh.Config.icon == undefined ? `` : hhh.Config.icon}`)
                    .setRequired(false)

                const newnameboteN6 = new TextInputBuilder()
                    .setCustomId(`tokenMP5`)
                    .setLabel(`BANNER`)
                    .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(`${hhh.Config.banner == undefined ? `` : hhh.Config.banner}`)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);



                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);


            }




               if (interaction.customId == "gerenciarotemae") {
        await interaction.update({
          embeds: [],
          components: [],
          content: `${Emojis.get(`loading`)} Aguarde...`,
        });

        const ggg = produtos.fetchAll();
        const placeholderPrefix = "Clique aqui para selecionar";

        const allSelectMenus = [];
        let optionsCount = 0;
        let currentSelectMenuBuilder;

        
        for (const gggg of ggg) {

            let aaaaaa;

            
            let desc = gggg?.data?.Config?.desc

            if(desc == undefined) {
                desc = "Não definido";
            }
            if (desc && desc.length > 0) {
                aaaaaa = desc.slice(0, 70);
            } else {
                aaaaaa = "Não definido";
            }
            
           
            let name = gggg?.data?.Config?.name
            if(name == undefined) {
                name = "Não definido";
            }
            const option = {
                label: `${name}`,
                description: `${aaaaaa}`,
                value: gggg.ID,
                emoji: "1178163524443316285",
            }
            
          if (optionsCount % 25 === 0) {
            if (currentSelectMenuBuilder) {
              allSelectMenus.push(currentSelectMenuBuilder);
            }

            currentSelectMenuBuilder = new Discord.StringSelectMenuBuilder()
              .setCustomId(`configproduto_${optionsCount / 25 + 1}`)
              .setPlaceholder(
                `[${optionsCount / 25 + 1}] ${placeholderPrefix}`
              );
          }

          currentSelectMenuBuilder.addOptions(option);
          optionsCount++;
        }

        if (currentSelectMenuBuilder) {
          allSelectMenus.push(currentSelectMenuBuilder);
        }

        const rows = allSelectMenus.map((selectMenuBuilder) => {
          return new ActionRowBuilder().addComponents(selectMenuBuilder);
        });

        const row4 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("voltar3")
            .setLabel("Voltar")
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
        );

        interaction.editReply({
          components: [...rows, row4],
          content: `${interaction.user} Qual produto deseja gerenciar?`,
        });
      }

        }

        if (interaction.type == Discord.InteractionType.ModalSubmit) {
            if (interaction.customId === 'sdaju112341111idsjjsdua') {
                let nomecampo = interaction.fields.getTextInputValue('tokenMP');
                let desccampo = interaction.fields.getTextInputValue('tokenMP2');
                let precocampo = interaction.fields.getTextInputValue('tokenMP3');
                let emojicampo = interaction.fields.getTextInputValue('tokenMP7');

                                
                if (!emojicampo) {
                    emojicampo = '1449070464981930015';
                }
              
                nomecampo = nomecampo.replace('.', ``)
                const ggg = await db.get(interaction.message.id)

              

                if (isNaN(precocampo)) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Preço inserido \`${precocampo}\` inválido.` })

                const produtoExistente = produtos
                    .filter(produto => produto.data.Campos)
                    .some(produto => produto.data.Campos.some(campo => campo.Nome === nomecampo));



                if (produtoExistente) return interaction.reply({ flags: 64, content: `${Emojis.get(`negative`)} Nome do campo já existente.` })

                produtos.push(`${ggg.name}.Campos`, {
                    estoque: [],
                    valor: Number(precocampo),
                    Nome: nomecampo,
                    desc: desccampo,
                    emoji: emojicampo,
                    criado: Date.now()
                })

                await GerenciarCampos(interaction, ggg.name)

                interaction.followUp({ content: `${Emojis.get(`checker`)} Campo adicionado.`, flags: 64 }).catch(() => {})
                await UpdateMessageProduto(client, ggg.name)








            }





            if (interaction.customId === 'Editar') {
                await interaction.deferUpdate();
                
                let nome = interaction.fields.getTextInputValue('tokenMP');
                let desc = interaction.fields.getTextInputValue('tokenMP2');
                let enttrega = interaction.fields.getTextInputValue('tokenMP3');
                let icon = interaction.fields.getTextInputValue('tokenMP4');
                let banner = interaction.fields.getTextInputValue('tokenMP5');
                
                const ggg = await db.get(interaction.message.id);
            
                if (enttrega !== '') {
                    enttrega = (enttrega.toLowerCase() === 'não') ? 'Não' : 'Sim';
                    produtos.set(`${ggg.name}.Config.entrega`, enttrega);
                }
            
                produtos.set(`${ggg.name}.Config.name`, nome);
            
                if (desc !== '') {
                    produtos.set(`${ggg.name}.Config.desc`, desc);
                } else {
                    produtos.delete(`${ggg.name}.Config.desc`);
                }
            
                
                if (icon !== '' && isURL(icon)) {
                    produtos.set(`${ggg.name}.Config.icon`, icon);
                } else {
                    produtos.delete(`${ggg.name}.Config.icon`);
                }
            
                
                if (banner !== `` && isURL(banner)) {
                    produtos.set(`${ggg.name}.Config.banner`, banner);
                } else {
                    produtos.delete(`${ggg.name}.Config.banner`);
                }
            
                await GerenciarProduto(interaction, 4, ggg.name);
                interaction.followUp({ content: `${Emojis.get(`checker`)} | Produto atualizado com sucesso!`, flags: 64 });
            }
            


            function isURL(str) {
                
                const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
                return urlRegex.test(str);
            }


            if (interaction.customId === 'sdaju11111idsjjsdua') {

                let nome = interaction.fields.getTextInputValue('tokenMP');
                let desc = interaction.fields.getTextInputValue('tokenMP2');
                let enttrega = interaction.fields.getTextInputValue('tokenMP3');
                let icon = interaction.fields.getTextInputValue('tokenMP4');
                let banner = interaction.fields.getTextInputValue('tokenMP5');
              
                nome = nome.replace('.', '');
                
                if (enttrega.toLowerCase() !== 'não' && enttrega.toLowerCase() !== 'nao') {
                    enttrega = 'Sim'
                } else {
                    enttrega = 'Não'
                }

                if (desc == '') {
                    desc = `Não definido`
                }

                if (produtos.get(`${nome}`) !== null) return interaction.reply({ content: `${Emojis.get(`negative`)} | Opss, ja existe um produto com esse nome.`, flags: 64 })

                await interaction.deferUpdate();

                produtos.set(`${nome}`, {
                    Config: {
                        name: nome,
                        desc: desc,
                        entrega: enttrega,
                        icon: icon,
                        banner: banner,
                        dataCriacao: Date.now()
                    },
                    Campos: [],
                    Cupom: []
                })

                await GerenciarProduto(interaction, 4, nome)
                interaction.followUp({ content: `${Emojis.get(`checker`)} | Produto criado com sucesso!`, flags: 64 })
            }
        }






    }
}















