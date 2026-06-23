const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { configuracao } = require("../database")
const { JsonDatabase } = require("../database/jsondb");
const mercadopago = require("mercadopago");
const axios = require("axios");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

const robuxConfig = new JsonDatabase({
    databasePath: "./database/configuracaorobux.json"
});

const carrinhosRobux = new JsonDatabase({
    databasePath: "./database/carrinhosrobux.json"
});

const pagamentosRobux = new JsonDatabase({
    databasePath: "./database/pagamentosrobux.json"
});
const { res: _res } = require(`../res`);


async function gerarPagamentoRobuxMP(interaction, client) {
    await interaction.deferUpdate();

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.followUp({ 
            content: `${Emojis.get(`negative`) || ``} | Carrinho não encontrado!`, 
            flags: 64 
        });
    }

    
    await interaction.editReply(_res.main({ type: 10, content: `${Emojis.get(`loading`)||''} **Gerando Pagamento...**\n\nAguarde enquanto criamos seu pagamento PIX.` }));

    try {
        const valor = parseFloat(carrinho.valorFinal);
        const mpAccessToken = configuracao.get('pagamentos.MpAPI');

        if (!mpAccessToken) {
            throw new Error('Token do Mercado Pago não configurado');
        }

        mercadopago.configurations.setAccessToken(mpAccessToken);

        
        var agora = new Date();
        agora.setMinutes(agora.getMinutes() + 10);
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset() + 240);
        agora.setHours(agora.getHours() - 5);
        var novaDataFormatada = agora.toISOString().replace('Z', '-04:00');

        const payment_data = {
            transaction_amount: Number(valor),
            description: `Robux - ${carrinho.robuxFinal}R$ - ${interaction.user.username}`,
            date_of_expiration: novaDataFormatada,
            payment_method_id: 'pix',
            payer: {
                email: `${interaction.user.id}@discord-user.com`,
                first_name: interaction.user.username,
                last_name: 'Discord',
                identification: {
                    type: 'CPF',
                    number: '12345678909'
                }
            }
        };

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: requisição excedeu 20 segundos')), 20000)
        );

        const data = await Promise.race([
            mercadopago.payment.create(payment_data),
            timeoutPromise
        ]);

        const txid = data.body.id;
        const pix_copia_cola = data.body.point_of_interaction.transaction_data.qr_code;

        
        const { qrGenerator } = require('../Lib/QRCodeLib');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(pix_copia_cola);

        const buffer = Buffer.from(qrcode.response, "base64");
        const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

        
        carrinho.pagamento = {
            id: txid,
            pixCopiaCola: pix_copia_cola,
            method: 'mercadopago',
            valor: valor,
            criadoEm: Date.now()
        };
        carrinho.status = 'aguardando_pagamento';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        
        pagamentosRobux.set(`${interaction.channel.id}`, {
            oderId: interaction.user.id,
            pagamento: {
                id: txid,
                method: `mercadopago`,
                data: Date.now()
            },
            carrinho: carrinho
        });

        
        const _mpAv = carrinho.robloxUser.avatar;
        const _mpUC = _mpAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _mpAv }, spoiler: false } } : { type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` };
        await interaction.editReply(_res.main(
            _mpUC, { type: 14 },
            { type: 10, content: `${Emojis.get(`pix_stamp_emoji`)||``} **Pagamento via PIX**\n\n${Emojis.get(`dinheiro`)||``} **Valor:** R$ ${valor.toFixed(2)}\n${Emojis.get(`controller`)||``} **Robux:** ${carrinho.robuxFinal}\n${Emojis.get(`relogio`)||''} **Expira:** <t:${Math.floor(Date.now() / 1000) + 600}:R>` },
            { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] }, { type: 14 },
            { type: 10, content: `${Emojis.get(`codigocopia`)||''} **Copia e Cola:**\n\`\`\`${pix_copia_cola}\`\`\`` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'robux_copiar_pix' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ).with({ files: [attachment] }));

        await enviarLogPagamentoRobux(interaction.guild, 'iniciadas', {
            usuario: interaction.user,
            carrinho: carrinho,
            txid: txid,
            acao: 'Pagamento Gerado'
        }, client);

    } catch (error) {
        console.error(`[Robux Pagamento] Erro:`, error);
        await interaction.editReply(_res.main(
            { type: 10, content: `${Emojis.get(`negative`)||''} **Erro ao gerar pagamento:**\n${error.message}` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: `robux_cancelar_compra` }
            ]}
        ));
    }
}



