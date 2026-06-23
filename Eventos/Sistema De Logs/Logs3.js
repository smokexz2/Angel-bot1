const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");

module.exports = {
    name: 'voiceStateUpdate',
    run: async (oldState, newState, client) => {
        
        if (oldState.channelId !== newState.channelId) {
            
            if (!oldState.channelId && newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#00FF00` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Usuário Entrou em Canal de Voz`, iconURL: `https://images-ext-1.discordapp.net/external/25b87wZBuGBvmPCSOd7vR24j8pLmGCXSGAZoOpP-SEw/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486897961762868.png?format=webp&quality=lossless` })
                    .setDescription(`O usuário ${newState.member} entrou no canal de voz ${newState.channel}`)
                    .setFooter({ text: newState.guild.name, iconURL: newState.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                const logChannelId = configuracao.get(`ConfigChannels.tráfego`);
                const logChannel = client.channels.cache.get(logChannelId);

                if (logChannel) {
                    logChannel.send({ embeds: [embed] }).catch(console.error);
                } else {

                }
            }
            
            else if (oldState.channelId && !newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#FF0000` : configuracao.get(`Cores.Erro`)}`)
                    .setAuthor({ name: `Usuário Saiu de Canal de Voz`, iconURL: `https://images-ext-1.discordapp.net/external/A233Ke-3pwKSoFcvbbr7W9gNgOxaoilMlfCs7ibPKFM/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1246683410882105405.png?format=webp&quality=lossless` })
                    .setDescription(`O usuário ${oldState.member} saiu do canal de voz ${oldState.channel}`)
                    .setFooter({ text: oldState.guild.name, iconURL: oldState.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                const logChannelId = configuracao.get(`ConfigChannels.tráfego`);
                const logChannel = client.channels.cache.get(logChannelId);

                if (logChannel) {
                    logChannel.send({ embeds: [embed] }).catch(console.error);
                } else {

                }
            }
            
            else if (oldState.channelId && newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor(`${configuracao.get(`Cores.Sucesso`) == null ? `#00FF00` : configuracao.get(`Cores.Sucesso`)}`) 
                    .setAuthor({ name: `Usuário Mudou de Canal de Voz`, iconURL: `https://images-ext-1.discordapp.net/external/25b87wZBuGBvmPCSOd7vR24j8pLmGCXSGAZoOpP-SEw/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486897961762868.png?format=webp&quality=lossless` })
                    .setDescription(`O usuário ${oldState.member} mudou do canal de voz ${oldState.channel} para o canal de voz ${newState.channel}`)
                    .setFooter({ text: oldState.guild.name, iconURL: oldState.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                const logChannelId = configuracao.get(`ConfigChannels.tráfego`);
                const logChannel = client.channels.cache.get(logChannelId);

                if (logChannel) {
                    logChannel.send({ embeds: [embed] }).catch(console.error);
                } else {

                }
            }
        }
    }
};