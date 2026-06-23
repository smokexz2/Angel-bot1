const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, estatisticas } = require("../database");
const { JsonDatabase } = require("../database/jsondb");
const { randomUUID: uuidv4 } = require("crypto");
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

const pedidosRobux = new JsonDatabase({
    databasePath: "./database/pedidosrobux.json"
});


async function buscarLinkGamepass(userId, gamepassId, gamepassNameFallback) {
    try {
        const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const gamesData = await gamesRes.json();
        for (const game of (gamesData.data || [])) {
            const placeId = game.rootPlace?.id;
            if (!placeId) continue;
            try {
                const univRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
                const univData = await univRes.json();
                if (!univData.universeId) continue;
                const gpRes = await fetch(`https://apis.roblox.com/game-passes/v1/universes/${univData.universeId}/game-passes?passView=Full`);
                const gpData = await gpRes.json();
                const gps = gpData.gamePasses || gpData.data || [];
                const found = gps.find(gp => gp.id.toString() === gamepassId.toString());
                if (found) {
                    const safeName = (found.name || gamepassNameFallback || 'gamepass')
                        .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
                    return `https://www.roblox.com/game-passes/${found.id}/${safeName}`;
                }
            } catch(e) {}
        }
    } catch(e) {}
    
    const safeName = (gamepassNameFallback || 'gamepass')
        .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
    return `https://www.roblox.com/game-passes/${gamepassId}/${safeName}`;
}