async function gerarPagamentoRobuxEfi(interaction, client) {
    await interaction.deferUpdate();

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.followUp({ 
            content: `${Emojis.get(`negative`) || ``} | Carrinho não encontrado!`, 
            flags: 64 
        });
    }

    await interaction.editReply(_res.main({ type: 10, content: `${Emojis.get(`loading`)||''} **Gerando Pagamento...**\n\nAguarde enquanto criamos seu pagamento PIX.` }));

    try {
        const valor = parseFloat(carrinho.valorFinal);
        const fs = require('fs');
        const https = require('https');

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
            return response.data.access_token;
        });

        var pixData = JSON.stringify({
            "calendario": { "expiracao": 10 * 60 },
            "devedor": {
                "cpf": "12345678909",
                "nome": interaction.user.username,
            },
            "valor": { "original": valor.toFixed(2) },
            "chave": configuracao.get(`pagamentos.chavepix`),
            "solicitacaoPagador": `Robux - ${carrinho.robuxFinal}R$`
        });

        var configPix = {
            method: "post",
            url: "https://pix.api.efipay.com.br/v2/cob",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            httpsAgent: httpsAgent,
            data: pixData,
        };

        let response = await axios(configPix).then(function (response) {
            return response.data;
        });

        const txid = response.txid;
        const pix_copia_cola = response.pixCopiaECola;

        
        const { qrGenerator } = require('../Lib/QRCodeLib');
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(pix_copia_cola);

        const buffer = Buffer.from(qrcode.response, "base64");
        const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

        
        carrinho.pagamento = {
            id: txid,
            pixCopiaCola: pix_copia_cola,
            method: 'efibank',
            valor: valor,
            criadoEm: Date.now()
        };
        carrinho.status = 'aguardando_pagamento';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        
        pagamentosRobux.set(`${interaction.channel.id}`, {
            oderId: interaction.user.id,
            pagamento: {
                id: txid,
                method: `efibank`,
                data: Date.now()
            },
            carrinho: carrinho
        });

        
        const _efiAv = carrinho.robloxUser.avatar;
        const _efiUC = _efiAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _efiAv }, spoiler: false } } : { type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
        await interaction.editReply(_res.main(
            _efiUC, { type: 14 },
            { type: 10, content: `${Emojis.get(`pix_stamp_emoji`)||``} **Pagamento via PIX**\n\n${Emojis.get(`dinheiro`)||``} **Valor:** R$ ${valor.toFixed(2)}\n${Emojis.get(`controller`)||``} **Robux:** ${carrinho.robuxFinal}\n${Emojis.get(`relogio`)||''} **Expira:** <t:${Math.floor(Date.now() / 1000) + 600}:R>` },
            { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] }, { type: 14 },
            { type: 10, content: `${Emojis.get(`codigocopia`)||''} **Copia e Cola:**\n\`\`\`${pix_copia_cola}\`\`\`` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'robux_copiar_pix' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ).with({ files: [attachment] }));

        await enviarLogPagamentoRobux(interaction.guild, 'iniciadas', {
            usuario: interaction.user,
            carrinho: carrinho,
            txid: txid,
            acao: 'Pagamento Gerado'
        }, client);

    } catch (error) {
        console.error(`[Robux Pagamento EFI] Erro:`, error);
        await interaction.editReply(_res.main(
            { type: 10, content: `${Emojis.get(`negative`)||''} **Erro ao gerar pagamento:**\n${error.message}` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: `robux_cancelar_compra` }
            ]}
        ));
    }
}



