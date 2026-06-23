const { PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
const { pedidos, pagamentos, carrinhos, configuracao, produtos, estatisticas, Emojis } = require("../../database/index.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const Discord = require("discord.js");
const mercadopago = require('mercadopago');
const fs = require('fs');
const axios = require('axios');
const https = require('https');


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

module.exports = {
    name: "gerar_pix",
    description: "[💳|Admin] Use para gerar pagamentos",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "price",
            description: `Valor do pagamento`,
            type: Discord.ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "description",
            description: `Descrição do pagamento`,
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: `user`,
            description: `Usuário que irá pagar`,
            type: Discord.ApplicationCommandOptionType.User,
            required: true,
        }
    ],

    run: async (client, interaction, message) => {

        const perm = await getPermissions(client.user.id)
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative`)} Faltam permissões.`, flags: 64 });
        }

        const price = interaction.options.getNumber('price');
        const description = interaction.options.getString('description');
        const user = interaction.options.getUser('user');

        if (isNaN(price)) return interaction.reply({ content: `${Emojis.get(`negative`)} O preço deve ser um número.`, flags: 64 });
        if (price < 1) return interaction.reply({ content: `${Emojis.get(`negative`)} O preço deve ser maior que 0.`, flags: 64 });
        
        
        const misticStatus = configuracao.get("pagamentos.MisticSystem") || false;
        const imapStatus = configuracao.get("pagamentos.imap.status") || false;
        const efiStatus = configuracao.get("pagamentos.sistema_efi") || false;
        const mpAPI = configuracao.get('pagamentos.MpAPI');

        
        if (!misticStatus && !imapStatus && !efiStatus && !mpAPI) {
            return interaction.reply({ 
                content: `${Emojis.get(`negative`)} Nenhuma forma de pagamento automática está configurada!`, 
                flags: 64 
            });
        }

        await interaction.reply({ content: `${Emojis.get(`loading`)} Gerando pagamento...`, flags: 64 });

        try {
            if (misticStatus) {
                await gerarMisticPay(client, interaction, price, description, user);
            } else if (imapStatus) {
                await gerarImap(client, interaction, price, description, user);
            } else if (efiStatus) {
                await gerarEfiBank(client, interaction, price, description, user);
            } else if (mpAPI) {
                await gerarMercadoPago(client, interaction, price, description, user);
            }
        } catch (error) {
            console.error('[GERAR_PIX] Erro:', error);
            interaction.editReply({ content: `${Emojis.get(`negative`)} Ocorreu um erro ao criar o pagamento.\nError: ${error.message}`, flags: 64 });
        }
    }
}


async function gerarMisticPay(client, interaction, price, description, user) {
    const clientId = configuracao.get('pagamentos.mistclientid');
    const clientSecret = configuracao.get('pagamentos.misticsecret');

    const response = await axios.post('https://api.misticpay.com/api/transactions/create', {
        amount: Number(price.toFixed(2)),
        payerName: user.username,
        payerDocument: '15084299872',
        transactionId: `GERADO_${Date.now()}_${user.id}`,
        description: description
    }, {
        headers: { 'ci': clientId, 'cs': clientSecret, 'Content-Type': 'application/json' }
    });

    const misticData = response.data.data;
    const pix_copia_cola = misticData.copyPaste;
    const txid = misticData.transactionId;
    const qrCodeBase64 = misticData.qrCodeBase64;

    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const embed = criarEmbedPagamento(interaction, user, pix_copia_cola, 'Mistic Pay');
    embed.setImage('attachment://payment.png');

    const row = criarBotoesPagamento();

    pagamentos.set(`${interaction.channel.id}`, { 
        method: 'misticpay', 
        tipo: 'gerado', 
        user: user.id, 
        price: price, 
        description: description, 
        staff: interaction.user.id, 
        data: Date.now() 
    });
    pagamentos.set(`${interaction.channel.id}.pagamentos`, { 
        id: txid, 
        cp: pix_copia_cola, 
        method: 'misticpay', 
        data: Date.now(), 
        generated: 'Command-Generate' 
    });

    await interaction.channel.send({ embeds: [embed], files: [attachment], components: [row] }).then(msg => {
        pagamentos.set(`${interaction.channel.id}.message`, { messageid: msg.id, channelid: msg.channel.id });
    });

    interaction.editReply({ content: `${Emojis.get(`checker`)} Pagamento gerado com sucesso via Mistic Pay!`, flags: 64 });

    
    verificarPagamentoGerado(client, interaction, txid, 'misticpay', price, description, user);
}


