
const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } = require("discord.js")
const { produtos, carrinhos, configuracao, pagamentos } = require("../../database");
const { QuickDB } = require("../../database/jsondb");
const { GerenciarCampos, GerenciarCampos2 } = require("../../Functions/GerenciarCampos");
const { MessageStock } = require("../../Functions/ConfigEstoque.js");
const { MessageCreate } = require("../../Functions/SenderMessagesOrUpdates");
const { VerificaçõesCarrinho, CreateCarrinho } = require("../../Functions/CreateCarrinho");
const { DentroCarrinho1, DentroCarrinho2, DentroCarrinhoPix, DentroCarrinhoEfiBank, DentroCarrinhoMisticPay, DentroCarrinhoImap } = require("../../Functions/DentroCarrinho");
const { enviarLogJogo } = require("../../Functions/GamepassProdutos");
const { VerificarCupom, AplicarCupom } = require("../../Functions/VerificarCupom");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const db = new QuickDB()
const { EmojisHelper } = require("../../database");

const Emojis = EmojisHelper;


function safeEmoji(name, fallback) {
    const e = EmojisHelper.get(name);
    if (e && e.trim().length > 0) return e;
    return (fallback && fallback.trim().length > 0) ? fallback : null;
}


function applyEmoji(btn, name, fallback) {
    const e = safeEmoji(name, fallback);
    if (e) btn.setEmoji(e);
    return btn;
}


async function gerarQRCodeSeguro(pixCode) {
    try {
        const { qrGenerator } = require('../../Lib/QRCodeLib.js');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(pixCode);
        const buffer = Buffer.from(qrcode.response, "base64");
        return new AttachmentBuilder(buffer, { name: "payment.png" });
    } catch (error) {
        console.log('[QR CODE] Servidor limitado ou erro ao gerar imagem, usando apenas código copia e cola');
        return null;
    }
}


