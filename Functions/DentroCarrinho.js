
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder,InteractionType, ButtonStyle } = require("discord.js")
const { produtos, carrinhos, pagamentos, configuracao, gamepassJogos } = require("../database")
const { QuickDB } = require("../database/jsondb");
const mercadopago = require("mercadopago");
const db = new QuickDB();
const fs = require("fs");
const https = require("https");
const axios = require("axios")
const { EmojisHelper } = require("../database");
const { validateBankNameWithAI } = require("./ImapMonitor");

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
        const { qrGenerator } = require('../Lib/QRCodeLib');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(pixCode);
        const buffer = Buffer.from(qrcode.response, "base64");
        return new AttachmentBuilder(buffer, { name: "payment.png" });
    } catch (error) {
        console.log('[QR CODE] Servidor limitado ou erro ao gerar imagem, usando apenas código copia e cola');
        return null;
    }
}

function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

async function DentroCarrinhoPix(interaction, client) {
    
    interaction.deferUpdate();

    const Entrega24 = configuracao.get(`Emojis_carrinho`);
    let msg = ``;

    if (Entrega24 !== null) {
        Entrega24.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
        
        Entrega24.forEach(element => {
            msg += `<a:${element.name}:${element.id}>`;
        });
    }

    
    const { res: resLoad } = require('../res');
    await interaction.message.edit(
        resLoad.main({ type: 10, content: `${Emojis.get('loading')} Gerando Pagamento...` })
    ).then(async tt => {

        const yy = await carrinhos.get(interaction.channel.id);
        let valor = 0;

        if (yy.infos.tipo === "jogo") {
            valor = yy.infos.preco * yy.quantidadeselecionada;
        } else {
            const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
            const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

            if (yy.cupomadicionado !== undefined) {
                const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado);
                valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
            } else {
                valor = gggaaa.valor * yy.quantidadeselecionada;
            }
        }

        const aaaa = Number(valor).toFixed(2);


        var agora = new Date();
        agora.setMinutes(agora.getMinutes() + 10);
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
        agora.setHours(agora.getHours() - 5);
        var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');


        var payment_data = {
            transaction_amount: Number(aaaa),
            description: `Pagamento - ${interaction.user.username}`,
            date_of_expiration: `${novaDataFormatada}`,
            payment_method_id: 'pix',
            payer: {
                email: `${interaction.user.id}@discord-user.com`, 
                first_name: `Victor André`,
                last_name: `Ricardo Almeida`,
                identification: {
                    type: 'CPF',
                    number: '15084299872'
                },
                address: {
                    zip_code: '86063190',
                    street_name: 'Rua Jácomo Piccinin',
                    street_number: '971',
                    neighborhood: 'Pinheiros',
                    city: 'Londrina',
                    federal_unit: 'PR'
                }
            }
        };
        
        const mpAccessToken = configuracao.get('pagamentos.MpAPI');
        
        
        mercadopago.configurations.setAccessToken(mpAccessToken);
        


        
        
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.`)), 20000)
        );

        try {
            const data = await Promise.race([
                mercadopago.payment.create(payment_data),
                timeoutPromise
            ]);
            
            

            const txid = data.body.id; 
            const pix_copia_cola = data.body.point_of_interaction.transaction_data.qr_code;
            
            
            const attachment = await gerarQRCodeSeguro(pix_copia_cola);

            const embed = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Principal`) == null ? `2b2d31` : configuracao.get('Cores.Principal')}`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
                .addFields(
                   { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get(`information_emoji`)} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setFooter(
                    { text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` }
                )
                .setTimestamp();

            
            if (attachment) {
                embed.setImage(`attachment://payment.png`);
            }

            const row3 = new ActionRowBuilder()
                .addComponents(
                    applyEmoji(
                        new ButtonBuilder()
                            .setCustomId("codigocopiaecola")
                            .setLabel('Código copia e cola')
                            .setStyle(2),
                        'codigocopia', ''
                    ),
                    new ButtonBuilder()
                        .setCustomId("deletchannel")
                        .setLabel(`Cancelar`)
                        .setStyle(4)
                );

            carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `pix` });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `pix`, data: Date.now() });

            
            const editOptions = { embeds: [embed], content: ``, components: [row3] };
            if (attachment) {
                editOptions.files = [attachment];
            }
            await tt.edit(editOptions);


            
            
            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            
            const mandanopvdocara = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
                .setTitle(`Pedido solicitado`)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setDescription(`${Emojis.get(`completedcart_emoji`)} Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
                .addFields(
                    { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                    { name: `ID do Pedido`, value: `\`${txid}\`` },
                    { name: `Forma de Pagamento`, value: `\`Pix - Mercado Pago\`` }
                );

            try {
                await interaction.user.send({ embeds: [mandanopvdocara] });
            } catch (error) {
                console.error(`[PIX MP] - ERRO ao enviar DM para ${interaction.user.id}:`, error);
            }

            
                     const dsfjmsdfjnsdfj = new EmbedBuilder()
                    .setColor(configuracao.get("Cores.Processamento") || "#fcba03")
                    .setAuthor({ name: `Pedido Solicitado` })
                    .setTitle("Pedido solicitado")
                    .setDescription(` ${Emojis.get(`completedcart_emoji`)} Usuário ${interaction.user} solicitou um pedido`)
                    .addFields(
                        { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` }, 
                        { name: "**ID do Pedido**", value: `\`${txid}\`` },
                        { name: "**Forma de pagamento**", value: "Pix - Mercado Pago" }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                try {
                    const logChannelId = configuracao.get(`ConfigChannels.logpedidos`);
                    
                    
                    const channela = await interaction.client.channels.fetch(logChannelId); 

                    if (channela) {
                         await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                            carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id });
                        });
                    } else {
                        console.error(`[PIX MP] - ERRO: Canal de logs (ID: ${logChannelId}) não foi encontrado. Verifique o ID.`);
                    }
                    
                } catch (error) {
                    console.error("[PIX MP] - ERRO ao enviar log de pedido (Permissão ou API):", error);
                }
            


        } catch (error) {
             
            
            let errorMessage = 'A requisição falhou ou expirou. Verifique o Access Token ou os Dados do Pagador.';

            if (error.message === 'TIMEOUT_MP_FATAL: A requisição excedeu 20 segundos.') {
                errorMessage = `ERRO DE TEMPO LIMITE (20s)! O SDK do MP não conseguiu se comunicar. O Access Token deve ser o problema.`;
            } else if (error.response?.data) {
                errorMessage = `ERRO MP: ${error.response.data.message || `Erro de validação.`}. STATUS: ${error.status}.`;
            }
            
            console.error(`[PIX MP] - FALHA CRÍTICA: ${errorMessage}`);
            console.error("Dados de Erro (Verifique o Token/Dados Fictícios):", error.response?.data || error); 
            
            const row3 = new ActionRowBuilder()
                .addComponents(
                    applyEmoji(
                        new ButtonBuilder()
                            .setCustomId("pagarpix")
                            .setLabel('Pix')
                            .setStyle(2),
                        'pix_stamp_emoji', ''
                    ),
                    new ButtonBuilder()
                        .setCustomId("pagarcrypto")
                        .setLabel('PayPal')
                        .setStyle(1)
                        .setEmoji(`<:paypal:1449059320070148227>`)
                        .setDisabled(true),
                    applyEmoji(
                        new ButtonBuilder()
                            .setCustomId("voltarcarrinho")
                            .setLabel('Voltar')
                            .setStyle(2),
                        '_back_emoji', ''
                    )
                );

            const { res: resErrPix } = require('../res');
            await tt.edit(resErrPix.main(
                { type: 10, content: `${Emojis.get('negative')||''} Erro ao criar pagamento: ${errorMessage}\n\nSelecione uma forma de pagamento:` },
                { type: 14 }
            ).with({ components: [row3] }));
        }


    });
}
async function DentroCarrinhoEfiBank(client, interaction) {
    const Entrega24 = configuracao.get(`Emojis_carrinho`)

    let msg = ``

    if (Entrega24 !== null) {
        Entrega24.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
    
        Entrega24.forEach(element => {
            msg += `<a:${element.name}:${element.id}>`
        });
    }

    await interaction.update({ content: `${Emojis.get(`loading`)} Aguarde...`, flags: 64, components: [], embeds: [] })

    try {
        interaction.editReply({ content: `${Emojis.get(`loading`)} Criando seu pagamento...`, flags: 64, components: [], embeds: [] })
        let certificado = fs.readFileSync(`./Lib/${configuracao.get("pagamentos.certificado")}.p12`);

        const httpsAgent = new https.Agent({
            pfx: certificado,
            passphrase: "",
        });

        var data = JSON.stringify({ grant_type: "client_credentials" });
        var data_credentials = configuracao.get(`pagamentos.secret_id`) + ":" + configuracao.get(`pagamentos.secret_token`);
        var auth = Buffer.from(data_credentials).toString("base64");


        var config = {
            method: "POST",
            url: "https://pix.api.efipay.com.br/oauth/token",
            headers: {
                Authorization: "Basic " + auth,
                "Content-Type": "application/json",
            },
            httpsAgent: httpsAgent,
            data: data,
        };

        let access_token = await axios(config).then(function (response) {
            return response.data.access_token
        }).catch(function (error) {
            console.log(`Novo erro: ${error}`)
        })

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

        interaction.editReply({ content: `${Emojis.get(`loading`)} Espere só mais um pouco...`, flags: 64, components: [], embeds: [] })


        var data = JSON.stringify({
            "calendario": {
                "expiracao": 10 * 60
            },
            "devedor": {
                "cpf": "12345678909",
                "nome": `${interaction.user.username}`,
            },
            "valor": {
                "original": `${valor.toFixed(2)}`,
            },
            "chave": `${configuracao.get(`pagamentos.chavepix`)}`,
            "solicitacaoPagador": "Cobrança dos serviços prestados."
        });

        var config = {
            method: "post",
            url: "https://pix.api.efipay.com.br/v2/cob",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            httpsAgent: httpsAgent,
            data: data,
        };

        let response = await axios(config).then(function (response) {
            return response.data
        }).catch(function (error) {
            console.log(error.response.data)
        })

        
        const attachment = await gerarQRCodeSeguro(response.pixCopiaECola);

        const embed = new EmbedBuilder()
            .setColor(`${configuracao.get(`QRCode.principal`) || `#328dbc`}`)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) ? interaction.user.displayAvatarURL({ dynamic: true }) : null })
            .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
            .addFields(
                { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                { name: `${Emojis.get(`information_emoji`)} Código Copia e Cola:`, value: `\`\`\`${response.pixCopiaECola}\`\`\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
            .setTimestamp()

        const row3 = new ActionRowBuilder()
            .addComponents(
                applyEmoji(
                    new ButtonBuilder()
                        .setCustomId("codigocopiaecola")
                        .setLabel('Código copia e cola')
                        .setStyle(2),
                    'codigocopia', ''
                ),
                new ButtonBuilder()
                    .setCustomId("deletchannel")
                    .setLabel(`Cancelar`)
                    .setStyle(4)
            )

        
        if (attachment) {
            if (configuracao.get(`pagamentos.QRCode`) == `miniatura`) {
                embed.setDescription(`-# \`${Emojis.get(`relogio`)||''}\` Caso prefira pagar com Qrcode utilize o Qrcode abaixo.`)
                embed.setThumbnail(`attachment://payment.png`)
            } else {
                embed.setImage(`attachment://payment.png`)
            }
        }

        carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: `efibank` })
        pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: response.txid, cp: response.pixCopiaECola, method: `efibank`, data: Date.now() })

        
        const editOptions = { embeds: [embed], content: ``, components: [row3] };
        if (attachment) {
            editOptions.files = [attachment];
        }
        await interaction.editReply(editOptions)

        interaction.channel.setName(`💳・${interaction.user.username}・${interaction.user.id}`)

        const mandanopvdocara = new EmbedBuilder()
            .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
            .setTitle(`Pedido solicitado`)
            .setFooter(
                { text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) }
            )
            .setTimestamp()
            .setDescription(`Seu pedido foi criado e agora está aguardando a confirmação do pagamento`)
            .addFields(
                { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de Pagamento`, value: `\`Pix - Efi Bank\`` }
            )

        try {
            await interaction.user.send({ embeds: [mandanopvdocara] })
        } catch (error) {

        }

        const dsfjmsdfjnsdfj = new EmbedBuilder()
            .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#fcba03` : configuracao.get(`Cores.Processamento`)}`)
            .setTitle(`Pedido solicitado`)
            .setDescription(`Usuário ${interaction.user} solicitou um pedido.`)
            .addFields(
                { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                { name: `ID do Pedido`, value: `\`${response.txid}\`` },
                { name: `Forma de pagamento`, value: `\`Pix - Efi Bank\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) ? interaction.guild.iconURL({ dynamic: true }) : null })
            .setTimestamp()

        try {
            const channela = await client.channels.fetch(configuracao.get(`ConfigChannels.logpedidos`));
            await channela.send({ embeds: [dsfjmsdfjnsdfj] }).then(yyyyy => {
                carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id })
            })
        } catch (error) {

        }
    } catch (error) {
        console.log(error)
        const row3 = new ActionRowBuilder().addComponents(
            applyEmoji(
                new ButtonBuilder()
                    .setCustomId("pagarpix")
                    .setLabel('Pix')
                    .setStyle(2),
                'pix_stamp_emoji', ''
            ),
            new ButtonBuilder()
                .setCustomId("pagarcrypto")
                .setLabel('Paypal')
                .setStyle(2)
                .setDisabled(true)
        )

        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("pagarCard")
                .setLabel(`Cartão de Crédito/Débito`)
                .setEmoji('💳')
                .setStyle(2)
                .setDisabled(configuracao.get(`pagamentos.MpSite`) == true ? false : true)

        )

        const row5 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voltarcarrinho")
                .setEmoji('⬅️')
                .setStyle(2)

        )

        interaction.editReply({ content: `Selecione uma forma de pagamento.`, flags: 64, components: [row3, row4, row5] })
        interaction.followUp({ content: `Ocorreu um erro ao criar o pagamento, tente novamente.\nError: ${error}`, flags: 64 })
    }
}

async function DentroCarrinhoMisticPay(interaction, client) {
    await interaction.deferUpdate();

    const { res: resLoadMP } = require('../res');
    await interaction.message.edit(
        resLoadMP.main({ type: 10, content: `${Emojis.get(`loading`) || ''} | Gerando Pagamento via Pix...` })
    ).then(async tt => {

        try {
            const yy = await carrinhos.get(interaction.channel.id);
            let valor = 0;

            if (yy.infos.tipo === "jogo") {
                valor = yy.infos.preco * yy.quantidadeselecionada;
            } else {
                const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
                const gggaaa = hhhh.find(campo22 => campo22.Nome === yy.infos.campo);

                if (yy.cupomadicionado !== undefined) {
                    const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                    const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                    const cupomData = hhhh2.find(c => c.Nome === yy.cupomadicionado);
                    valor = valor2 * (1 - cupomData.desconto / 100);
                } else {
                    valor = gggaaa.valor * yy.quantidadeselecionada;
                }
            }

            const aaaa = Number(valor).toFixed(2);
            
            const clientId = configuracao.get('pagamentos.mistclientid');
            const clientSecret = configuracao.get('pagamentos.misticsecret');

            
            const response = await axios.post('https://api.misticpay.com/api/transactions/create', {
                amount: Number(aaaa), 
                payerName: interaction.user.username, 
                payerDocument: '15084299872', 
                transactionId: `ID_${Date.now()}_${interaction.user.id}`, 
                description: `Pagamento Produto: ${yy.infos.produto}` 
            }, {
                headers: { 
                    'ci': clientId, 
                    'cs': clientSecret, 
                    'Content-Type': 'application/json' 
                }
            });

            
            const misticData = response.data.data; 
            
            const pix_copia_cola = misticData.copyPaste; 
            const txid = misticData.transactionId; 
            const qrCodeBase64 = misticData.qrCodeBase64; 

            if (!pix_copia_cola) throw new Error("A API não retornou o campo 'copyPaste'.");

            
            let attachment = null;
            try {
                if (qrCodeBase64) {
                    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
                    const buffer = Buffer.from(base64Data, "base64");
                    attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                }
            } catch (imgError) {
                console.log('[MISTIC PAY] Servidor limitado ou erro ao processar imagem, usando apenas código copia e cola');
            }

            
            const embed = new EmbedBuilder()
                .setColor(configuracao.get('Cores.Principal') || `2b2d31`)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
                .addFields(
                    { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
                    { name: `${Emojis.get(`information_emoji`)} Código copia e cola`, value: `\`\`\`${pix_copia_cola}\`\`\`` }
                )
                .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 minutos.` })
                .setTimestamp();

            
            if (attachment) {
                embed.setImage(`attachment://payment.png`);
            }

            const rowSucesso = new ActionRowBuilder().addComponents(
                applyEmoji(
                    new ButtonBuilder().setCustomId("codigocopiaecola").setLabel('Código copia e cola').setStyle(2),
                    'codigocopia', ''
                ),
                new ButtonBuilder().setCustomId("deletchannel").setLabel(`Cancelar`).setStyle(4)
            );

            
            carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `misticpay` });
            pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `misticpay`, data: Date.now() });

            
            const editOptions = { embeds: [embed], content: ``, components: [rowSucesso] };
            if (attachment) {
                editOptions.files = [attachment];
            }
            await tt.edit(editOptions);

        } catch (error) {
            console.error("[MISTIC PAY] Erro:", error.response?.data || error.message);
            
            const rowErro = new ActionRowBuilder().addComponents(
                applyEmoji(new ButtonBuilder().setCustomId("pagarpix").setLabel('Tentar novamente').setStyle(2), 'pix_stamp_emoji', ''),
                applyEmoji(new ButtonBuilder().setCustomId("voltarcarrinho").setLabel('Voltar').setStyle(2), '_back_emoji', ``)
            );

            await tt.edit({ 
                content: `${Emojis.get(`negative`)||''} Erro ao gerar o Pix na Mistic Pay.\nMotivo: \`${error.response?.data?.message || error.message}\``, 
                components: [rowErro] 
            });
        }
    });
}
async function DentroCarrinhoImap(interaction, client) {
    const customIdModal = `modal_imap_${interaction.user.id}`;
    const modal = new ModalBuilder()
        .setCustomId(customIdModal)
        .setTitle('Identificação do Pagador')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('nome_completo')
                    .setLabel('NOME DO TITULAR (IGUAL AO BANCO)')
                    .setPlaceholder('Ex: Victor André Ricardo Almeida')
                    .setStyle(1).setRequired(true)
            )
        );

    await interaction.showModal(modal);

    const filter = (i) => i.customId === customIdModal && i.user.id === interaction.user.id;
    interaction.awaitModalSubmit({ filter, time: 90000 }).then(async (submitted) => {
        await submitted.deferUpdate();
        const nomePagador = submitted.fields.getTextInputValue(`nome_completo`).trim();

        const { res: resLoadAI } = require('../res');
        const tt = await interaction.message.edit(
            resLoadAI.main({ type: 10, content: `${Emojis.get(`loading`) || ''} | Verificando nome junto ao sistema...` })
        );

        const nomeValido = await validateBankNameWithAI(nomePagador).catch(() => true);
        if (!nomeValido) {
            const { res: resErr } = require(`../res`);
            await tt.edit({
                content: null,
                ...resErr.main(
                    { type: 10, content: `## ${Emojis.get(`negative`) || ''} Nome inválido!\n> O nome **\`${nomePagador}\`** não parece ser um nome bancário válido.\n> Informe o nome completo exatamente como está no banco (ex: **João Silva Pereira**) e tente novamente.` },
                    { type: 14 },
                    { type: 1, components: [{ type: 2, style: 4, label: 'Cancelar', custom_id: `deletchannel` }] }
                )
            });
            return;
        }

        const { res: resLoadPix } = require('../res');
        await tt.edit(resLoadPix.main({ type: 10, content: `${Emojis.get(`loading`) || ''} | Gerando Pagamento via Pix...` }));

        try {
            const yy = await carrinhos.get(interaction.channel.id);
            const pixChave = configuracao.get('pagamentos.imap.chavepiximap');

            
            if (!pixChave || String(pixChave).trim() === '') {
                const { res: resErr } = require('../res');
                await tt.edit({
                    content: null,
                    ...resErr.main(
                        { type: 10, content: `## ${Emojis.get('negative') || '❌'} Chave PIX IMAP não configurada!\n> Acesse o painel **→ Formas de Pagamento → IMAP** e cadastre a chave PIX antes de usar esta forma de pagamento.` },
                        { type: 14 },
                        { type: 1, components: [{ type: 2, style: 4, label: 'Fechar', custom_id: 'deletchannel' }] }
                    )
                });
                return;
            }

            const pixChaveStr = String(pixChave).trim();
            let valor = 0;

            if (yy.infos.tipo === "jogo") {
                valor = yy.infos.preco * yy.quantidadeselecionada;
            } else {
                const hhhh = produtos.get(`${yy.infos.produto}.Campos`);
                const gggaaa = hhhh ? hhhh.find(c => c.Nome === yy.infos.campo) : null;
                if (!gggaaa) {
                    const { res: resErrImap1 } = require('../res');
                    await tt.edit(resErrImap1.main(
                        { type: 10, content: `${Emojis.get('negative')} Campo do produto não encontrado.` },
                        { type: 14 },
                        { type: 1, components: [{ type: 2, style: 4, label: 'Fechar', custom_id: 'deletchannel' }] }
                    ));
                    return;
                }
                if (yy.cupomadicionado !== undefined) {
                    const valor2 = gggaaa.valor * yy.quantidadeselecionada;
                    const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`);
                    const cupomObj = hhhh2 ? hhhh2.find(c => c.Nome === yy.cupomadicionado) : null;
                    valor = cupomObj ? valor2 * (1 - cupomObj.desconto / 100) : valor2;
                } else {
                    valor = gggaaa.valor * yy.quantidadeselecionada;
                }
            }
            const aaaa = Number(valor).toFixed(2);

            function crc16local(data) {
                let crc = 0xFFFF;
                for (let i = 0; i < data.length; i++) {
                    crc ^= data.charCodeAt(i) << 8;
                    for (let j = 0; j < 8; j++) { if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021; else crc <<= 1; }
                }
                return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, `0`);
            }

            const v = aaaa.toString();
            const n = "PIX IMAP";
            const p = ["000201", `26${(22+pixChaveStr.length).toString().padStart(2,`0`)}0014br.gov.bcb.pix01${pixChaveStr.length.toString().padStart(2,`0`)}${pixChaveStr}`, "52040000", "5303986", `54${v.length.toString().padStart(2,`0`)}${v}`, "5802BR", `59${n.length.toString().padStart(2,`0`)}${n}`, "6008BRASILIA", "62070503***"].join("");
            const pix_copia_cola = p + "6304" + crc16local(p + "6304");

            const attachment = await gerarQRCodeSeguro(pix_copia_cola);

            const txid = `IMAP_${Date.now()}_${Math.floor(Math.random()*9999)}`;
            await carrinhos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `imap`, pagador: nomePagador, valor: aaaa });
            await pagamentos.set(`${interaction.channel.id}.pagamentos`, { id: txid, cp: pix_copia_cola, method: `imap`, data: Date.now(), pagador: nomePagador, valor: aaaa });

            const { res: resOk } = require('../res');
            const expiresAt = Math.floor(Date.now() / 1000) + 600;
            const yy2 = carrinhos.get(interaction.channel.id);
            const produtoNome = yy2?.infos?.nome || yy2?.infos?.campo || yy2?.infos?.produto || 'Produto';
            const pagComponents = [
                { type: 9, components: [
                    { type: 10, content: `**${interaction.user.username}** (\`${interaction.user.id}\`)` },
                    { type: 10, content: `## ${Emojis.get(`pix_stamp_emoji`)||'💳'} Pagamento via PIX (Inter/IMAP)` },
                    { type: 10, content: `${Emojis.get(`dinheiro`)||'💰'} **Valor:** \`R$ ${aaaa}\`\n${Emojis.get(`information_emoji`)||'📦'} **Produto:** \`${produtoNome}\`\n${Emojis.get(`time_emoji`)||'⏰'} **Pagador registrado:** \`${nomePagador}\`\n${Emojis.get(`time_emoji`)||'⏰'} **Expira:** <t:${expiresAt}:R>\n-# Aguardando confirmação automática via email (IMAP)...` }
                ], accessory: { type: 11, media: { url: interaction.user.displayAvatarURL({ dynamic: true, size: 128 }) }, spoiler: false } },
                { type: 14 },
                ...(attachment ? [
                    { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] },
                    { type: 14 }
                ] : []),
                { type: 10, content: `${Emojis.get(`codigocopia`)||'📋'} **Código Copia e Cola:**\n\`\`\`${pix_copia_cola}\`\`\`` },
                { type: 14 },
                { type: 1, components: [
                    { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'codigocopiaecola' },
                    { type: 2, style: 4, label: 'Cancelar', custom_id: 'deletchannel' }
                ]},
                { type: 14 },
                { type: 10, content: `-# Área restrita — apenas equipe` },
                { type: 1, components: [
                    { type: 2, style: 3, label: 'Aprovar Manualmente', custom_id: 'confirmarpagamentomanual' }
                ]}
            ];
            const editOptions = { ...resOk.main(...pagComponents) };
            delete editOptions.content;
            if (attachment) editOptions.files = [attachment];
            await tt.edit(editOptions);

            const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            await interaction.user.send({ embeds: [{ color: 0xfcba03, title: `Pedido IMAP solicitado`, description: `Aguardando confirmação do titular: **${nomePagador}**`, fields: [{ name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto||`Roblox`} | R$ ${valorFormatado}\`` }, { name: `ID`, value: `\`${txid}\`` }] }] }).catch(()=>{});

            const logChannelId = configuracao.get('ConfigChannels.logpedidos');
            const logChannel = await interaction.client.channels.fetch(logChannelId).catch(()=>null);
            if (logChannel) {
                await logChannel.send({ embeds: [{ color: 0xfcba03, title: `Pedido IMAP Solicitado`, description: `Usuário ${interaction.user} solicitou PIX via IMAP`, fields: [{ name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x | R$ ${valorFormatado}\`` }, { name: `Titular`, value: `\`${nomePagador}\`` }, { name: `ID`, value: `\`${txid}\`` }] }] }).then(yyyyy => { carrinhos.set(`${interaction.channel.id}.replys`, { channelid: yyyyy.channel.id, idmsg: yyyyy.id }); });
            }
        } catch (error) {
            console.error(`[IMAP]`, error);
            const { res: resErrImap2 } = require('../res');
            await tt.edit(resErrImap2.main(
                { type: 10, content: `${Emojis.get('negative')} Erro ao gerar Pix IMAP.` },
                { type: 14 },
                { type: 1, components: [{ type: 2, style: 4, label: 'Fechar', custom_id: 'deletchannel' }] }
            ));
        }
    }).catch(() => { console.log('[IMAP] Modal expirou.'); });
}