async function VerificarPagamentoRobux(client) {
    const allPayments = pagamentosRobux.fetchAll();

    for (const payment of allPayments) {
        const method = payment.data.pagamento.method;
        const paymentDate = payment.data.pagamento.data;
        const carrinho = payment.data.carrinho;

        let threadChannel;
        try {
            threadChannel = await client.channels.fetch(payment.ID);

            
            const timeoutMs = (method === 'imap') ? 45 * 60 * 1000 : 10 * 60 * 1000;
            const timeLater = paymentDate + timeoutMs;

            if (Date.now() > timeLater) {
                
                await threadChannel.delete().catch(() => {});
                pagamentosRobux.delete(payment.ID);
                carrinhosRobux.delete(payment.data.oderId);

                
                try {
                    const canalLog = robuxConfig.get('config.canais.canceladas');
                    if (canalLog) {
                        const canal = await client.channels.fetch(canalLog);
                        const embedExp = new EmbedBuilder()
                            .setColor(configuracao.get(`Cores.Erro`) || `#ff0000`)
                            .setAuthor({ name: `Pagamento Expirado` })
                            .setDescription(`${Emojis.get(`negative`) || ``} Usuário <@${payment.data.oderId}> deixou o pagamento expirar.`)
                            .addFields(
                                { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` }
                            )
                            .setTimestamp();
                        
                        if (carrinho.robloxUser?.avatar) {
                            embedExp.setThumbnail(carrinho.robloxUser.avatar);
                        }
                        
                        await canal.send({ embeds: [embedExp] });
                    }
                } catch (e) {}
                continue;
            }

        } catch (error) {
            console.error(`[Robux] Erro ao processar pagamento ${payment.ID}:`, error.message);
            pagamentosRobux.delete(payment.ID);
            carrinhosRobux.delete(payment.data.oderId);
            continue;
        }

        
        if (method === 'mercadopago') {
            await verificarMercadoPago(client, payment, threadChannel);
        } else if (method === 'efibank') {
            await verificarEfiBank(client, payment, threadChannel);
        } else if (method === 'misticpay') {
            await verificarMisticPay(client, payment, threadChannel);
        } else if (method === 'imap') {
            
            
        }
    }
}


async function verificarMercadoPago(client, payment, threadChannel) {
    try {
        const mpToken = configuracao.get('pagamentos.MpAPI');
        const res = await axios.get(`https://api.mercadopago.com/v1/payments/${payment.data.pagamento.id}`, {
            headers: { Authorization: `Bearer ${mpToken}` }
        });

        if (res?.data.status === 'approved') {
            await aprovarPagamentoRobux(client, payment, threadChannel, 'Mercado Pago');
        }
    } catch (error) {
        
    }
}


async function verificarEfiBank(client, payment, threadChannel) {
    try {
        const fs = require('fs');
        const https = require('https');

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

        let access_token = await axios(config).then(r => r.data.access_token);

        var configCheck = {
            method: "get",
            url: `https://pix.api.efipay.com.br/v2/cob/${payment.data.pagamento.id}`,
            headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
            httpsAgent: httpsAgent,
        };

        let res = await axios(configCheck).then(r => r.data);

        if (res.status === 'CONCLUIDA') {
            await aprovarPagamentoRobux(client, payment, threadChannel, 'EfiBank');
        }
    } catch (error) {
        
    }
}


async function verificarMisticPay(client, payment, threadChannel) {
    try {
        const clientId = configuracao.get('pagamentos.mistclientid');
        const clientSecret = configuracao.get('pagamentos.misticsecret');

        const res = await axios.post('https://api.misticpay.com/api/transactions/check', {
            transactionId: payment.data.pagamento.id
        }, {
            headers: { 'ci': clientId, 'cs': clientSecret, 'Content-Type': 'application/json' },
            timeout: 5000
        });

        if (res?.data?.transaction?.transactionState === 'COMPLETO') {
            await aprovarPagamentoRobux(client, payment, threadChannel, 'MisticPay');
        }
    } catch (error) {
        
    }
}



async function aprovarPagamentoRobux(client, payment, threadChannel, banco) {
    const carrinho = payment.data.carrinho;
    const oderId = payment.data.oderId;

    
    pagamentosRobux.delete(payment.ID);

    
    pedidosRobux.set(payment.ID, {
        oderId: oderId,
        visão: payment.data.pagamento,
        carrinho: carrinho,
        banco: banco,
        aprovadoEm: Date.now()
    });

    try {
        
        const messages = await threadChannel.messages.fetch({ limit: 100 });
        for (const msg of messages.values()) {
            await msg.delete().catch(() => {});
        }
    } catch (e) {}

    
    const perfilRobloxLink = `https://www.roblox.com/users/${carrinho.robloxUser?.id}/profile`;
    
    let gamepassLink = carrinho.gamepassSelecionado?.url || null;
    if (!gamepassLink && carrinho.gamepassSelecionado?.id && carrinho.robloxUser?.id) {
        gamepassLink = await buscarLinkGamepass(
            carrinho.robloxUser.id,
            carrinho.gamepassSelecionado.id,
            carrinho.gamepassSelecionado.name
        );
    }
    if (!gamepassLink) {
        const safeName = (carrinho.gamepassSelecionado?.name || 'gamepass')
            .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
        gamepassLink = `https://www.roblox.com/game-passes/${carrinho.gamepassSelecionado?.id}/${safeName}`;
    }

    
    const embedAprovado = new EmbedBuilder()
        .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
        .setAuthor({ name: `Pedido Aprovado`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
        .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} O pagamento foi confirmado com sucesso!\n\nAgora é necessário **comprar o GamePass** do cliente para entregar os Robux.`)
        .addFields(
            { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` }
        )
        .addFields(
            { name: `${Emojis.get('user')||''} Cliente Discord`, value: `<@${oderId}>`, inline: true },
            { name: `${Emojis.get('controller')||''} Cliente Roblox`, value: `\`${carrinho.robloxUser?.name || 'N/A'}\``, inline: true },
            { name: `${Emojis.get('bank')||''} Método`, value: `\`Pix - ${banco}\``, inline: true }
        )
        .setFooter({ text: 'Clique nos botões abaixo para acessar o perfil e o GamePass' })
        .setTimestamp();

    if (carrinho.robloxUser?.avatar) {
        embedAprovado.setThumbnail(carrinho.robloxUser.avatar);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Perfil do Usuário')
            .setURL(perfilRobloxLink)
            
            .setStyle(5),
        new ButtonBuilder()
            .setLabel('GamePass')
            .setURL(gamepassLink)
            
            .setStyle(5),
        new ButtonBuilder()
            .setCustomId(`robux_entrega_concluida_${payment.ID}`)
            .setLabel('Entrega Concluída')
            
            .setStyle(3)
    );

    await threadChannel.send({ 
        content: `<@${oderId}>`,
        embeds: [embedAprovado], 
        components: [row] 
    });

    
    try {
        await threadChannel.setName(`✅・${carrinho.robloxUser?.name || 'user'}・robux`);
    } catch (e) {}

    
    try {
        const user = await client.users.fetch(oderId);
        const embedDM = new EmbedBuilder()
            .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
            .setAuthor({ name: `Pedido Aprovado`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
            .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} Seu pagamento de **R$ ${carrinho.valorFinal}** foi aprovado!\n\nAguarde a entrega dos seus **${carrinho.robuxFinal} Robux**.`)
            .addFields(
                { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` },
                { name: `**Forma de Pagamento**`, value: `\`Pix - ${banco}\`` }
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
                .setAuthor({ name: `Pedido Aprovado - Aguardando Entrega` })
                .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} Usuário <@${oderId}> teve o pagamento aprovado e está aguardando entrega.`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` },
                    { name: `**ID do Pedido**`, value: `\`${payment.ID}\`` },
                    { name: `**Forma de pagamento**`, value: `\`Pix - ${banco}\`` }
                )
                .setFooter({ text: threadChannel.guild?.name || 'Servidor' })
                .setTimestamp();

            if (carrinho.robloxUser?.avatar) {
                embedLog.setThumbnail(carrinho.robloxUser.avatar);
            }

            await canal.send({ embeds: [embedLog] });
        }
    } catch (e) {}
}