async function gerarPagamentoRobuxMistic(interaction, client) {
    await interaction.deferUpdate();

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.followUp({ 
            content: `${Emojis.get(`negative`) || ``} | Carrinho não encontrado!`, 
            flags: 64 
        });
    }

    await interaction.editReply(_res.main({ type: 10, content: `${Emojis.get(`loading`)||''} **Gerando Pagamento...**\n\nAguarde enquanto criamos seu pagamento PIX.` }));

    try {
        const valor = parseFloat(carrinho.valorFinal);
        const clientId = configuracao.get('pagamentos.mistclientid');
        const clientSecret = configuracao.get('pagamentos.misticsecret');

        const response = await axios.post('https://api.misticpay.com/api/transactions/create', {
            amount: Number(valor.toFixed(2)),
            payerName: interaction.user.username,
            payerDocument: '12345678909',
            transactionId: `ROBUX_${Date.now()}_${interaction.user.id}`,
            description: `Robux - ${carrinho.robuxFinal}R$`
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

        if (!pix_copia_cola) throw new Error("API não retornou o código PIX");

        const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

        
        carrinho.pagamento = {
            id: txid,
            pixCopiaCola: pix_copia_cola,
            method: 'misticpay',
            valor: valor,
            criadoEm: Date.now()
        };
        carrinho.status = 'aguardando_pagamento';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        
        pagamentosRobux.set(`${interaction.channel.id}`, {
            oderId: interaction.user.id,
            pagamento: {
                id: txid,
                method: `misticpay`,
                data: Date.now()
            },
            carrinho: carrinho
        });

        
        const _mAv = carrinho.robloxUser.avatar;
        const _mUC = _mAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _mAv }, spoiler: false } } : { type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
        await interaction.editReply(_res.main(
            _mUC, { type: 14 },
            { type: 10, content: `${Emojis.get(`pix_stamp_emoji`)||``} **Pagamento via PIX**\n\n${Emojis.get(`dinheiro`)||``} **Valor:** R$ ${valor.toFixed(2)}\n${Emojis.get(`controller`)||``} **Robux:** ${carrinho.robuxFinal}\n${Emojis.get(`relogio`)||''} **Expira:** <t:${Math.floor(Date.now() / 1000) + 600}:R>` },
            { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] }, { type: 14 },
            { type: 10, content: `${Emojis.get(`codigocopia`)||''} **Copia e Cola:**\n\`\`\`${pix_copia_cola}\`\`\`` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'robux_copiar_pix' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ).with({ files: [attachment] }));

        await enviarLogPagamentoRobux(interaction.guild, 'iniciadas', {
            usuario: interaction.user,
            carrinho: carrinho,
            txid: txid,
            acao: 'Pagamento Gerado'
        }, client);

    } catch (error) {
        console.error(`[Robux Pagamento Mistic] Erro:`, error);
        await interaction.editReply(_res.main(
            { type: 10, content: `${Emojis.get(`negative`)||''} **Erro ao gerar pagamento:**\n${error.message}` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ));
    }
}