module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {


        if (interaction.type == Discord.InteractionType.ModalSubmit) {

            if (interaction.customId === '2313awdawdawdawdaw123141') {

                let cupom = interaction.fields.getTextInputValue('tokenMP');

                await VerificarCupom(interaction, cupom)

                


            }


            if (interaction.customId === '2313141') {

                let qtd = interaction.fields.getTextInputValue('tokenMP');



                const ggg = carrinhos.get(interaction.channel.id)

                
                if (ggg && ggg.infos.tipo === 'jogo') {
                    if (isNaN(qtd) || qtd <= 0 || qtd % 1 !== 0) {
                        return interaction.reply({ content: `Quantidade inválida.`, flags: 64 });
                    }
                    await carrinhos.set(`${interaction.channel.id}.quantidadeselecionada`, parseInt(qtd));
                    DentroCarrinho1(interaction, 1);
                    return;
                }

                const hhhh = produtos.get(`${ggg.infos.produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.infos.campo)

                if (isNaN(qtd) || qtd <= 0 || qtd % 1 !== 0) {
                    return interaction.reply({
                        content: `${Emojis.get(`question_emoji`)} A quantidade \`${qtd}\` não é um número inteiro válido ou é menor ou igual a zero, tente novamente.`,
                        flags: 64
                    });
                }

                if (qtd > gggaaa.estoque.length) {
                    return interaction.reply({
                        content: `${Emojis.get(`negative`)} A quantidade solicitada de \`${qtd}\` excede o estoque disponível.`,
                        flags: 64
                    });
                }


                if (ggg.cupomadicionado !== undefined) {
                    const hhhh = produtos.get(`${ggg.infos.produto}.Cupom`)
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.cupomadicionado)

                    if (gggaaa.condicoes?.precominimo !== undefined) {

                        if (qtd < gggaaa.condicoes?.precominimo) {
                            return interaction.reply({ content: `${Emojis.get(`negative`)} A quantidade solicitada de \`${qtd}\` não está no valor minimo para utilizar o cupom de \`${gggaaa.condicoes?.precominimo}\`.`, flags: 64 })
                        }

                        if (qtd > gggaaa.condicoes?.qtdmaxima) {
                            return interaction.reply({ content: `${Emojis.get(`negative`)} A quantidade solicitada de \`${qtd}\` excede o limite para o uso do cupom de \`${gggaaa.condicoes?.precominimo}\`.`, flags: 64 })
                        }

                    }

                }

                await carrinhos.set(`${interaction.channel.id}.quantidadeselecionada`, qtd)

                DentroCarrinho1(interaction, 1)

            }
        }





        let infos = {}

        if (interaction.isButton()) {
            
            try {
                const carrinhoAtual = carrinhos.get(interaction.channel?.id);
                if (carrinhoAtual) {
                    carrinhoAtual.lastActivity = Date.now();
                    carrinhos.set(interaction.channel.id, carrinhoAtual);
                }
            } catch (e) {}

            if (interaction.customId == 'codigocopiaecola') {
                const yy = await carrinhos.get(interaction.channel.id)
                interaction.reply({ content: `${yy.pagamentos.cp}`, flags: 64 })

            }

            
            if (interaction.customId == `codigocopiaecola_gerado`) {
                const pag = await pagamentos.get(interaction.channel.id)
                if (pag && pag.pagamentos && pag.pagamentos.cp) {
                    interaction.reply({ content: `${pag.pagamentos.cp}`, flags: 64 })
                } else {
                    interaction.reply({ content: `${Emojis.get(`negative`)} Código PIX não encontrado!`, flags: 64 })
                }
            }

if (interaction.customId == 'pagarpix') {
    
    const misticStatus = configuracao.get("pagamentos.MisticSystem") || false;
    const imapStatus = configuracao.get("pagamentos.imap.status") || false; 
    const efiStatus = configuracao.get("pagamentos.sistema_efi") || false;

    
           if (misticStatus) {
        
           DentroCarrinhoMisticPay(interaction, client);
             } 
              else if (imapStatus) {
        
        
               DentroCarrinhoImap(interaction, client);
             } 
             else if (efiStatus) {
        
              DentroCarrinhoEfiBank(client, interaction);
             } 
              else {
        
                DentroCarrinhoPix(interaction, 1);
              }
            }
          
            if (interaction.customId == 'voltarcarrinho') {
                DentroCarrinho1(interaction, 1)
            }

            if (interaction.customId == `irparapagamento`) {
                try {
                    if (configuracao.get(`pagamentos.SemiAutomatico.status`) == true) {
                        interaction.deferUpdate()
                        await interaction.message.edit({ content: `${Emojis.get(`loading`)||''} Espere um momento...`, components: [], embeds: [] })

                        const pagamento = configuracao.get(`pagamentos.SemiAutomatico`)
                        const yy = await carrinhos.get(interaction.channel.id)

                        let valor = 0
                        if (yy.infos.tipo === 'jogo') {
                            valor = yy.infos.preco * (yy.quantidadeselecionada || 1);
                        } else {
                            const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
                            const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)
                            if (yy.cupomadicionado !== undefined) {
                                const valor2 = gggaaa.valor * yy.quantidadeselecionada
                                const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                                const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
                                valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                            } else {
                                valor = gggaaa.valor * yy.quantidadeselecionada
                            }
                        }

                        const { QrCodePix } = require('qrcode-pix')

                        const valor2 = Number(valor.toFixed(2))
                        const qrCodePix = QrCodePix({
                            version: '01',
                            key: pagamento.pix,
                            name: pagamento.pix,
                            city: 'BRASILIA',
                            cep: `28360000`,
                            value: valor2,
                        });

                        const chavealeatorio = qrCodePix.payload()
                        const attachment = await gerarQRCodeSeguro(chavealeatorio);

                        const embed = new EmbedBuilder()
                            .setColor(`${configuracao.get(`Cores.Principal`) == null ? `#2b2d31` : configuracao.get(`Cores.Principal`)}`)
                            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                            .setDescription(`-# ${Emojis.get(`lock`)||``} **Ambiente Seguro**\n-# Seu pagamento será processado em um ambiente 100% seguro e protegido.\n\n-# ℹ️ **Pagamento Semi Auto**\n-# Assim que o pagamento for confirmado, Envie o Comprovante nesse Canal para o pagamento ser Aprovado!!`)
                            .setTitle(`${Emojis.get(`pix_stamp_emoji`)||``} Pagamento via PIX criado`)
                            .addFields(
                                { name: `${Emojis.get(`dinheiro`)||''} Valor da Compra`, value: `\`R$ ${Number(valor).toFixed(2)}\``, inline: true }
                            )
                            .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` })
                            .setTimestamp()

                        if (attachment) {
                            embed.setImage('attachment://payment.png')
                        }

                        const row3 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("codigocopiaecolaadwdawd")
                                    .setLabel(`Código copia e cola`)
                                    .setEmoji(Emojis.get(`codigocopia`) || '📋')
                                    .setStyle(2),
                                applyEmoji(
                                    new ButtonBuilder()
                                        .setCustomId("confirmarpagamentomanual")
                                        .setLabel('Confirmar pagamento')
                                        .setStyle(3),
                                    'setaduoroyalty', Emojis.get('checker') || ''
                                ),
                                applyEmoji(
                                    new ButtonBuilder()
                                        .setCustomId("deletchannel")
                                        .setLabel('Deletar')
                                        .setStyle(4),
                                    '_trash_emoji`, `${Emojis.get(`_trash_emoji`)||'`}️`
                                ),
                            )

                        const editOptions = { content: ``, embeds: [embed], components: [row3] };
                        if (attachment) {
                            editOptions.files = [attachment];
                        }
                        await interaction.message.edit(editOptions)
                        await interaction.channel.send({ content: `||${interaction.user}|| ${pagamento.msg}` })

                        interaction.channel.setName(`🛒・${interaction.user.username}・${interaction.user.id}`)

                    } else {
                        DentroCarrinho2(interaction)
                    }
                } catch (err) {
                    console.error(`[irparapagamento] Erro:`, err.message);
                    try {
                        await interaction.message.edit({
                            content: `${Emojis.get(`negative`)||''} Ocorreu um erro ao gerar o pagamento. Tente novamente.`,
                            components: [],
                            embeds: []
                        });
                    } catch {}
                }
            }

            if (interaction.customId == 'confirmarpagamentomanual') {

                const perm = await getPermissions(client.user.id)
                if (perm === null || !perm.includes(interaction.user.id)) {
                    return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não possui permissão para usar esse comando.`, flags: 64 });
                }

                if (carrinhos.has(interaction.channel.id) == false) return interaction.reply({ content: `${Emojis.get(`negative`)} Não há um carrinho aberto neste canal.`, flags: 64 })

                interaction.message.delete()

                const yy = await carrinhos.get(interaction.channel.id)

                let valor = 0
                if (yy.infos.tipo === `jogo`) {
                    valor = yy.infos.preco * (yy.quantidadeselecionada || 1);
                } else {
                    const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
                    const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo)
                    if (yy.cupomadicionado !== undefined) {
                        const valor2 = gggaaa.valor * yy.quantidadeselecionada
                        const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                        const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado)
                        valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                    } else {
                        valor = gggaaa.valor * yy.quantidadeselecionada
                    }
                }




                const mandanopvdocara = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
                    .setAuthor({ name: `Pedido #Aprovado Manualmente` })
                    .setTitle(`${Emojis.get(`_cart_emoji`)||``}️ Pedido solicitado`)
                    .setFooter(
                        { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                    )
                    .setTimestamp()
                    .setDescription(`Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                    )

                try {
                    await interaction.user.send({ embeds: [mandanopvdocara] })
                } catch (error) {

                }



                const dsfjmsdfjnsdfj = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
                    .setAuthor({ name: `Pedido #Aprovado Manualmente` })
                    .setTitle(`${Emojis.get(`_cart_emoji`)||``}️ Pedido solicitado`)
                    .setDescription(`Usuário ${interaction.user} solicitou um pedido`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `**Forma de pagamento**`, value: `Manualmente` }
                    )
                    .setFooter(
                        { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
                    )
                    .setTimestamp()





                try {
                    const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
                    await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                        carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id })
                    })
                } catch (error) {

                }

                pagamentos.set(`${interaction.channel.id}`, { pagamentos: { id: `Aprovado Manualmente`, method: `pix`, data: Date.now() } })
                interaction.reply({ content: `${Emojis.get(`check`)} Pagamento aprovado manualmente. Aguarde..`, flags: 64 })

            }

            if (interaction.customId == 'codigocopiaecolaadwdawd') {
                const pagamento = configuracao.get(`pagamentos.SemiAutomatico`)
                interaction.reply({ content: `Chave pix: ${pagamento.pix}`, flags: 64 })
            }

            if (interaction.customId == 'deletchannel') {
                const yy = await carrinhos.get(interaction.channel.id);
                carrinhos.delete(interaction.channel.id);
                pagamentos.delete(interaction.channel.id);

                
                if (yy && yy.infos && yy.infos.tipo === 'jogo') {
                    try {
                        await enviarLogJogo(interaction.client, 'compra_cancelada', {
                            userId: yy.user.id,
                            userTag: yy.user.username || yy.user.tag,
                            nome: yy.infos.nome,
                            preco: yy.infos.preco * (yy.quantidadeselecionada || 1),
                        });
                    } catch(e) {}
                }
                
                
                try {
                    const embedCancelado = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setAuthor({ 
                            name: 'Carrinho Encerrado', 
                            iconURL: 'https://images-ext-1.discordapp.net/external/ZXzGjhpOPu8Pl5ysOHAEieC1Wbr-L3qYWAS4h5cP740/https/public-blob.squarecloud.dev/3605c3eaef113a059abdd63b95adc8db9d08e3a8/CarrinhoFechado_mfvwnn44-fea7.png' 
                        })
                        .setTitle('Pedido Cancelado')
                        .setDescription(`Seu carrinho foi encerrado. Você pode iniciar uma nova compra a qualquer momento.`)
                        .addFields(
                            { name: `Detalhes do Pedido Cancelado`, value: `\`${yy?.quantidadeselecionada || 1}x ${yy?.infos?.produto || `Produto`} - ${yy?.infos?.campo || `Campo`}\`` }
                        )
                        .setFooter({ text: `${interaction.guild.name} • ${new Date().toLocaleDateString(`pt-BR`)}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp();
                    
                    await interaction.user.send({ embeds: [embedCancelado] });
                } catch (error) {
                    
                }
                
                interaction.channel.delete()
            }


            if (interaction.customId == 'usarcupom') {


                const modalaAA = new ModalBuilder()
                    .setCustomId('2313awdawdawdawdaw123141')
                    .setTitle(`Aplicar Cupom`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`CUPOM`)
                    .setPlaceholder(`Qual nome do cupom?`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN)



                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);


            }


            if (interaction.customId == 'editarquantidade') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('2313141')
                    .setTitle(`Alterar Quantidade`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`CÓDIGO`)
                    .setPlaceholder(`Insira a quantia que deseja comprar, exemplo: 3`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN)



                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);

            }


            if (interaction.customId.startsWith('comprarid_')) {

                const gg = interaction.customId
                const yy = gg.replace('comprarid_', '')
                const partes = yy.split('_');
                const campo = partes[0]
                const produto = partes[1]



                const hhhh = produtos.get(`${produto}.Campos`)
                if (hhhh == null) return interaction.reply({ content: `${Emojis.get(`negative`)} Este produto não existe.`, flags: 64 }).then(msg => {
                    interaction.message.delete()
                })
                const gggaaa = hhhh.find(campo22 => campo22.Nome === campo)



                infos = {
                    estoque: gggaaa.estoque.length,
                    produto: produto,
                    campo: campo
                }

            }


            if (interaction.customId.startsWith('editestoque_')) {


                const regex = /editestoque_(.*?)_(.*)/;
                const correspondencias = interaction.customId.match(regex);

                const produto = correspondencias[1];
                const campo = correspondencias[2];

                MessageStock(interaction, 1, produto, campo)





            }



            if (interaction.customId.startsWith('foraestoquealarme_')) {


                const regex = /foraestoquealarme_(.*?)_(.*)_(.*)/;
                const correspondencias = interaction.customId.match(regex);


                const produto = correspondencias[1];
                const campo = correspondencias[2];
                const status = correspondencias[3];

                const hhhh = produtos.get(`${produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === campo)

               if (gggaaa.avisar !== undefined) {
                    if (!gggaaa.avisar.includes(interaction.user.id)) {
                        gggaaa.avisar.push(interaction.user.id)
                        if (status == 1) {
                            interaction.reply({ content: `${Emojis.get(`checker`)} Pronto, agora você será notificado quando \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\` estiver com estoque disponível.`,embeds: [], flags: 64 })
                        } else {
                            await interaction.deferUpdate()

                            await interaction.editReply({ content: `${Emojis.get(`loading`)} Aguarde..`,embeds:[], components: [] });
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            await interaction.editReply({ content: `${Emojis.get(`checker`)} Pronto, agora você será notificado quando \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\` estiver com estoque disponível.`,embeds: [], components: [] })
                        }

                    } else {
                        const indexToRemove = gggaaa.avisar.indexOf(interaction.user.id);

                        if (indexToRemove !== -1) {
                            gggaaa.avisar.splice(indexToRemove, 1);
                        }
                        if (status == 1) {
                            interaction.reply({ content: `${Emojis.get(`checker`)} Certo, você foi **removido** da lista de notificações de estoque de \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\`.`,embeds: [], flags: 64 })
                        } else {
                            await interaction.deferUpdate()

                            await interaction.editReply({ content: `${Emojis.get(`loading`)} Aguarde..`,embeds:[], components: [] });
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            await interaction.editReply({ content: `${Emojis.get(`checker`)} Certo, você foi **removido** da lista de notificações de estoque de \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\`.`,embeds: [], components: [] })
                        }

                    }
                } else {
                    gggaaa.avisar = [interaction.user.id]
                    if (status == 1) {
                        interaction.reply({ content: `${Emojis.get(`checker`)} Pronto, agora você será notificado quando \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\` estiver com estoque disponível.`,embeds: [], flags: 64 })
                    } else {
                        await interaction.deferUpdate()

                        await interaction.editReply({ content: `${Emojis.get(`loading`)} Aguarde..`,embeds:[], components: [] });
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await interaction.editReply({ content: `${Emojis.get(`checker`)} Pronto, agora você será notificado quando \`${produtos.get(`${produto}.Config.name`)} - ${gggaaa.Nome}\` estiver com estoque disponível.`,embeds: [], components: [] })
                    }
                }

                await produtos.set(`${produto}.Campos`, hhhh)

            }

        }

        if (interaction.isStringSelectMenu()) {
            
            if (interaction.customId == `preview_selectmenu`) {
                return interaction.reply({ 
                    content: `${Emojis.get(`negative`)} Você está no modo preview, não é possível abrir carrinho. Poste o produto para que você consiga abrir carrinho.`, 
                    flags: 64 
                });
            }

            if (interaction.customId == 'comprarid') {

                const gg = interaction.values[0]
                const partes = gg.split(`_`);
                const campo = partes[0]
                const produto = partes[1]

                const hhhh = produtos.get(`${produto}.Campos`)
                const gggaaa = hhhh.find(campo22 => campo22.Nome === campo)

                infos = {
                    estoque: gggaaa.estoque.length,
                    produto: produto,
                    campo: campo
                }

            }
        }


        if (Object.keys(infos).length !== 0) {

            const verify = await VerificaçõesCarrinho(infos)

            if (verify.error == 400) {
                
                await interaction.reply({ 
                    content: `${Emojis.get(`loading`)} Iniciando Verificações de Segurança...`, 
                    flags: 64 
                });

                await interaction.editReply({ 
                    content: `${Emojis.get(`loading`)} Verificando disponibilidade no estoque...`,
                    embeds: [],
                    components: []
                });

                const row3 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`foraestoquealarme_${infos.produto}_${infos.campo}_0`)
                            .setLabel('Avisar quando o restock Voltar')
                            .setEmoji(Emojis.get(`_notify_emoji`) || '🔔')
                            .setStyle(1),
                    )

                await interaction.editReply({ 
                    content: `${Emojis.get(`negative`)} Este produto está sem estoque no momento, caso quiser clique abaixo para ser notificado.`, 
                    components: [row3]
                });

                return;

            }
            const hhhh = produtos.get(`${infos.produto}.Campos`)
            const gggaaa = hhhh.find(campo22 => campo22.Nome === infos.campo)

            if (gggaaa.condicao?.idcargo !== undefined) {

                const member = await interaction.guild.members.fetch(interaction.user.id);
                const temCargo = member.roles.cache.has(gggaaa.condicao?.idcargo);
                if (temCargo == false) return interaction.reply({ content: `${Emojis.get(`negative`)} Você não possui permissão para comprar esse produto!`, flags: 64 })
            }

            if (verify.status == 202) {



                CreateCarrinho(interaction, infos)




            }
        }

    }
}