async function confirmarEntregaRobux(interaction, pedidoId, client) {
    
    if (!interaction.member.permissions.has(`Administrator`)) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Apenas **administradores** podem confirmar a entrega!`,
            flags: 64
        });
    }

    const pedido = pedidosRobux.get(pedidoId);
    
    if (!pedido) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ''} | Pedido não encontrado!`,
            flags: 64
        });
    }

    const carrinho = pedido.carrinho;
    const guild = interaction.guild;

    
    pedido.entregue = true;
    pedido.entregueEm = Date.now();
    pedido.entreguePor = interaction.user.id;
    pedidosRobux.set(pedidoId, pedido);

    
    carrinhosRobux.delete(pedido.oderId);

    
    const embedFinal = new EmbedBuilder()
        .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
        .setAuthor({ name: `Pedido #${pedidoId}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
        .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('giveaway') || ``} Os Robux foram entregues com sucesso!\n\nEste canal será deletado em **10 segundos**.`)
        .addFields(
            { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` }
        )
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    await interaction.update({ embeds: [embedFinal], components: [] });

    
    try {
        const user = await client.users.fetch(pedido.oderId);
        const embedDM = new EmbedBuilder()
            .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
            .setAuthor({ name: `Pedido #${pedidoId}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
        .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('giveaway') || ``} Seus **${carrinho.robuxFinal} Robux** foram entregues com sucesso!\n\nObrigado por comprar conosco!`)
            .addFields(
                { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` }
            )
            .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        await user.send({ embeds: [embedDM] }).catch(() => {});
    } catch (e) {}

    
    try {
        const canalAprovadas = robuxConfig.get('config.canais.aprovadas');
        if (canalAprovadas) {
            const canal = await client.channels.fetch(canalAprovadas);
            const embedLog = new EmbedBuilder()
                .setColor(configuracao.get(`Cores.Sucesso`) || `#2ecc71`)
                .setAuthor({ name: `Pedido #${pedidoId}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                .setDescription(`${Emojis.get(`completedcart_emoji`) || Emojis.get('checker') || ``} Usuário <@${pedido.oderId}> teve seu pedido de Robux entregue.`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${carrinho.robuxFinal} Robux - ${carrinho.gamepassSelecionado?.name || `N/A`} | R$ ${carrinho.valorFinal}\`` },
                    { name: `**Roblox**`, value: `\`${carrinho.robloxUser?.name || `N/A`}\``, inline: true },
                    { name: `**Entregue por**`, value: `<@${interaction.user.id}>`, inline: true }
                )
                .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            if (carrinho.robloxUser?.avatar) {
                embedLog.setThumbnail(carrinho.robloxUser.avatar);
            }

            await canal.send({ embeds: [embedLog] });
        }
    } catch (e) {
        console.error('[Robux] Erro ao enviar log de aprovação:', e);
    }

    
    
    try {
        const valorNum = parseFloat(carrinho.valorFinal) || 0;
        const qtdRobux = carrinho.robuxFinal || 0;
        estatisticas.set(uuidv4(), {
            produto: `Robux - ${qtdRobux}R$`,
            campo: carrinho.tipoTaxa || 'robux',
            quantidade: qtdRobux,
            valor: valorNum,
            data: Date.now(),
            guild: guild.id,
            userid: pedido.oderId
        });
        
        const { CheckPosition } = require("./PosicoesFunction");
        CheckPosition(client).catch(() => {});
    } catch (e) {}

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (e) {}
    }, 10000);
}

module.exports = {
    VerificarPagamentoRobux,
    aprovarPagamentoRobux,
    confirmarEntregaRobux,
    pedidosRobux
}