async function irParaPagamentoRobux(interaction, client) {
    
    const mpAtivo = configuracao.get('pagamentos.MpAPI') ? true : false;
    const efiAtivo = configuracao.get('pagamentos.sistema_efi') && configuracao.get('pagamentos.secret_id') && configuracao.get('pagamentos.secret_token') ? true : false;
    const misticAtivo = configuracao.get('pagamentos.MisticSystem') && configuracao.get('pagamentos.mistclientid') && configuracao.get('pagamentos.misticsecret') ? true : false;
    const semiAutoAtivo = configuracao.get('pagamentos.SemiAutomatico.status') || false;
    const imapAtivo = (configuracao.get('pagamentos.imap.status') === true) && !!configuracao.get(`pagamentos.imap.chavepiximap`);

    
    if (misticAtivo) {
        await gerarPagamentoRobuxMistic(interaction, client);
    } else if (efiAtivo) {
        await gerarPagamentoRobuxEfi(interaction, client);
    } else if (mpAtivo) {
        await gerarPagamentoRobuxMP(interaction, client);
    } else if (imapAtivo) {
        await gerarPagamentoRobuxImap(interaction, client);
    } else if (semiAutoAtivo) {
        await gerarPagamentoRobuxSemiAuto(interaction, client);
    } else {
        await interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Nenhum método de pagamento está configurado! Configure no painel de administração.`,
            flags: 64
        });
    }
}



async function mostrarModalNomeBancoImap(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.reply({
            content: `${Emojis.get('negative') || ''} | Carrinho não encontrado!`,
            flags: 64
        });
    }
    
    if (interaction.message?.id) {
        carrinho._cartMessageId = interaction.message.id;
        carrinho._cartChannelId = interaction.channelId;
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);
    }
    const modal = new ModalBuilder()
        .setCustomId('robux_handle_nome_banco')
        .setTitle('Identificação do Pagamento PIX');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nome_banco_input')
                .setLabel('Qual o nome completo registrado no seu banco?')
                .setPlaceholder('Ex: João Carlos Silva (exatamente como aparece no seu banco)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(4)
                .setMaxLength(80)
        )
    );
    await interaction.showModal(modal);
}

async function gerarPagamentoRobuxImap(interaction, client) {
    
    if (interaction.isModalSubmit()) {
        await interaction.deferReply();
    } else {
        await interaction.deferUpdate();
    }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.followUp({
            content: `${Emojis.get(`negative`) || ``} | Carrinho não encontrado!`,
            flags: 64
        });
    }

    await interaction.editReply(_res.main({ type: 10, content: `${Emojis.get(`loading`)||''} **Gerando Pagamento via IMAPS...**\n\nAguarde enquanto preparamos seu PIX.` }));

    try {
        const valor = parseFloat(carrinho.valorFinal);
        const chavePix = configuracao.get('pagamentos.imap.chavepiximap');
        const banco = configuracao.get('pagamentos.imap.banco_atual') || 'inter';
        const pagador = carrinho.nomeBancoPagador || '';

        if (!chavePix) throw new Error('Chave PIX não configurada no sistema IMAPS');

        const { QrCodePix } = require('qrcode-pix');
        const { qrGenerator } = require('../Lib/QRCodeLib');

        const valor2 = Number(valor.toFixed(2));
        const qrCodePix = QrCodePix({
            version: '01',
            key: chavePix,
            name: chavePix.substring(0, 25),
            city: 'BRASILIA',
            cep: '28360000',
            value: valor2,
        });

        const pixPayload = qrCodePix.payload();
        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(pixPayload);
        const buffer = Buffer.from(qrcode.response, 'base64');
        const attachment = new AttachmentBuilder(buffer, { name: 'payment.png' });

        const txid = `IMAP_${Date.now()}_${interaction.user.id}`;

        carrinho.pagamento = {
            id: txid,
            pixCopiaCola: pixPayload,
            method: 'imap',
            valor: valor,
            pagador: pagador,
            criadoEm: Date.now()
        };
        carrinho.status = 'aguardando_pagamento_manual';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        pagamentosRobux.set(`${interaction.channel.id}`, {
            oderId: interaction.user.id,
            pagamento: {
                id: txid,
                method: 'imap',
                data: Date.now(),
                pagador: pagador,
                valor: valor
            },
            carrinho: carrinho
        });

        const nomeBanco = banco.charAt(0).toUpperCase() + banco.slice(1);
        const pagadorInfo = pagador ? `\n${Emojis.get('user')||'👤'} **Pagador registrado:** \`${pagador}\`` : '';
        const _imapAv = carrinho.robloxUser.avatar;
        const _imapUC = _imapAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _imapAv }, spoiler: false } } : { type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
        const channelIdForBtn = interaction.channel?.id || interaction.channelId || '';
        await interaction.editReply(_res.main(
            _imapUC, { type: 14 },
            { type: 10, content: `${Emojis.get(`pix_stamp_emoji`)||``} **Pagamento via PIX (${nomeBanco})**\n\n${Emojis.get(`dinheiro`)||``} **Valor:** R$ ${valor.toFixed(2).replace(`.`, `,`)}\n${Emojis.get(`controller`)||''} **Robux:** ${carrinho.robuxFinal}${pagadorInfo}\n\n-# ${Emojis.get('loading')||'⏳'} Aguardando confirmação automática via email...` },
            { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] }, { type: 14 },
            { type: 10, content: `${Emojis.get(`codigocopia`)||''} **Copia e Cola:**\n\`\`\`${pixPayload}\`\`\`` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'robux_copiar_pix' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]},
            { type: 14 },
            { type: 10, content: `-# Área restrita — apenas equipe` },
            { type: 1, components: [
                { type: 2, style: 3, label: 'Aprovar Manualmente', custom_id: `robux_aprovar_imap_${channelIdForBtn}` }
            ]}
        ).with({ files: [attachment] }));

        
        if (interaction.isModalSubmit() && carrinho._cartMessageId && carrinho._cartChannelId) {
            try {
                const ch = await client.channels.fetch(carrinho._cartChannelId).catch(() => null);
                if (ch) {
                    const oldMsg = await ch.messages.fetch(carrinho._cartMessageId).catch(() => null);
                    if (oldMsg) await oldMsg.delete().catch(() => {});
                }
            } catch (e) {}
            delete carrinho._cartMessageId;
            delete carrinho._cartChannelId;
            carrinhosRobux.set(`${interaction.user.id}`, carrinho);
        }

        await enviarLogPagamentoRobux(interaction.guild, 'iniciadas', {
            usuario: interaction.user, carrinho: carrinho, txid: txid, acao: 'Pagamento IMAPS Gerado'
        }, client);

    } catch (error) {
        console.error(`[Robux IMAP] Erro:`, error);
        await interaction.editReply(_res.main(
            { type: 10, content: `${Emojis.get(`negative`)||''} **Erro ao gerar pagamento IMAPS:**\n${error.message}` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: `robux_cancelar_compra` }
            ]}
        ));
    }
}

