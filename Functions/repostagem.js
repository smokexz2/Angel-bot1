const cron = require('node-cron');
const Discord = require("discord.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { produtos, configuracao } = require("../database");
const { res } = require("../res");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

let cronJob = null;


function formatarEmoji(emojiData) {
    if (!emojiData || emojiData === "") return { id: '1250848496987406487' }; 
    if (/^\d+$/.test(emojiData)) return { id: emojiData };
    if (emojiData.includes(':')) {
        const id = emojiData.split(':')[2]?.replace('>', '');
        if (id) return { id: id };
    }
    return { name: emojiData };
}


function getMsgEntrega() {
    const Entrega2 = configuracao.get(`Emojis_EntregAuto`);
    let msg_entrega = ``;
    if (Entrega2 !== null && Array.isArray(Entrega2)) {
        Entrega2.sort((a, b) => {
            const numA = parseInt(a.name.replace('ea', ''), 10);
            const numB = parseInt(b.name.replace('ea', ''), 10);
            return numA - numB;
        });
        Entrega2.forEach(element => {
            msg_entrega += `<:${element.name}:${element.id}>`;
        });
    }
    return msg_entrega;
}


function montarCorpoV2(produtoInfo, produtoId) {
    const itens = [];
    const msg_entrega = getMsgEntrega();

    
    if (produtoInfo.Config?.banner && produtoInfo.Config.banner.startsWith('http')) {
        itens.push({
            type: 12,
            items: [{ media: { url: produtoInfo.Config.banner.trim() }, spoiler: false }]
        });
    }

    
    itens.push({ type: 14 });

    
    let textoDesc = !produtoInfo.Config.desc || produtoInfo.Config.desc == '' ? `Faça sua compra automática abaixo!` : produtoInfo.Config.desc;
    if (produtoInfo.Config.entrega == 'Sim' && msg_entrega !== ``) { 
        textoDesc = `${msg_entrega}\n\n${textoDesc}`; 
    }
    itens.push({ type: 10, content: textoDesc });

    
    if (produtoInfo.Campos && produtoInfo.Campos.length === 1) {
        itens.push({ type: 14 });
        itens.push({ 
            type: 10, 
            content: `> **Nome Produto**: ${produtoInfo.Config.name || "Produto"}\n> **Valor:** \`R$ ${Number(produtoInfo.Campos[0].valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })}\`\n> **Restam:** \`${produtoInfo.Campos[0].estoque.length}\` unidades` 
        });
    }

    
    if (produtoInfo.Campos.length > 1) {
        itens.push({
            type: 1, 
            components: [{
                type: 3, 
                custom_id: 'comprarid',
                placeholder: `Clique aqui para ver as opções`,
                options: produtoInfo.Campos.map(element => ({
                    label: element.Nome,
                    description: `R$ ${Number(element.valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })} - Estoque: ${element.estoque.length}`,
                    value: `${element.Nome}_${produtoId}`,
                    emoji: formatarEmoji(element.emoji)
                }))
            }]
        });
    }

    return itens;
}

async function repostarProdutos(client) {
    try {
        const todosProdutos = await produtos.all();
        console.log('Número de produtos:', todosProdutos.length);
        
        for (const produtoData of todosProdutos) {
            const produtoId = produtoData.ID;
            const produtoInfo = produtoData.data;
            
            if (!produtoInfo || !produtoInfo.mensagens || !Array.isArray(produtoInfo.mensagens)) {
                console.log(`Produto ${produtoId} não tem dados válidos. Pulando...`);
                continue;
            }
            
            for (const mensagem of produtoInfo.mensagens) {
                try {
                    if (!mensagem.channelid || !mensagem.mesageid) {
                        console.log(`Dados de mensagem incompletos para o produto ${produtoId}. Pulando...`);
                        continue;
                    }

                    const channel = await client.channels.fetch(mensagem.channelid);
                    const oldMessage = await channel.messages.fetch(mensagem.mesageid);
                    await oldMessage.delete();

                    const newMessage = await criarNovaMensagemV2(client, channel, produtoId, produtoInfo, mensagem);

                    await atualizarMensagemNoBD(produtoId, mensagem, newMessage);

                } catch (error) {
                    const systemLogsChannelId = configuracao.get(`ConfigChannels.systemlogs`);
                    
                    if (systemLogsChannelId) {
                        const systemLogsChannel = client.channels.cache.get(systemLogsChannelId);
                        
                        if (systemLogsChannel) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('Erro ao Repostar Produto')
                                .setDescription(`Ocorreu um erro ao tentar repostar o produto.`)
                                .addFields(
                                    { name: 'ID do Produto', value: produtoId.toString(), inline: true },
                                    { name: 'Tipo de Erro', value: error.name || 'Desconhecido', inline: true },
                                    { name: 'Mensagem de Erro', value: error.message || 'Sem mensagem' }
                                )
                                .setFooter({ text: 'Sistema de Logs' })
                                .setTimestamp();
                
                            systemLogsChannel.send({ embeds: [errorEmbed] });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao obter produtos do banco de dados:', error);
    }
}

async function criarNovaMensagemV2(client, channel, produtoId, produtoInfo, mensagemAntiga) {
    const itensContainer = montarCorpoV2(produtoInfo, produtoId);
    let componentesExternos = [];

    
    if (produtoInfo.Campos.length === 1) {
        let estilo = 2;
        if (mensagemAntiga.btn_style == 'verde') estilo = 3;
        if (mensagemAntiga.btn_style == 'azul') estilo = 1;
        if (mensagemAntiga.btn_style == 'vermelho') estilo = 4;
        
        componentesExternos.push({
            type: 1,
            components: [{
                type: 2,
                style: estilo,
                label: mensagemAntiga.btn_text || "Comprar",
                custom_id: `comprarid_${produtoInfo.Campos[0].Nome}_${produtoId}`,
                emoji: formatarEmoji(mensagemAntiga.btn_emoji)
            }]
        });
    }

    const payload = res.main(...itensContainer).with({
        content: " ",
        components: componentesExternos
    });

    const newMessage = await channel.send(payload);
    return newMessage;
}

async function atualizarMensagemNoBD(produtoId, mensagemAntiga, novaMensagem) {
    try {
        const produtoInfo = await produtos.get(produtoId);
        
        if (!produtoInfo || !produtoInfo.mensagens) {
            console.log(`Não foi possível atualizar a mensagem para o produto ${produtoId}. Dados inválidos.`);
            return;
        }

        
        const btnData = {
            btn_style: mensagemAntiga.btn_style,
            btn_emoji: mensagemAntiga.btn_emoji,
            btn_text: mensagemAntiga.btn_text
        };

        produtoInfo.mensagens = produtoInfo.mensagens.filter(m => m.mesageid !== mensagemAntiga.mesageid);

        produtoInfo.mensagens.push({
            guildid: novaMensagem.guild.id,
            channelid: novaMensagem.channel.id,
            mesageid: novaMensagem.id,
            ...btnData
        });

        await produtos.set(produtoId, produtoInfo);
    } catch (error) {
        console.error(`Erro ao atualizar mensagem no banco de dados para o produto ${produtoId}:`, error);
    }
}

function agendarRepostagem(client) {
    const horaConfig = configuracao.get("Repostagem.Hora");
    const statusConfig = configuracao.get("Repostagem.Status");

    if (statusConfig === true) {
        const [hour, minute] = horaConfig.split(":");
        const cronTime = `${minute} ${hour} * * *`;
        const timeZone = 'America/Sao_Paulo'; 

        if (cronJob) {
            cronJob.stop();
        }

        cronJob = cron.schedule(cronTime, () => {
            repostarProdutos(client);
        }, {
            scheduled: true,
            timezone: timeZone 
        });
    } else {
        if (cronJob) {
            cronJob.stop();
            cronJob = null;
        }
    }
}

function pararRepostagem() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('Cron job interrompido.');
    }
}

async function iniciarRepostagem(client) {
    console.log('Iniciando teste de repostagem imediatamente.');
    await repostarProdutos(client);
}

module.exports = { agendarRepostagem, pararRepostagem, iniciarRepostagem };