function DentroCarrinho2(interaction) {

    const yd = carrinhos.get(interaction.channel.id)

    
    if (!yd || !yd.infos) {
        return interaction.reply({ content: `${Emojis.get(`negative`)} | Carrinho não encontrado.`, flags: 64 })
    }

    if (yd.infos.tipo !== `jogo`) {
        const hhhh = produtos.get(`${yd.infos.produto}.Campos`)
        const gggaaa = hhhh ? hhhh.find(campo22 => campo22.Nome === yd.infos.campo) : null

        if (gggaaa) {
            if (yd.quantidadeselecionada > gggaaa.condicao?.valormaximo) return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não pode comprar mais de \`${gggaaa.condicao.valormaximo}x ${yd.infos.produto} - ${yd.infos.campo}\``, flags: 64 })
            if (yd.quantidadeselecionada < gggaaa.condicao?.valorminimo) return interaction.reply({ content: `${Emojis.get(`negative`)} | Você não pode comprar menos de \`${gggaaa.condicao.valorminimo}x ${yd.infos.produto} - ${yd.infos.campo}\``, flags: 64 })
        }
    }

    interaction.deferUpdate()

    const row3 = new ActionRowBuilder()
        .addComponents(
            applyEmoji(
                new ButtonBuilder()
                    .setCustomId('pagarpix')
                    .setLabel('Pix')
                    .setStyle(2),
                'pix_stamp_emoji', ''
            ),
            new ButtonBuilder()
                .setCustomId('pagarcrypto')
                .setLabel('Paypal')
                .setEmoji('<:paypal:1449059320070148227>')
                .setStyle(1)
                .setDisabled(true),
            applyEmoji(
                new ButtonBuilder()
                    .setCustomId('voltarcarrinho')
                    .setLabel('Voltar')
                    .setStyle(2),
                '_back_emoji', ''
            )
        )

    const { res: resDC2 } = require('../res');
    interaction.message.edit(resDC2.main(
        { type: 10, content: `Selecione uma forma de pagamento.` },
        { type: 14 }
    ).with({ components: [row3] }))
        .then(async () => {
            
        })
        .catch(err => console.error('[DentroCarrinho2] Erro ao editar mensagem:', err.message));
}
async function DentroCarrinho1(thread, status) {

    let ggg
    if (status == 1) {
        ggg = carrinhos.get(thread.channel.id)
    } else {
        ggg = carrinhos.get(thread.id)
    }

    if (!ggg) {
        try {
            const { EmbedBuilder } = require("discord.js");
            const { configuracao } = require("../database");
            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("Carrinho Expirado")
                .setDescription("Seu carrinho foi fechado por inatividade. Abra um novo carrinho para continuar.");
            if (status == 1) { thread.message?.edit({ embeds: [embed], components: [] }).catch(() => {}); }
            else { thread.send({ embeds: [embed], components: [] }).catch(() => {}); }
        } catch (e) {}
        return;
    }

    
    if (ggg.infos.tipo === 'jogo') {
        let yy = await carrinhos.get(`${ggg.threadid}.quantidadeselecionada`);
        if (yy == null) { await carrinhos.set(`${ggg.threadid}.quantidadeselecionada`, 1); yy = 1; }
        const embed = new EmbedBuilder()
            .setColor(configuracao.get('Cores.Principal') || '#2b2d31')
            .setAuthor({ name: ggg.user.username, iconURL: ggg.user.displayAvatarURL })
            .setTitle('Revisao do Pedido')
            .setFooter({ text: ggg.guild.name })
            .setTimestamp()
            .addFields(
                { name: '**Carrinho**', value: `\`${yy}x ${ggg.infos.nome}\``, inline: true },
                { name: `**Valor à vista**`, value: `\`R$ ${Number(ggg.infos.preco * yy).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
                { name: '**Em estoque**', value: '`Disponível`', inline: false }
            );
        const hhhhConfig = gamepassJogos ? gamepassJogos.get(`jogo_${ggg.infos.universeId}`) : null;
        if (hhhhConfig?.banner) { try { embed.setImage(hhhhConfig.banner); } catch (e) {} }
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('irparapagamento').setLabel('Ir para o Pagamento').setEmoji('💳').setStyle(3),
            new ButtonBuilder().setCustomId('editarquantidade').setLabel('Editar Quantidade').setEmoji('✏️').setStyle(1)
        );
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('usarcupom').setLabel('Usar Cupom').setEmoji('🎟️').setStyle(2),
            new ButtonBuilder().setCustomId('deletchannel').setLabel('Cancelar').setEmoji('❌').setStyle(4)
        );
        const mentionRoles = `<@${ggg.user.id}> ${configuracao.get(`ConfigRoles.cargoadm`) ? `<@&${configuracao.get(`ConfigRoles.cargoadm`)}>` : ``} ${configuracao.get(`ConfigRoles.cargosup`) ? `<@&${configuracao.get(`ConfigRoles.cargosup`)}>` : ``}`;
        if (status == 1) {
            thread.deferUpdate();
            thread.message.edit({ content: mentionRoles, embeds: [embed], components: [row2, row3] });
        } else {
            thread.send({ content: mentionRoles, embeds: [embed], components: [row2, row3] });
        }
        return;
    }
    
    const hhhh = produtos.get(`${ggg.infos.produto}.Campos`)
    const gggaaa = hhhh.find(campo22 => campo22.Nome === ggg.infos.campo)
    let yy = await carrinhos.get(`${ggg.threadid}.quantidadeselecionada`)
    if (yy == null) {
        await carrinhos.set(`${ggg.threadid}.quantidadeselecionada`, 1)
        yy = 1
    }


    const embed = new EmbedBuilder()
        .setColor(`${configuracao.get(`Cores.Principal`) == null ? `0cd4cc` : configuracao.get('Cores.Principal')}`)
        .setAuthor({ name: ggg.user.username, iconURL: ggg.user.displayAvatarURL })
        .setTitle(`Revisao do Pedido`)
        

        .setFooter(
            { text: ggg.guild.name }
        )
        .setTimestamp()

        if (produtos.get(`${ggg.infos.produto}.Config.desc`) !== "Não definido") {
        embed.setDescription(`${produtos.get(`${ggg.infos.produto}.Config.desc`)}`)
    }


    const hhhhsdsadasd2 = produtos.get(`${ggg.infos.produto}.Config`)

    if (hhhhsdsadasd2.banner !== undefined || hhhhsdsadasd2.banner !== '') {
        try {
            await embed.setImage(`${hhhhsdsadasd2.banner}`)
        } catch (error) {

        }

    }
    if (hhhhsdsadasd2.icon !== undefined || hhhhsdsadasd2.icon !== '') {
        try {
            await embed.setThumbnail(`${hhhhsdsadasd2.icon}`)
        } catch (error) {

        }

    }



    if (ggg.cupomadicionado !== undefined) {


        const ggg2 = carrinhos.get(thread.channel.id)
        const hhhh2 = produtos.get(`${ggg.infos.produto}.Cupom`)
        const gggaaaawdwadwa = hhhh2.find(campo22 => campo22.Nome === ggg2.cupomadicionado)

        const yyfyfy = gggaaa.valor * yy

        const valorComDesconto = yyfyfy * (1 - gggaaaawdwadwa.desconto / 100);

        const valorOriginalFormatado = Number(yyfyfy).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const valorComDescontoFormatado = Number(valorComDesconto).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 });


        embed.addFields(
            { name: `**Carrinho**`, value: `\`${yy}x ${ggg.infos.produto} - ${ggg.infos.campo}\``, inline: true },
            {
                name: `**Valor à vista**`,
                value: `De ~~\`R$ ${valorOriginalFormatado}\`~~  por \`${valorComDescontoFormatado}\``,
                inline: true
            },
            { name: `**Cupom**`, value: `\`${ggg2.cupomadicionado}\``, inline: false },
            { name: `**Em estoque**`, value: `\`${gggaaa.estoque.length}\``, inline: false }
        )

    } else {

        embed.addFields(
            { name: `**Carrinho**`, value: `\`${yy}x ${ggg.infos.produto} - ${ggg.infos.campo}\``, inline: true },
            { name: `**Valor à vista**`, value: `\`R$ ${Number(gggaaa.valor * yy).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\``, inline: true },
            { name: `**Em estoque**`, value: `\`${gggaaa.estoque.length}\``, inline: false }
        )

    }

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("irparapagamento")
                .setLabel('Ir para o Pagamento')
                .setEmoji('💳')
                .setStyle(3),

            new ButtonBuilder()
                .setCustomId("editarquantidade")
                .setLabel('Editar Quantidade')
                .setEmoji('✏️')
                .setStyle(1)
        )
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("usarcupom")
                .setLabel('Usar Cupom')
                .setEmoji('🎟️')
                .setStyle(2),

            new ButtonBuilder()
                .setCustomId("deletchannel")
                .setLabel(`Cancelar`)
                .setEmoji('❌')
                .setStyle(4)
        )


    if (status == 1) {
        thread.deferUpdate()
        thread.message.edit({ content: `<@${ggg.user.id}> ${configuracao.get(`ConfigRoles.cargoadm`) ? `<@&${configuracao.get(`ConfigRoles.cargoadm`)}>` : ``} ${configuracao.get(`ConfigRoles.cargosup`) ? `<@&${configuracao.get(`ConfigRoles.cargosup`)}>` : ``}`, embeds: [embed], components: [row2,row3] })

    } else {
        thread.send({ content: `<@${ggg.user.id}> ${configuracao.get(`ConfigRoles.cargoadm`) ? `<@&${configuracao.get(`ConfigRoles.cargoadm`)}>` : ``} ${configuracao.get(`ConfigRoles.cargosup`) ? `<@&${configuracao.get(`ConfigRoles.cargosup`)}>` : ''}`, embeds: [embed], components: [row2,row3] })
    }

}

module.exports = {
    DentroCarrinho1,
    DentroCarrinho2,
    DentroCarrinhoPix,
    DentroCarrinhoEfiBank,
    DentroCarrinhoMisticPay,
    DentroCarrinhoImap
}