const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { tickets } = require("../database");

function emojiComponent(value) {
    if (!value) return undefined;
    const str = String(value).trim();
    const custom = str.match(/^<a?:(\w+):(\d+)>$/);
    if (custom) return { name: custom[1], id: custom[2], animated: str.startsWith('<a:') };
    if (/^\d{15,25}$/.test(str)) return { id: str };
    if (/^\p{Extended_Pictographic}/u.test(str)) return { name: str };
    return undefined;
}

function ticketOptions(funcoes) {
    return Object.keys(funcoes || {}).slice(0, 25).map((key) => {
        const item = funcoes[key] || {};
        const opt = {
            label: String(item.nome || key).slice(0, 100),
            description: String(item.descricao || item.predescricao || 'Abrir ticket').slice(0, 100),
            value: String(key).slice(0, 100)
        };
        const emoji = emojiComponent(item.emoji);
        if (emoji) opt.emoji = emoji;
        return opt;
    });
}

function CreateMessageTicket(interaction, channel, client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const modoContent = tickets.get(`tickets.config.modoContent`) || false;
    const textContent = tickets.get(`tickets.config.textContent`) || "Nenhum conteúdo definido.";
    const imageContent = tickets.get(`tickets.config.imageContent`);

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Selecione uma opção para abrir ticket')
        .addOptions(ticketOptions(ggg));

    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
    const components = [style2row];

    const channel2 = client.channels.cache.get(channel);
    const messageOptions = { components: components };

    
    if (modoContent) {
        messageOptions.content = textContent;
        messageOptions.embeds = [];
        if (imageContent && imageContent.startsWith('http')) {
            messageOptions.files = [imageContent];
        }
    } else {
        const embed = new EmbedBuilder()
            .setTitle(`${aparencia.title}`)
            .setDescription(`${aparencia.description}`)
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        if (aparencia.color !== undefined) embed.setColor(`${aparencia.color}`);
        if (aparencia.banner !== undefined) embed.setImage(`${aparencia.banner}`);
        
        messageOptions.embeds = [embed];
        messageOptions.content = null;
        messageOptions.files = [];
    }

    channel2.send(messageOptions).then(msg => {
        tickets.push(`tickets.messageid`, { msgid: msg.id, channelid: msg.channel.id, guildid: msg.guild.id });
    });
}

async function Checkarmensagensticket(client) {
    const ggg = tickets.get(`tickets.funcoes`);
    const aparencia = tickets.get(`tickets.aparencia`);
    const item = tickets.get(`tickets.messageid`);
    const modoContent = tickets.get(`tickets.config.modoContent`) || false;
    const textContent = tickets.get(`tickets.config.textContent`) || "Nenhum conteúdo definido.";
    const imageContent = tickets.get(`tickets.config.imageContent`);

    
    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('abrirticket')
        .setPlaceholder('Selecione uma opção para abrir ticket')
        .addOptions(ticketOptions(ggg));

    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
    const components = [style2row];

    for (const iterator in item) {
        const element = item[iterator];
        try {
            const guild = client.guilds.cache.get(element.guildid);
            const channel = await client.channels.cache.get(element.channelid);
            const msg = await channel.messages.fetch(element.msgid);

            const editOptions = { components: components };

            if (modoContent) {
                editOptions.content = textContent;
                editOptions.embeds = [];
                if (imageContent && imageContent.startsWith('http')) {
                    editOptions.files = [imageContent];
                } else {
                    editOptions.files = [];
                }
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`${aparencia.title}`)
                    .setDescription(`${aparencia.description}`)
                    .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
                    .setTimestamp();
                if (aparencia.color) embed.setColor(`${aparencia.color}`);
                if (aparencia.banner) embed.setImage(`${aparencia.banner}`);
                
                editOptions.content = null;
                editOptions.embeds = [embed];
                editOptions.files = [];
            }

            await msg.edit(editOptions);
        } catch (error) {
            
        }
    }
}

module.exports = {
    CreateMessageTicket,
    Checkarmensagensticket
};