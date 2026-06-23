const { ChannelType, Permissions, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../database");
const automaticosPath = path.resolve(__dirname, '../../database/autolock.json');


function readAutomaticos() {
    if (fs.existsSync(automaticosPath)) {
        const rawData = fs.readFileSync(automaticosPath);
        return JSON.parse(rawData);
    }
    return {};
}


const convertToCronExpression = (time) => {
    const [hour, minute] = time.split(':');
    return `${minute} ${hour} * * *`;
};


function scheduleJobs(client, automaticos) {
    
    const existingJobs = schedule.scheduledJobs;
    for (const job in existingJobs) {
        existingJobs[job].cancel();
    }

    console.log("Agendando tarefas no horário de Brasília:", moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"));

    for (const guildId in automaticos) {
        const { abrir: lockTime, fechar: unlockTime, channels } = automaticos[guildId];

        channels.forEach(async (channelId) => {
            const lockTimeExpression = convertToCronExpression(lockTime);
            const unlockTimeExpression = convertToCronExpression(unlockTime);

            
            schedule.scheduleJob({ rule: lockTimeExpression, tz: 'America/Sao_Paulo' }, async () => {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                const channel = guild.channels.cache.get(channelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false
                    });

                    let messagesDeleted = 0;
                    let fetched;
                    do {
                        fetched = await channel.messages.fetch({ limit: 100 });
                        messagesDeleted += fetched.size;
                        await channel.bulkDelete(fetched);
                    } while (fetched.size >= 2);

                    const embed_delet = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setAuthor({ name: 'Limpeza Concluída', iconURL: 'https://media.discordapp.net/attachments/1249514076116353055/1250591781985321072/eu_tambem_tenho_7.png' })
                        .setDescription(`Total de \`${messagesDeleted}\` mensagens removidas.`);

                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setDescription("Este canal foi trancado automaticamente pelo sistema.")
                        .setFooter({ text: `Boa noite! Volte novamente às ${unlockTime}` })
                        .setTimestamp();

                    await channel.send({
                        embeds: [embed_delet, embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Mensagem Automática")
                                    .setCustomId("disabledButton")
                                    .setStyle("2")
                                    .setDisabled(true),
                            )
                        ]
                    });
                } catch (error) {
                    console.error("Erro ao bloquear canal:", error);
                }
            });

            
            schedule.scheduleJob({ rule: unlockTimeExpression, tz: 'America/Sao_Paulo' }, async () => {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                const channel = guild.channels.cache.get(channelId);
                if (!channel || channel.type !== ChannelType.GuildText) return;

                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: true
                    });

                    let messagesDeleted = 0;
                    await channel.messages.fetch().then(messages => {
                        messagesDeleted = messages.size;
                        channel.bulkDelete(messages);
                    });

                    const embed = new EmbedBuilder()
                        .setColor(configuracao.get(`Cores.Principal`) || '0cd4cc')
                        .setDescription("Este canal foi liberado automaticamente pelo sistema.")
                        .setFooter({ text: `Bom dia!` })
                        .setTimestamp();

                    await channel.send({
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setLabel("Mensagem Automática")
                                    .setCustomId("disabledButton")
                                    .setStyle("2")
                                    .setDisabled(true),
                            )
                        ]
                    });
                } catch (error) {
                    console.error("Erro ao desbloquear canal:", error);
                }
            });
        });
    }
}

module.exports = {
    name: "ready",
    run: async (client) => {
        let automaticos = readAutomaticos();
        scheduleJobs(client, automaticos);

        
        fs.watch(automaticosPath, (eventType, filename) => {
            if (eventType === 'change') {
                automaticos = readAutomaticos();
                scheduleJobs(client, automaticos);
            }
        });
    }
};