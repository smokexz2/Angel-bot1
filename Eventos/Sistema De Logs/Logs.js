const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");

module.exports = {
    name: 'messageDelete',
    run: async (message, client) => {
        try {
            if (!message.guild) return;
            if (!message.author || message.author.bot) return;

            const truncate = (s, n) => (s && s.length > n) ? s.slice(0, n - 3) + '...' : (s || `N/A`);

            const embed = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Erro`) ?? '#FF0000'}`)
                .setAuthor({ name: `Mensagem Deletada`, iconURL: `https://media.discordapp.net/attachments/1223385767816986754/1250235239499038740/eu_tambem_tenho_25.png?ex=666a33cd&is=6668e24d&hm=665c5dc1a780f607f0c590b233cd794e650fb7803a6477d14c59f5b3b0fe7c6b&=&format=webp&quality=lossless` })
                .setDescription(`O usuário ${message.author} acabou de deletar uma mensagem`)
                .addFields(
                    { name: `**Autor**`, value: truncate(`${message.author} \`(${message.author.id})\``, 1024) },
                    { name: `**Canal**`, value: truncate(`${message.channel}`, 1024) },
                    { name: `**Mensagem**`, value: truncate(message.content || 'N/A', 1024) },
                )
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const logChannelId = configuracao.get(`ConfigChannels.mensagens`);
            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (e) {}
    }
};