async function gerarPagamentoRobuxSemiAuto(interaction, client) {
    await interaction.deferUpdate();

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.followUp({ 
            content: `${Emojis.get(`negative`) || ``} | Carrinho não encontrado!`, 
            flags: 64 
        });
    }

    await interaction.editReply(_res.main({ type: 10, content: `${Emojis.get(`loading`)||''} **Espere um momento...**\n\nGerando pagamento PIX.` }));

    try {
        const valor = parseFloat(carrinho.valorFinal);
        const pagamento = configuracao.get(`pagamentos.SemiAutomatico`);

        if (!pagamento || !pagamento.pix) {
            throw new Error('Chave PIX não configurada no pagamento semi-automático');
        }

        
        const { QrCodePix } = require('qrcode-pix');
        const { qrGenerator } = require('../Lib/QRCodeLib');

        const valor2 = Number(valor.toFixed(2));
        const qrCodePix = QrCodePix({
            version: '01',
            key: pagamento.pix,
            name: pagamento.pix,
            city: 'BRASILIA',
            cep: '28360000',
            value: valor2,
        });

        const chavealeatorio = qrCodePix.payload();

        const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' });
        const qrcode = await qr.generate(chavealeatorio);

        const buffer = Buffer.from(qrcode.response, "base64");
        const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

        const txid = `SEMI_${Date.now()}_${interaction.user.id}`;

        
        carrinho.pagamento = {
            id: txid,
            pixCopiaCola: chavealeatorio,
            method: 'semiautomatico',
            valor: valor,
            criadoEm: Date.now()
        };
        carrinho.status = `aguardando_pagamento_manual`;
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        
        const _saAv = carrinho.robloxUser.avatar;
        const _saUC = _saAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _saAv }, spoiler: false } } : { type: 10, content: `${Emojis.get(`user`)||``} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
        await interaction.editReply(_res.main(
            _saUC, { type: 14 },
            { type: 10, content: `${Emojis.get(`pix_stamp_emoji`)||``} **Pagamento via PIX criado**\n\n${Emojis.get(`dinheiro`)||``} **Valor:** \`R$ ${valor.toFixed(2)}\`\n${Emojis.get(`controller`)||``} **Robux:** \`${carrinho.robuxFinal} R$\`\n\n-# ${Emojis.get(`lock`)||''} Ambiente seguro — envie o comprovante neste canal após pagar.` },
            { type: 12, items: [{ media: { url: `attachment://payment.png` }, spoiler: false }] }, { type: 14 },
            { type: 10, content: `${Emojis.get(`codigocopia`)||''} **Copia e Cola:**\n\`\`\`${chavealeatorio}\`\`\`` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Código Copia e Cola', custom_id: 'robux_copiar_pix_semi' },
                { type: 2, style: 3, label: 'Confirmar Pagamento', custom_id: 'robux_confirmar_pagamento_manual' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: `robux_cancelar_compra` }
            ]}
        ).with({ files: [attachment] }));

        
        if (pagamento.msg) {
            await interaction.channel.send({ content: `||${interaction.user}|| ${pagamento.msg}` });
        }

        
        try {
            await interaction.channel.setName(`🛒・${interaction.user.username}・robux`);
        } catch (e) {}

        await enviarLogPagamentoRobux(interaction.guild, 'iniciadas', {
            usuario: interaction.user,
            carrinho: carrinho,
            txid: txid,
            acao: 'Pagamento Semi-Auto Gerado'
        }, client);

    } catch (error) {
        console.error(`[Robux Pagamento Semi-Auto] Erro:`, error);

        await interaction.editReply(_res.main(
            { type: 10, content: `${Emojis.get(`negative`)||''} **Erro ao gerar pagamento:**\n${error.message}` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ));
    }
}


