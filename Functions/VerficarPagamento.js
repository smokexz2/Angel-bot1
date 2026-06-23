const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { pagamentos, carrinhos, pedidos, produtos, configuracao, Emojis } = require("../database")
const fs = require("fs")
const path = require("path")
const https = require("https");
const axios = require("axios");
const { BloquearBanco } = require("./BloquearBanco");
const { CheckPosition } = require("./PosicoesFunction");
const Gerencianet = require("sdk-node-apis-efi");
const imaps = require('imap-simple');
const { simpleParser } = require(`mailparser`);

async function VerificarPagamento(client) {
    const allPayments = pagamentos.fetchAll();

    for (const payment of allPayments) {
        const method = payment.data.pagamentos.method;
        const paymentDate = payment.data.pagamentos.data;

        let threadChannel
        try {
            threadChannel = await client.channels.fetch(payment.ID);

            const tenMinutesLater = paymentDate + 10 * 60 * 1000;

            if (Date.now() > tenMinutesLater) {

                await threadChannel.delete()
                const texto = threadChannel.name;
                const partes = texto.split("・");
                const ultimoNumero = partes[partes.length - 1];
                const car = carrinhos.get(payment.ID);
                pagamentos.delete(payment.ID)
                carrinhos.delete(payment.ID)

                try {
                    const channela = await client.channels.fetch(`${configuracao.get("ConfigChannels.systemlogs")}`);

                    const mandanopvdocara = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`)
                        .setAuthor({ name: `Pedido #${car.pagamentos.id}` })
                        .setTitle(`${Emojis.get(`negative`)||''} Pagamento expirado`)
                        .setFooter(
                            { text: car.guild.name, iconURL: car.guild.iconURL }
                        )
                        .setTimestamp()
                        .setDescription(`Usuário <@!${ultimoNumero}> deixou o pagamento expirar.`);

                    await channela.send({ embeds: [mandanopvdocara] });
                } catch (error) {

                }
                return
            }

        } catch (error) {
            console.error(`Error processing PIX payment for ID ${payment.ID}: ${error}`);
            pagamentos.delete(payment.ID);
            carrinhos.delete(payment.ID)
        
        } 
if (method === 'imap') {

   
    const yy = await carrinhos.get(payment.ID);
    if (!yy || !yy.pagamentos) return;

    const bancoAtivo = configuracao.get('pagamentos.imap.banco_atual') || 'inter';
    const pagadorEsperado = (yy.pagamentos.pagador || "").toLowerCase();
    
    const valorReal = yy.pagamentos.valor || "0.00"; 
    const valorComVirgula = String(valorReal).replace('.', ',');


    const configImap = {
        imap: {
            user: configuracao.get('pagamentos.imap.user'),
            password: configuracao.get('pagamentos.imap.password'),
            host: configuracao.get('pagamentos.imap.host'),
            port: 993,
            tls: true,
            authTimeout: 5000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const imaps = require('imap-simple');
        const { simpleParser } = require('mailparser');

        const connection = await imaps.connect(configImap);
        await connection.openBox('INBOX');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const searchCriteria = ['UNSEEN', ['SINCE', yesterday]];
        
        const messages = await connection.search(searchCriteria, { bodies: [''], markSeen: true });

        for (const item of messages) {
            const all = item.parts.find(part => part.which === '');
            const parsed = await simpleParser(all.body);
            
            const body = (parsed.text || "").toLowerCase();
            const subject = (parsed.subject || "").toLowerCase();

            const confirmouNome = body.includes(pagadorEsperado);
            const confirmouValor = body.includes(valorComVirgula) || body.includes(`r$ ${valorComVirgula}`);

            const matchesAssunto = 
                (subject.includes('pix recebido')) || 
                (subject.includes('você recebeu um pix')) || 
                (subject.includes('você recebeu uma transferência')) || 
                (body.includes(`recebeu um pix`));

            if (matchesAssunto && confirmouNome && confirmouValor) {
                console.log(` [${bancoAtivo.toUpperCase()}] E-mail de ${pagadorEsperado} aprovado!`);

                
                pagamentos.delete(payment.ID);
                pedidos.set(payment.ID, { id: `IMAP_${item.attributes.uid}`, method: `imap`, bank: bancoAtivo });

                
                try {
                    const userDM = await client.users.fetch(yy.user.id);
                    const embedDM = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Sucesso`) || `#40fc04`}`)
                        .setAuthor({ 
                            name: `Pedido #${payment.ID}`, 
                            iconURL: `https://cdn.discordapp.com/emojis/1249486723520397314.png` 
                        })
                        .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                        .addFields({ name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorComVirgula}\`` })
                        .setFooter({ text: threadChannel.guild.name, iconURL: threadChannel.guild.iconURL() })
                        .setTimestamp();

                    await userDM.send({ embeds: [embedDM] }).catch(() => {});
                } catch (e) { console.log("Erro ao enviar DM."); }

                
                try {
                    const messagesDel = await threadChannel.messages.fetch({ limit: 100 });
                    await threadChannel.bulkDelete(messagesDel).catch(() => {});
                } catch (e) {}

                await threadChannel.send({ 
                    content: `${Emojis.get(`loading`)} Pagamento Aprovado! Iniciando Entrega..` 
                });

                
                if (configuracao.get('ConfigRoles.cargoCliente')) {
                    try {
                        const guild = client.guilds.cache.get(yy.guild.id);
                        const member = await guild.members.fetch(yy.user.id);
                        await member.roles.add(configuracao.get(`ConfigRoles.cargoCliente`));
                    } catch (e) {
                        console.log(`${Emojis.get(`warn_emoji`)||''} Erro ao dar cargo para o cliente no IMAP: ${e.message}`);
                    }
                }

                
                try {
                    const lk = yy.replys;
                    const channelStaff = await client.channels.fetch(lk.channelid);
                    const msgStaff = await channelStaff.messages.fetch(lk.idmsg);
                    const embedStaff = new EmbedBuilder()
                        .setColor('#40fc04')
                        .setAuthor({ name: `Venda Concluída (IMAP)` })
                        .addFields(
                            { name: `${Emojis.get(`user`)||``} Cliente`, value: `<@${yy.user.id}>` },
                            { name: `${Emojis.get(`dinheiro`)||``} Valor`, value: `\`R$ ${valorComVirgula}\``, inline: true },
                            { name: `${Emojis.get(`bank`)||``} Banco`, value: `\`${bancoAtivo.toUpperCase()}\``, inline: true }
                        ).setTimestamp();
                    await msgStaff.reply({ embeds: [embedStaff] });
                } catch (e) {}

                
                await EntregarPagamentos(client, payment.ID, threadChannel);
                CheckPosition(client);

                connection.end();
                return; 
            }
        }
        connection.end();
    } catch (error) {
        console.error(`${Emojis.get(`warn_emoji`)||''} [IMAP] Erro na verificação: ${error.message}`);
    }
}
if (method === 'misticpay') {
    let res;
    const clientId = configuracao.get('pagamentos.mistclientid');
    const clientSecret = configuracao.get(`pagamentos.misticsecret`);

    if (!clientId || !clientSecret) {
        return console.error("${Emojis.get(`negative`)||''} [MISTIC ERROR] Credenciais não encontradas no banco de dados.");
    }

    
    if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {
        try {
            res = await axios.post('https://api.misticpay.com/api/transactions/check', {
                transactionId: payment.data.pagamentos.id 
            }, {
                headers: { 'ci': clientId, 'cs': clientSecret, 'Content-Type': 'application/json' },
                timeout: 5000 
            });
        } catch (error) {
            
        }
    }

    const statusMistic = res?.data?.transaction?.transactionState;
    const isManual = payment.data.pagamentos.id === `Aprovado Manualmente`;

    
    if (statusMistic === 'COMPLETO' || isManual) {
        
        const yy = await carrinhos.get(payment.ID);
        if (!yy) return;

        
        pagamentos.delete(payment.ID);
        
        
        let valorFinal = 0;
        if (yy.infos.tipo === 'jogo') {
            valorFinal = yy.infos.preco * (yy.quantidadeselecionada || 1);
        } else {
            const prodData = produtos.get(`${yy.infos.produto}.Campos`);
            const item = prodData ? prodData.find(c => c.Nome === yy.infos.campo) : null;
            valorFinal = item ? item.valor * yy.quantidadeselecionada : 0;
            if (yy.cupomadicionado) {
                const cupons = produtos.get(`${yy.infos.produto}.Cupom`);
                const cupom = cupons ? cupons.find(c => c.Nome === yy.cupomadicionado) : null;
                if (cupom) valorFinal = valorFinal * (1 - cupom.desconto / 100);
            }
        }
        const valorFormatado = Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        
        try {
            const userDM = await client.users.fetch(yy.user.id);
            const embedDM = new EmbedBuilder()
                .setColor(configuracao.get(`Cores.Sucesso`) || `#40fc04`)
                .setAuthor({ 
                    name: `Pedido #${payment.ID}`, 
                    iconURL: `https://cdn.discordapp.com/emojis/1249486723520397314.png` 
                })
                .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                .addFields(
                    { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${valorFormatado}\`` },
                )
                .setFooter({ text: yy.guild.name, iconURL: yy.guild.iconURL })
                .setTimestamp();

            await userDM.send({ embeds: [embedDM] }).catch(() => {});
        } catch (e) {}

        
        try {
            const messagesDel = await threadChannel.messages.fetch({ limit: 100 });
            await threadChannel.bulkDelete(messagesDel).catch(() => {});
        } catch (e) {}

        await threadChannel.send({ 
            content: `${Emojis.get(`loading`)} Pagamento Aprovado! Iniciando Entrega..` 
        });

        
        let bank = res?.data?.transaction?.payerBank || 'Mistic Pay (Pix)';
        pedidos.set(payment.ID, { id: isManual ? 'Manual' : payment.data.pagamentos.id, method: 'misticpay', bank: bank });

        
        try {
            const lk = yy.replys;
            const channelStaff = await client.channels.fetch(lk.channelid);
            const msgStaff = await channelStaff.messages.fetch(lk.idmsg);
            const embedStaff = new EmbedBuilder()
                .setColor('#40fc04')
                .setAuthor({ name: `Venda Concluída (Mistic Pay)` })
                .addFields(
                    { name: `${Emojis.get(`user`)||``} Cliente`, value: `<@${yy.user.id}>` },
                    { name: `${Emojis.get(`dinheiro`)||``} Valor`, value: `\`R$ ${valorFormatado}\``, inline: true },
                    { name: `${Emojis.get(`bank`)||''} Banco`, value: `\`${bank}\``, inline: true }
                ).setTimestamp();
            await msgStaff.reply({ embeds: [embedStaff] });
        } catch (e) {}

        
        if (configuracao.get('ConfigRoles.cargoCliente')) {
            try {
                const guild = client.guilds.cache.get(yy.guild.id);
                const member = await guild.members.fetch(yy.user.id);
                await member.roles.add(configuracao.get('ConfigRoles.cargoCliente'));
            } catch (e) {}
        }

        
        await EntregarPagamentos(client, payment.ID, threadChannel);

        CheckPosition(client);
    }
}
      if (method === `pix`) {
            let res
            if (payment.data.pagamentos.id !== `Aprovado Manualmente`) {
                res = await axios.get(`https://api.mercadopago.com/v1/payments/${payment.data.pagamentos.id}`, {
                    headers: {
                        Authorization: `Bearer ${configuracao.get(`pagamentos.MpAPI`)}`
                    }
                })
            }

       
            if (res?.data.status == `approved` || payment.data.pagamentos.id == `Aprovado Manualmente`) {
                pagamentos.delete(payment.ID)
                const yy = await carrinhos.get(payment.ID);
                const messages = await threadChannel.messages.fetch({ limit: 100 });
                await threadChannel.bulkDelete(messages);



                const mandanopvdocara = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Principal`) == null ? `0cd4cc`: configuracao.get(`Cores.Principal`)}`)
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`${Emojis.get(`relogio`)||``} Aguarde...`)
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()
                const msg = await threadChannel.send({ content: `${Emojis.get(`loading`)} Pagamento Aprovado! Iniciando Entrega..`, embeds: [] })






                let valor = 0
                if (yy.infos.tipo === 'jogo') {
                    valor = yy.infos.preco * (yy.quantidadeselecionada || 1);
                } else {
                    const hhhh = produtos.get(`${yy.infos.produto}.Campos`)
                    const gggaaa = hhhh ? hhhh.find(campo22 => campo22.Nome === yy.infos.campo) : null
                    if (gggaaa) {
                        if (yy.cupomadicionado !== undefined) {
                            const valor2 = gggaaa.valor * yy.quantidadeselecionada
                            const hhhh2 = produtos.get(`${yy.infos.produto}.Cupom`)
                            const gggaaaawdwadwa = hhhh2 ? hhhh2.find(campo22 => campo22.Nome === yy.cupomadicionado) : null
                            if (gggaaaawdwadwa) valor = valor2 * (1 - gggaaaawdwadwa.desconto / 100);
                            else valor = gggaaa.valor * yy.quantidadeselecionada
                        } else {
                            valor = gggaaa.valor * yy.quantidadeselecionada
                        }
                    }
                }

                const lk = carrinhos.get(`${payment.ID}.replys`)
                let bank = res?.data.point_of_interaction.transaction_data.bank_info.payer.long_name


                if (configuracao.get(`pagamentos.BancosBloqueados`) !== null) {
                    const dd = await BloquearBanco(client, bank, payment.data.pagamentos.id, yy, msg)

                    const embed = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`)
                        .setAuthor({ name: `Pedido #${payment.ID}` })
                        .setTitle(`Pedido não aprovado`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                        .addFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )

                    const embed2 = new EmbedBuilder()
                        .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#ff0000` : configuracao.get(`Cores.Erro`)}`)
                        .setAuthor({ name: `Pedido #${payment.ID}` })
                        .setTitle(`Anti Banco | Nova Venda`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${bank}\`, o dinheiro do Comprador foi reembolsado, Obrigado por confiar em meu trabalho.`).addFields(
                            { name: `Detalhes`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` }
                        )


                    if (dd?.status == 400) {

                        try {
                            const channela = await client.channels.fetch(lk.channelid);

                            const yuyu = await channela.messages.fetch(lk.idmsg)


                            yuyu.reply({ embeds: [embed2] })

                        } catch (error) {
                        }



                        msg.edit({ embeds: [embed], content: `` })

                        setInterval(async () => {
                            try { await threadChannel.delete() } catch (error) { }

                        }, 10000);
                        return
                    }

                const status = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'pending' ? `AutoApproved` : Number(payment.data.pagamentos.id));
                pedidos.set(payment.ID, { id: status, method: method })

                await msg.edit({ content: `${Emojis.get(`loading`)} Pagamento Aprovado, Aguarde um momento...`, embeds: [] })

                const mandanopvdocara2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#53c435` : configuracao.get(`Cores.Processamento`)}`) 
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`Pagamento confirmado`)
                    .setDescription(`${Emojis.get('relogio')||''} Aguarde...`)
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [], content: `${Emojis.get(`loading`)} Pagamento Aprovado, Aguarde um momento...` })









                const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                try {
                    const member = await client.users.fetch(yy.user.id)
                    await member.send({ embeds: [dsfjmsdfjnsdfj2] })
                } catch (error) {

                }



                const status2 = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'pending' ? `AutoApproved` : bank);
                const dsfjmsdfjnsdfj222 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Usuário <@!${yy.user.id}> efetuou o pagamento.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Banco`, value: `\`${status2}\`` }
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()


                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setDisabled(res?.data?.status == 'approved' ? false : true)
                    );




                try {
                    const channela = await client.channels.fetch(lk.channelid);

                    const yuyu = await channela.messages.fetch(lk.idmsg)
                    yuyu.reply({ embeds: [dsfjmsdfjnsdfj222], components: [row222] }).then(aaaaa => {
                        carrinhos.set(`${payment.ID}.replys`, { channelid: aaaaa.channel.id, idmsg: aaaaa.id })
                    })
                } catch (error) {

                }

                CheckPosition(client)
                try {
                    const cargoClienteId = configuracao.get('ConfigRoles.cargoCliente');
                    if (cargoClienteId !== null && cargoClienteId) {
                        const guild = client.guilds.cache.get(yy.guild.id);
                        if (guild) {
                            const role = guild.roles.cache.get(cargoClienteId);
                            if (role) {
                                const member = await guild.members.fetch(yy.user.id).catch(() => null);
                                if (member) await member.roles.add(role).catch(() => {});
                            }
                        }
                    }
                } catch (error) {

                }







                CheckPosition(client)








                

            }



                const status = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'ATIVA' ? `CONCLUIDA` : Number(payment.data.pagamentos.id));
                pedidos.set(payment.ID, { id: status, method: method })

                await msg.edit({ content: `${Emojis.get('relogio')||''} Aguarde...`, embeds: [] })

                const mandanopvdocara2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Processamento`) == null ? `#53c435` : configuracao.get(`Cores.Processamento`)}`) 
                    .setAuthor({ name: `${yy.user.globalName}` })
                    .setTitle(`Pagamento confirmado`)
                    .setDescription(`${Emojis.get('relogio')||''} Aguarde...`)
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [mandanopvdocara2], content: `` })








                const dsfjmsdfjnsdfj2 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Seu pagamento foi aprovado, e o processo de entrega já foi iniciado.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()

                try {
                    const member = await client.users.fetch(yy.user.id)
                    await member.send({ embeds: [dsfjmsdfjnsdfj2] })
                } catch (error) {

                }



                const status2 = (payment.data.pagamentos.id === 'Aprovado Manualmente') ? 'Aprovado Manualmente' : (res.data.status === 'ATIVA' ? `CONCLUIDA` : bank);
                const dsfjmsdfjnsdfj222 = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#40fc04` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Pedido #${payment.data.pagamentos.id}`, iconURL: `https://images-ext-1.discordapp.net/external/CjyTPdl-laCV1ZOHeYVVHvqcGAyZL70PEVz9MRkQEqI/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486723520397314.png?format=webp&quality=lossless` })
                    .setDescription(`Usuário <@!${yy.user.id}> efetuou o pagamento.`)
                    .addFields(
                        { name: `**Detalhes**`, value: `\`${yy.quantidadeselecionada}x ${yy.infos.produto} - ${yy.infos.campo} | R$ ${Number(valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`` },
                        { name: `Banco`, value: `\`${status2}\`` }
                    )
                    .setFooter(
                        { text: yy.guild.name, iconURL: yy.guild.iconURL }
                    )
                    .setTimestamp()


                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refoundd_${payment.data.pagamentos.id}`)
                            .setLabel('Reembolsar')
                            .setStyle(2)
                            .setDisabled(res?.data?.status == 'CONCLUIDA' ? false : true)
                    );




                try {
                    const channela = await client.channels.fetch(lk.channelid);

                    const yuyu = await channela.messages.fetch(lk.idmsg)
                    yuyu.reply({ embeds: [dsfjmsdfjnsdfj222], components: [row222] }).then(aaaaa => {
                        carrinhos.set(`${payment.ID}.replys`, { channelid: aaaaa.channel.id, idmsg: aaaaa.id })
                    })
                } catch (error) {

                }

                CheckPosition(client)
                try {
                    const cargoClienteId2 = configuracao.get('ConfigRoles.cargoCliente');
                    if (cargoClienteId2 !== null && cargoClienteId2) {
                        const guild2 = client.guilds.cache.get(yy.guild.id);
                        if (guild2) {
                            const role2 = guild2.roles.cache.get(cargoClienteId2);
                            if (role2) {
                                const member2 = await guild2.members.fetch(yy.user.id).catch(() => null);
                                if (member2) await member2.roles.add(role2).catch(() => {});
                            }
                        }
                    }
                } catch (error) {

                }







                CheckPosition(client)








                threadChannel.setName(`⏰・${yy.user.username}・${yy.user.id}`);

            }
        } else if (method !== 'imap' && method !== 'misticpay') {
            console.log(`Unknown payment method: ${method}`);
        }
    }
}




module.exports = {
    VerificarPagamento
}