async function gerarImap(client, interaction, price, description, user) {
    const pixChave = configuracao.get(`pagamentos.imap.chavepiximap`);
    const v = price.toFixed(2).toString();
    const n = "PIX IMAP".toUpperCase();
    const p = ["000201", `26${(22 + pixChave.length).toString().padStart(2, `0`)}0014br.gov.bcb.pix01${pixChave.length.toString().padStart(2, `0`)}${pixChave}`, "52040000", "5303986", `54${v.length.toString().padStart(2, `0`)}${v}`, "5802BR", `59${n.length.toString().padStart(2, `0`)}${n}`, "6008BRASILIA", "62070503***"].join("");
    const pix_copia_cola = p + "6304" + crc16(p + "6304");

    const { qrGenerator } = require('../../Lib/QRCodeLib.js');
    const path = require('path');
    const qr = new qrGenerator({ imagePath: path.resolve(__dirname, '../../Lib/aaaaa.png') });
    const qrcode = await qr.generate(pix_copia_cola);

    const buffer = Buffer.from(qrcode.response, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const txid = `IMAP_${Date.now()}`;
    const embed = criarEmbedPagamento(interaction, user, pix_copia_cola, 'IMAP');
    embed.setImage('attachment://payment.png');

    const row = criarBotoesPagamento();

    pagamentos.set(`${interaction.channel.id}`, { 
        method: 'imap', 
        tipo: 'gerado', 
        user: user.id, 
        price: price, 
        description: description, 
        staff: interaction.user.id, 
        data: Date.now() 
    });
    pagamentos.set(`${interaction.channel.id}.pagamentos`, { 
        id: txid, 
        cp: pix_copia_cola, 
        valor: price.toFixed(2),
        pagador: user.username,
        method: 'imap', 
        data: Date.now(), 
        generated: 'Command-Generate' 
    });

    await interaction.channel.send({ embeds: [embed], files: [attachment], components: [row] }).then(msg => {
        pagamentos.set(`${interaction.channel.id}.message`, { messageid: msg.id, channelid: msg.channel.id });
    });

    interaction.editReply({ content: `${Emojis.get(`checker`)} Pagamento gerado com sucesso via IMAP!`, flags: 64 });
}


async function gerarEfiBank(client, interaction, price, description, user) {
    let certificado = fs.readFileSync(`./Lib/${configuracao.get("pagamentos.certificado")}.p12`);

    const httpsAgent = new https.Agent({ pfx: certificado, passphrase: "" });

    var data = JSON.stringify({ grant_type: "client_credentials" });
    var data_credentials = configuracao.get(`pagamentos.secret_id`) + ":" + configuracao.get(`pagamentos.secret_token`);
    var auth = Buffer.from(data_credentials).toString("base64");

    var config = {
        method: "POST",
        url: "https://pix.api.efipay.com.br/oauth/token",
        headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
        httpsAgent: httpsAgent,
        data: data,
    };

    let access_token = await axios(config).then(res => res.data.access_token);

    var dataCob = JSON.stringify({
        "calendario": { "expiracao": 10 * 60 },
        "devedor": { "cpf": "12345678909", "nome": user.username },
        "valor": { "original": price.toFixed(2) },
        "chave": configuracao.get(`pagamentos.chavepix`),
        "solicitacaoPagador": description
    });

    var configCob = {
        method: "post",
        url: "https://pix.api.efipay.com.br/v2/cob",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        httpsAgent: httpsAgent,
        data: dataCob,
    };

    let response = await axios(configCob).then(res => res.data);

    const { qrGenerator } = require('../../Lib/QRCodeLib.js');
    const path = require('path');
    const qr = new qrGenerator({ imagePath: path.resolve(__dirname, '../../Lib/aaaaa.png') });
    const qrcode = await qr.generate(response.pixCopiaECola);

    const buffer = Buffer.from(qrcode.response, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const embed = criarEmbedPagamento(interaction, user, response.pixCopiaECola, 'Efi Bank');
    embed.setImage('attachment://payment.png');

    const row = criarBotoesPagamento();

    pagamentos.set(`${interaction.channel.id}`, { 
        method: 'efibank', 
        tipo: 'gerado', 
        user: user.id, 
        price: price, 
        description: description, 
        staff: interaction.user.id, 
        data: Date.now() 
    });
    pagamentos.set(`${interaction.channel.id}.pagamentos`, { 
        id: response.txid, 
        cp: response.pixCopiaECola, 
        method: 'efibank', 
        data: Date.now(), 
        generated: 'Command-Generate' 
    });

    await interaction.channel.send({ embeds: [embed], files: [attachment], components: [row] }).then(msg => {
        pagamentos.set(`${interaction.channel.id}.message`, { messageid: msg.id, channelid: msg.channel.id });
    });

    interaction.editReply({ content: `${Emojis.get(`checker`)} Pagamento gerado com sucesso via Efi Bank!`, flags: 64 });

    verificarPagamentoGerado(client, interaction, response.txid, 'efibank', price, description, user);
}


async function gerarMercadoPago(client, interaction, price, description, user) {
    var agora = new Date();
    agora.setMinutes(agora.getMinutes() + 10);
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
    agora.setHours(agora.getHours() - 5);
    var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');

    var payment_data = {
        transaction_amount: Number(price),
        description: description,
        date_of_expiration: novaDataFormatada,
        payment_method_id: 'pix',
        payer: {
            email: `${user.id}@gmail.com`,
            first_name: user.username,
            last_name: user.id,
            identification: { type: 'CPF', number: '12345678909' },
            address: { zip_code: '86063190', street_name: 'Rua Jácomo Piccinin', street_number: '168', neighborhood: 'Pinheiros', city: 'Londrina', federal_unit: 'PR' }
        }
    };

    mercadopago.configurations.setAccessToken(configuracao.get('pagamentos.MpAPI'));
    const data = await mercadopago.payment.create(payment_data);

    const pix_copia_cola = data.body.point_of_interaction.transaction_data.qr_code;
    const txid = data.body.id;

    const { qrGenerator } = require('../../Lib/QRCodeLib.js');
    const path = require('path');
    const qr = new qrGenerator({ imagePath: path.resolve(__dirname, '../../Lib/aaaaa.png') });
    const qrcode = await qr.generate(pix_copia_cola);

    const buffer = Buffer.from(qrcode.response, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const embed = criarEmbedPagamento(interaction, user, pix_copia_cola, 'Mercado Pago');
    embed.setImage('attachment://payment.png');

    const row = criarBotoesPagamento();

    pagamentos.set(`${interaction.channel.id}`, { 
        method: 'pix', 
        tipo: 'gerado', 
        user: user.id, 
        price: price, 
        description: description, 
        staff: interaction.user.id, 
        data: Date.now() 
    });
    pagamentos.set(`${interaction.channel.id}.pagamentos`, { 
        id: txid, 
        cp: pix_copia_cola, 
        method: 'pix', 
        data: Date.now(), 
        generated: 'Command-Generate' 
    });

    await interaction.channel.send({ embeds: [embed], files: [attachment], components: [row] }).then(msg => {
        pagamentos.set(`${interaction.channel.id}.message`, { messageid: msg.id, channelid: msg.channel.id });
    });

    interaction.editReply({ content: `${Emojis.get(`checker`)} Pagamento gerado com sucesso via Mercado Pago!`, flags: 64 });

    verificarPagamentoGerado(client, interaction, txid, 'pix', price, description, user);
}


function criarEmbedPagamento(interaction, user, pixCode, gateway) {
    return new EmbedBuilder()
        .setColor(configuracao.get(`Cores.Principal`) || '#2b2d31')
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`${Emojis.get(`pix_stamp_emoji`)} Pagamento via PIX criado`)
        .addFields(
            { name: `${Emojis.get(`time_emoji`)} Expira em:`, value: `<t:${Math.floor(Date.now() / 1000) + 600}:R>` },
            { name: `${Emojis.get(`information_emoji`)} Código copia e cola`, value: `\`\`\`${pixCode}\`\`\`` }
        )
        .setFooter({ text: `${interaction.guild.name} • ${gateway}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();
}

function criarBotoesPagamento() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("codigocopiaecola_gerado")
            .setLabel('Código copia e cola')
            .setEmoji(Emojis.get(`checker`) || '✅')
            .setStyle(2)
    );
}


async function verificarPagamentoGerado(client, interaction, txid, method, price, description, user) {
    const channelId = interaction.channel.id;
    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;
    const guildIcon = interaction.guild.iconURL({ dynamic: true });
    
    let tentativas = 0;
    const maxTentativas = 60; 

    const interval = setInterval(async () => {
        tentativas++;
        
        if (tentativas > maxTentativas) {
            clearInterval(interval);
            pagamentos.delete(channelId);
            return;
        }

        try {
            let aprovado = false;
            let banco = 'Pix';

            if (method === `pix`) {
                const res = await axios.get(`https://api.mercadopago.com/v1/payments/${txid}`, {
                    headers: { Authorization: `Bearer ${configuracao.get(`pagamentos.MpAPI`)}` }
                });
                if (res.data.status === 'approved') {
                    aprovado = true;
                    banco = res.data.point_of_interaction?.transaction_data?.bank_info?.payer?.long_name || 'Mercado Pago';
                }
            } else if (method === 'misticpay') {
                const clientId = configuracao.get('pagamentos.mistclientid');
                const clientSecret = configuracao.get('pagamentos.misticsecret');
                const res = await axios.post('https://api.misticpay.com/api/transactions/check', {
                    transactionId: txid
                }, {
                    headers: { 'ci': clientId, 'cs': clientSecret, 'Content-Type': 'application/json' },
                    timeout: 5000
                });
                if (res.data?.transaction?.transactionState === 'COMPLETO') {
                    aprovado = true;
                    banco = res.data?.transaction?.payerBank || 'Mistic Pay';
                }
            } else if (method === 'efibank') {
                let certificado = fs.readFileSync(`./Lib/${configuracao.get("pagamentos.certificado")}.p12`);
                const httpsAgent = new https.Agent({ pfx: certificado, passphrase: "" });
                
                var data_credentials = configuracao.get(`pagamentos.secret_id`) + ":" + configuracao.get(`pagamentos.secret_token`);
                var auth = Buffer.from(data_credentials).toString("base64");
                
                const tokenRes = await axios.post("https://pix.api.efipay.com.br/oauth/token", 
                    { grant_type: "client_credentials" },
                    { headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" }, httpsAgent }
                );
                
                const res = await axios.get(`https://pix.api.efipay.com.br/v2/cob/${txid}`, {
                    headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
                    httpsAgent
                });
                
                if (res.data.status === 'CONCLUIDA') {
                    aprovado = true;
                    banco = `Efi Bank`;
                }
            }

            if (aprovado) {
                clearInterval(interval);
                pagamentos.delete(channelId);

                const channel = await client.channels.fetch(channelId);
                
                
                await channel.send({ 
                    content: `${Emojis.get(`checker`)} **Pagamento Aprovado!**\n\n> Pagamento de **R$ ${price.toFixed(2)}** realizado por ${user} foi aprovado com sucesso!\n> **Descrição:** ${description}\n> **Banco:** ${banco}` 
                });

                
                const eventChannel = await client.channels.fetch(configuracao.get(`ConfigChannels.eventbuy`)).catch(() => null);
                if (eventChannel) {
                    const embedVenda = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Sucesso`) || '#00FF00')
                        .setAuthor({ 
                            name: 'Pagamento Aprovado', 
                            iconURL: 'https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless' 
                        })
                        .setThumbnail(guildIcon)
                        .setDescription(`${Emojis.get(`neworder_emoji`)} O usuário ${user} realizou um pagamento no servidor`)
                        .addFields(
                            { name: '**Descrição**', value: `\`${description}\`` },
                            { name: '**Valor pago**', value: `\`R$ ${price.toFixed(2)}\`` },
                            { name: '**Gerado por**', value: `${interaction.user}` }
                        )
                        .setFooter({ text: guildName, iconURL: guildIcon })
                        .setTimestamp();

                    await eventChannel.send({ embeds: [embedVenda] });
                }

                
                try {
                    const embedDM = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Sucesso`) || '#40fc04')
                        .setAuthor({ 
                            name: `Pagamento #${txid}`, 
                            iconURL: 'https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless' 
                        })
                        .setDescription(`Seu pagamento foi aprovado com sucesso!`)
                        .addFields(
                            { name: '**Descrição**', value: `\`${description}\`` },
                            { name: '**Valor**', value: `\`R$ ${price.toFixed(2)}\`` }
                        )
                        .setFooter({ text: guildName, iconURL: guildIcon })
                        .setTimestamp();

                    await user.send({ embeds: [embedDM] });
                } catch (e) {}
            }
        } catch (error) {
            
        }
    }, 10000); 
}