async function confirmarPagamentoManualRobux(interaction, client) {
    
    const { getPermissions } = require('./PermissionsCache');
    const perm = await getPermissions(client.user.id);
    
    if (perm === null || !perm.includes(interaction.user.id)) {
        if (!interaction.member.permissions.has(`Administrator`)) {
            return interaction.reply({ 
                content: `${Emojis.get(`negative`) || ``} | Você não possui permissão para confirmar pagamentos.`, 
                flags: 64 
            });
        }
    }

    
    const allCarrinhos = carrinhosRobux.fetchAll();
    const carrinhoData = allCarrinhos.find(c => c.data.channelId === interaction.channel.id);

    if (!carrinhoData) {
        return interaction.reply({ 
            content: `${Emojis.get(`negative`) || ''} | Não há um carrinho de Robux aberto neste canal.`, 
            flags: 64 
        });
    }

    const carrinho = carrinhoData.data;
    const oderId = carrinhoData.ID;

    
    await interaction.message.delete().catch(() => {});

    
    const { pedidosRobux } = require('./VerificarPagamentoRobux');
    
    pedidosRobux.set(interaction.channel.id, {
        oderId: oderId,
        visão: carrinho.pagamento,
        carrinho: carrinho,
        banco: 'Semi-Automático',
        aprovadoEm: Date.now()
    });

    
    const perfilRobloxLink = `https://www.roblox.com/users/${carrinho.robloxUser?.id}/profile`;
    const gamepassLink = `https://www.roblox.com/game-pass/${carrinho.gamepassSelecionado?.id}`;

    
    const embedAprovado = new EmbedBuilder()
        .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
        .setAuthor({ name: `Pedido Aprovado Manualmente`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
        .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} O pagamento foi confirmado manualmente!\n\nAgora é necessário **comprar o GamePass** do cliente para entregar os Robux.`)
        .addFields(
            { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` }
        )
        .addFields(
            { name: `${Emojis.get('user')||''} Cliente Discord`, value: `<@${oderId}>`, inline: true },
            { name: `${Emojis.get('controller')||''} Cliente Roblox`, value: `\`${carrinho.robloxUser?.name || 'N/A'}\``, inline: true },
            { name: `${Emojis.get('bank')||''} Método`, value: `\`Pix - Semi-Automático\``, inline: true }
        )
        .setFooter({ text: 'Clique nos botões abaixo para acessar o perfil e o GamePass' })
        .setTimestamp();

    if (carrinho.robloxUser?.avatar) {
        embedAprovado.setThumbnail(carrinho.robloxUser.avatar);
    }

    const row = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setLabel('Perfil do Usuário').setURL(perfilRobloxLink).setStyle(5); const e = Emojis.get('user'); if (e) b.setEmoji(e); return b; })(),
        (() => { const b = new ButtonBuilder().setLabel('GamePass').setURL(gamepassLink).setStyle(5); const e = Emojis.get('_ticket_emoji'); if (e) b.setEmoji(e); return b; })(),
        (() => { const b = new ButtonBuilder().setCustomId(`robux_entrega_concluida_${interaction.channel.id}`).setLabel('Entrega Concluída').setStyle(3); const e = Emojis.get('checker'); if (e) b.setEmoji(e); return b; })()
    );

    await interaction.channel.send({ 
        content: `<@${oderId}>`,
        embeds: [embedAprovado], 
        components: [row] 
    });

    
    try {
        await interaction.channel.setName(`✅・${carrinho.robloxUser?.name || 'user'}・robux`);
    } catch (e) {}

    
    try {
        const user = await client.users.fetch(oderId);
        const embedDM = new EmbedBuilder()
            .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
            .setAuthor({ name: `Pedido Aprovado Manualmente`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
            .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} Seu pagamento de **R$ ${carrinho.valorFinal}** foi aprovado!\n\nAguarde a entrega dos seus **${carrinho.robuxFinal} Robux**.`)
            .addFields(
                { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` },
                { name: `**Forma de Pagamento**`, value: `\`Pix - Semi-Automático\`` }
            )
            .setTimestamp();

        await user.send({ embeds: [embedDM] }).catch(() => {});
    } catch (e) {}

    
    try {
        const canalLog = robuxConfig.get('config.canais.iniciadas');
        if (canalLog) {
            const canal = await client.channels.fetch(canalLog);
            const embedLog = new EmbedBuilder()
                .setColor(configuracao.get(`Cores.Processamento`) || `#f1c40f`)
                .setAuthor({ name: `Pedido Aprovado Manualmente - Aguardando Entrega` })
                .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} Usuário <@${oderId}> teve o pagamento aprovado manualmente e está aguardando entrega.`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` },
                    { name: `**Aprovado por**`, value: `<@${interaction.user.id}>` },
                    { name: `**Forma de pagamento**`, value: `\`Pix - Semi-Automático\`` }
                )
                .setFooter({ text: interaction.guild.name })
                .setTimestamp();

            if (carrinho.robloxUser?.avatar) {
                embedLog.setThumbnail(carrinho.robloxUser.avatar);
            }

            await canal.send({ embeds: [embedLog] });
        }
    } catch (e) {}

    await interaction.reply({ 
        content: `${Emojis.get(`checker`) || ''} | Pagamento aprovado manualmente. Aguarde...`, 
        flags: 64 
    });
}


