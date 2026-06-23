const { produtos, configuracao } = require("../database");
const { QuickDB } = require("../database/jsondb");
const db = new QuickDB();
const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { res } = require("../res"); 
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};


const Entrega2 = configuracao.get(`Emojis_EntregAuto`);
let msg_entrega = ``;
if (Entrega2 !== null) {
    Entrega2.sort((a, b) => {
        const numA = parseInt(a.name.replace('ea', ''), 10);
        const numB = parseInt(b.name.replace('ea', ''), 10);
        return numA - numB;
    });
    Entrega2.forEach(element => {
        msg_entrega += `<:${element.name}:${element.id}>`;
    });
}


function formatarEmoji(emojiData) {
    if (!emojiData || emojiData === "") return { id: '1250848496987406487' }; 
    if (/^\d+$/.test(emojiData)) return { id: emojiData };
    if (emojiData.includes(':')) {
        const id = emojiData.split(':')[2].replace('>', '');
        return { id: id };
    }
    return { name: emojiData };
}


function montarCorpoV2(yyy, fdfd, produtoId) {
    const itens = [];

    
    if (yyy.Config?.banner && yyy.Config.banner.startsWith('http')) {
        itens.push({
            type: 12,
            items: [{ media: { url: yyy.Config.banner.trim() }, spoiler: false }]
        });
    }

    

    
    itens.push({ type: 14 });

    
    let textoDesc = !yyy.Config.desc || yyy.Config.desc == '' ? `Faça sua compra automática abaixo!` : yyy.Config.desc;
    if (yyy.Config.entrega == 'Sim' && msg_entrega !== ``) { 
        textoDesc = `${msg_entrega}\n\n${textoDesc}`; 
    }
    itens.push({ type: 10, content: textoDesc });

    
    if (yyy.Campos && yyy.Campos.length === 1) {
        itens.push({ type: 14 });
        itens.push({ 
            type: 10, 
            content: `> **Nome Produto**: ${yyy.Config.name || "Produto"}\n> **Valor:** \`R$ ${Number(yyy.Campos[0].valor).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })}\`\n> **Restam:** \`${yyy.Campos[0].estoque.length}\` unidades` 
        });
    }

    
    if (yyy.Campos.length > 1) {
        itens.push({
            type: 1, 
            components: [{
                type: 3, 
                custom_id: 'comprarid',
                placeholder: `Clique aqui para ver as opções`,
                options: yyy.Campos.map(element => ({
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

async function MessageCreate(interaction, client) {
    const fdfd = await db.get(`${interaction.user.id}_colocarvenda`);
    if (!fdfd) return interaction.reply({ content: "Erro ao recuperar dados.", flags: 64 });

    const yyy = produtos.get(fdfd.produto);
    const channel = await client.channels.fetch(interaction.values[0]);

    const itensContainer = montarCorpoV2(yyy, fdfd, fdfd.produto);
    let componentesExternos = [];

    
    if (yyy.Campos.length === 1 && fdfd.textobutton !== undefined) {
        let estilo = 2;
        if (fdfd.estilobutton == 'verde') estilo = 3;
        if (fdfd.estilobutton == 'azul') estilo = 1;
        if (fdfd.estilobutton == `vermelho`) estilo = 4;

        componentesExternos.push({
            type: 1,
            components: [{
                type: 2,
                style: estilo,
                label: fdfd.textobutton,
                custom_id: `comprarid_${yyy.Campos[0].Nome}_${fdfd.produto}`,
                emoji: formatarEmoji(fdfd.emoji)
            }]
        });
    }

    try {
        await interaction.update({ content: `${Emojis.get(`loading`)} Publicando...`, components: [], embeds: [] });

        const payload = res.main(...itensContainer).with({
            content: " ",
            components: componentesExternos, 
            flags: [64] 
        });

        const msggg = await channel.send(payload);

        await produtos.push(`${fdfd.produto}.mensagens`, { 
            guildid: msggg.guild.id, channelid: msggg.channel.id, mesageid: msggg.id,
            btn_style: fdfd.estilobutton, btn_emoji: fdfd.emoji, btn_text: fdfd.textobutton
        });

        const rowLink = new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(msggg.url).setLabel(`Ir para a venda`).setStyle(5));
        await interaction.editReply({ content: `${Emojis.get(`checker`)} Postado!`, components: [rowLink] });

    } catch (error) {
        console.error(error);
    }
}

async function UpdateMessageProduto(client, produto) {
    const ghgh = await produtos.get(produto);
    if (!ghgh || !ghgh.mensagens) return;

    for (const element of ghgh.mensagens) {
        try {
            let channel;
            try { channel = await client.channels.fetch(element.channelid); } catch (ce) { continue; }
            if (!channel) continue;
            let fetchedMessage;
            try { fetchedMessage = await channel.messages.fetch(element.mesageid); } catch (me) { continue; }
            if (!fetchedMessage) continue;
            
            const itensContainer = montarCorpoV2(ghgh, null, produto);
            let componentesExternos = [];

            
            if (ghgh.Campos.length === 1) {
                let estilo = 2;
                if (element.btn_style == 'verde') estilo = 3;
                if (element.btn_style == 'azul') estilo = 1;
                if (element.btn_style == 'vermelho') estilo = 4;
                const emojiRaw = element.btn_emoji || "🛒";
                
                componentesExternos.push({
                    type: 1,
                    components: [{
                        type: 2,
                        style: estilo,
                        label: element.btn_text || "Comprar",
                        custom_id: `comprarid_${ghgh.Campos[0].Nome}_${produto}`,
                        emoji: formatarEmoji(emojiRaw)
                    }]
                });
            }

            const updateResponse = res.main(...itensContainer).with({
                content: " ",
                components: componentesExternos,
                flags: [64]
            });

            await fetchedMessage.edit(updateResponse);
        } catch (error) { console.error(error); }
    }
}

module.exports = { MessageCreate, UpdateMessageProduto };