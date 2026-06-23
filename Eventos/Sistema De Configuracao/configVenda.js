
const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { produtos, configuracao } = require("../../database");
const { QuickDB } = require("../../database/jsondb");
const { GerenciarCampos, GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { MessageStock } = require("../../Functions/ConfigEstoque.js");
const { MessageCreate, UpdateMessageProduto } = require("../../Functions/SenderMessagesOrUpdates");
const db = new QuickDB();
const emojis = require("../../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};


module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isChannelSelectMenu()) {

            if (interaction.customId == 'selecionarcanalpostar') {

                MessageCreate(interaction, client)






            }

        }


        if (interaction.type == Discord.InteractionType.ModalSubmit) {
            if (interaction.customId === 'awdawdawdawdadawdawfewfryty565') {

                let a1 = interaction.fields.getTextInputValue('tokenMP');
                const ggg = await db.get(interaction.message.id)



                const selectaaa = new Discord.ChannelSelectMenuBuilder()
                    .setCustomId('selecionarcanalpostar')
                    .setPlaceholder(`Clique aqui para selecionar`)
                    .setChannelTypes(Discord.ChannelType.GuildText)

                const row1 = new ActionRowBuilder()
                    .addComponents(selectaaa);

                interaction.reply({ components: [row1], content: `${Emojis.get(`info`)} Selecione o canal onde quer postar a mensagem.`, flags: 64, })


                if (a1 == '') a1 = '#0cd4cc'

                db.set(`${interaction.user.id}_colocarvenda`, { produto: ggg.name, colorembed: a1 })


            } else if (interaction.customId === 'awdawdawdawdawdwadwadawdwaadawdawfewfryty565') {
                let a1 = interaction.fields.getTextInputValue('tokenMP');
                let a2 = interaction.fields.getTextInputValue('tokenMP2');
                let a3 = interaction.fields.getTextInputValue('tokenMP3');
                let a4 = interaction.fields.getTextInputValue('tokenMP4');

                if (a4 !== ``) {
                    const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

                    if (!hexColorRegex.test(a4)) return interaction.reply({ content: `${Emojis.get(`negative`)} | Código Hex Color inválido.`, flags: 64 })
                }

                const ggg = await db.get(interaction.message.id)

                if (a3 !== '') {
                    if (a3 !== 'verde' && a3 !== 'azul' && a3 !== 'cinza' && a3 !== `vermelho`) return interaction.reply({ content: `${Emojis.get(`negative`)} Você interagiu incorretamente no estilo do Button`, flags: 64 })
                } else {
                    a3 = 'cinza'
                }

                if (a1 == '') a1 = '<:carrin:1191792807451562004>'

                if (a2 == '') a2 = 'Comprar'

                if (a4 == '') a4 = '#2F3136'


                const emojiRegex = /^<:.+:\d+>$|^<a:.+:\d+>$|^\p{Emoji}$/u;
                if (!emojiRegex.test(a1)) {
                    a1 = '<:carrin:1191792807451562004>';
                }


                db.set(`${interaction.user.id}_colocarvenda`, { produto: ggg.name, emoji: a1, textobutton: a2, estilobutton: a3, colorembed: a4 })

                const selectaaa = new Discord.ChannelSelectMenuBuilder()
                    .setCustomId('selecionarcanalpostar')
                    .setPlaceholder('Clique aqui para selecionar')
                    .setChannelTypes(Discord.ChannelType.GuildText)

                const row1 = new ActionRowBuilder()
                    .addComponents(selectaaa);

                interaction.reply({ components: [row1], content: `Selecione o canal onde quer postar a mensagem.`, flags: 64, })


            }


            if (interaction.customId.startsWith('wdawdawdawdwadadsadawdwadwdw')) {

                let a1 = interaction.fields.getTextInputValue('tokenMP');
                if (a1 !== `sim`) return interaction.reply({ content: `${Emojis.get(`negative`)} | Ação não validada para realizar reembolso.`, flags: 64 })
                const id = interaction.customId.split(`_`)[1]

                await interaction.reply({ content: `${Emojis.get(`loading`)} | Estornando pagamento...`, flags: 64 })

                const axios = require('axios');
                const refundResponse = await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
                    headers: {
                        'Authorization': `Bearer ${configuracao.get('pagamentos.MpAPI')}`
                    }
                });

                interaction.message.edit({ content: `${Emojis.get(`checker`)} | Pagamento estornado com sucesso. ( Responsavel: ${interaction.user} )`, components: [] })
                interaction.editReply({ content: `${Emojis.get(`checker`)} | Pagamento estornado com sucesso. ( Responsavel: ${interaction.user} )` })
            }

        }


        if (interaction.isButton()) {

            if (interaction.customId.startsWith(`refoundd_`)) {

                const modalaAA = new ModalBuilder()
                    .setCustomId(`wdawdawdawdwadadsadawdwadwdw_${interaction.customId.split(`_`)[1]}`)
                    .setTitle(`Estorno de pagamento`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`Confirmação de estorno`)
                    .setPlaceholder(`digite 'sim' para confirmar.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN)


                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);





            }



            if (interaction.customId == `syncproduto`) {
                const ggg = await db.get(interaction.message.id)

                await interaction.reply({ content: `${Emojis.get(`loading`)} Sincronizando mensagens...`, flags: 64 }).then(async msg => {
                    await UpdateMessageProduto(client, ggg.name)
                    msg.edit({ content: `${Emojis.get(`checker`)} Mensagens sincronizadas.` })
                })
            }

            
            if (interaction.customId == `verpreviewproduto`) {
                const ggg = await db.get(interaction.message.id)
                const produtoData = produtos.get(ggg.name)
                
                if (!produtoData || produtoData.Campos.length === 0) {
                    return interaction.reply({ content: `${Emojis.get(`negative`)} Configure pelo menos um campo antes de ver o preview.`, flags: 64 })
                }

                const { res } = require("../../res");
                
                
                function formatarEmoji(emojiData) {
                    if (!emojiData || emojiData === "") return { id: '1250848496987406487' }; 
                    if (/^\d+$/.test(emojiData)) return { id: emojiData };
                    if (emojiData.includes(':')) {
                        const id = emojiData.split(':')[2].replace('>', '');
                        return { id: id };
                    }
                    return { name: emojiData };
                }

                const itensContainer = [];

                
                if (produtoData.Config?.banner && produtoData.Config.banner.startsWith('http')) {
                    itensContainer.push({
                        type: 12,
                        items: [{ media: { url: produtoData.Config.banner.trim() }, spoiler: false }]
                    });
                }

                itensContainer.push({ type: 14 });

                
                let textoDesc = !produtoData.Config.desc || produtoData.Config.desc == `` ? `Faça sua compra automática abaixo!` : produtoData.Config.desc;
                itensContainer.push({ type: 10, content: textoDesc });

                
                if (produtoData.Campos.length === 1) {
                    itensContainer.push({ type: 14 });
                    itensContainer.push({ 
                        type: 10, 
                        content: `> **Nome Produto**: ${produtoData.Config.name || "Produto"}\n> **Valor:** \`R$ ${Number(produtoData.Campos[0].valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })}\`\n> **Restam:** \`${produtoData.Campos[0].estoque.length}\` unidades` 
                    });
                }

                
                if (produtoData.Campos.length > 1) {
                    itensContainer.push({
                        type: 1, 
                        components: [{
                            type: 3, 
                            custom_id: 'preview_selectmenu',
                            placeholder: `Clique aqui para ver as opções`,
                            options: produtoData.Campos.map(element => ({
                                label: element.Nome,
                                description: `R$ ${Number(element.valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })} - Estoque: ${element.estoque.length}`,
                                value: `preview_${element.Nome}_${ggg.name}`,
                                emoji: formatarEmoji(element.emoji)
                            }))
                        }]
                    });
                }

                let componentesExternos = [];

                
                if (produtoData.Campos.length === 1) {
                    componentesExternos.push(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('preview_comprar_disabled')
                                .setLabel('Comprar')
                                .setEmoji('<:carrin:1191792807451562004>')
                                .setStyle(2)
                                .setDisabled(true)
                        )
                    );
                }

                const payload = res.main(...itensContainer).with({
                    components: componentesExternos,
                    flags: [64]
                });

                await interaction.reply(payload);
            }


            if (interaction.customId == `colocarvenda`) {

                const ggg = await db.get(interaction.message.id)

                const gg2 = produtos.get(`${ggg.name}.Campos`)

                if (gg2.length == 0) return interaction.reply({ content: `${Emojis.get(`negative`)} | Nenhum campo foi configurado.`, flags: 64 })

                if (gg2.length > 1) {

                    const modalaAA = new ModalBuilder()
                        .setCustomId('awdawdawdawdadawdawfewfryty565')
                        .setTitle(`Personalização Opcional`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`COR DO EMBED`)
                        .setPlaceholder(`Insira aqui um código Hex Color, ex: FFFFFF`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)


                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN)



                    modalaAA.addComponents(firstActionRow3);
                    await interaction.showModal(modalaAA);
                } else {

                    const modalaAA = new ModalBuilder()
                        .setCustomId('awdawdawdawdawdwadwadawdwaadawdawfewfryty565')
                        .setTitle(`Personalização Opcional`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`EMOJI`)
                        .setPlaceholder(`Insira aqui um id ou nome de emoji personalizado`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const newnameboteN2 = new TextInputBuilder()
                        .setCustomId('tokenMP2')
                        .setLabel(`TEXTO DO BOTÃO`)
                        .setPlaceholder(`Insira aqui nome personalizado, ex: Comprar`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const newnameboteN3 = new TextInputBuilder()
                        .setCustomId('tokenMP3')
                        .setLabel(`ESTILO DO BOTÃO`)
                        .setPlaceholder(`Insira aqui, verde, azul, cinza ou vermelho.`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const newnameboteN4 = new TextInputBuilder()
                        .setCustomId('tokenMP4')
                        .setLabel(`COR DO EMBED`)
                        .setPlaceholder(`Insira aqui um código Hex Color, ex: FFFFFF`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)


                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN)
                    const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2)
                    const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN3)
                    const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN4)



                    modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6);
                    await interaction.showModal(modalaAA);





                }

            }
        }

    }
}