async function enviarLogPagamentoRobux(guild, tipo, dados, client) {
    const canalId = robuxConfig.get(`config.canais.${tipo}`);
    if (!canalId) return;

    const canal = guild.channels.cache.get(canalId);
    if (!canal) return;

    const cores = {
        iniciadas: configuracao.get(`Cores.Processamento`) || '#3498db',
        canceladas: configuracao.get(`Cores.Erro`) || '#e74c3c',
        aprovadas: configuracao.get(`Cores.Sucesso`) || '#2ecc71',
        publicas: configuracao.get(`Cores.Principal`) || '#9b59b6'
    };

    const embed = new EmbedBuilder()
        .setColor(cores[tipo] || `#7c3aed`)
        .setAuthor({ name: `Pedido Solicitado`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
        .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('codigocopia') || ``} Usuário ${dados.usuario} solicitou um pedido de Robux`)
        .addFields(
            { name: `**Detalhes**`, value: `\`${dados.carrinho.robuxFinal} Robux - ${dados.carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${dados.carrinho.valorFinal}\`` },
            { name: `**ID do Pedido**`, value: `\`${dados.txid || `N/A`}\`` },
            { name: `**Forma de pagamento**`, value: `\`Pix\`` }
        )
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (dados.carrinho.robloxUser?.avatar) {
        embed.setThumbnail(dados.carrinho.robloxUser.avatar);
    }

    try {
        await canal.send({ embeds: [embed] });
    } catch (e) {
        console.error(`Erro ao enviar log:`, e);
    }
}


async function copiarPixRobux(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    
    if (!carrinho || !carrinho.pagamento?.pixCopiaCola) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ''} | Código PIX não encontrado!`,
            flags: 64
        });
    }

    await interaction.reply({
        content: `\`\`\`${carrinho.pagamento.pixCopiaCola}\`\`\``,
        flags: 64
    });
}

module.exports = {
    gerarPagamentoRobuxImap,
    gerarPagamentoRobuxMP,
    gerarPagamentoRobuxEfi,
    gerarPagamentoRobuxMistic,
    gerarPagamentoRobuxSemiAuto,
    irParaPagamentoRobux,
    mostrarModalNomeBancoImap,
    enviarLogPagamentoRobux,
    copiarPixRobux,
    confirmarPagamentoManualRobux,
    pagamentosRobux
}