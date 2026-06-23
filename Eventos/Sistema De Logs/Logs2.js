const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");

module.exports = {
    name: 'messageUpdate',
    run: async (oldMessage, newMessage, client) => {
        try {
            
            if (!oldMessage.guild) return;
            if (!oldMessage.author || oldMessage.author.bot) return;
            if (oldMessage.content === newMessage.content) return;

            const truncate = (s, n) => (s && s.length > n) ? s.slice(0, n - 3) + '...' : (s || 'N/A');

            const embed = new EmbedBuilder()
                .setColor(`#FFA500`)
                .setAuthor({ name: `Mensagem Editada`, iconURL: `https://media.discordapp.net/attachments/1223385767816986754/1250237861379440640/eu_tambem_tenho_24.png?ex=666a363e&is=6668e4be&hm=059c8660b7e0fda863bd2f8a42915292455d6ed10b084d798b4b37300b88676c&=&format=webp&quality=lossless` })
                .setDescription(`O usuário ${oldMessage.author} acabou de editar uma mensagem`)
                .addFields(
                    { name: `**Autor**`, value: truncate(`${oldMessage.author} \`(${oldMessage.author.id})\``, 1024), inline: true },
                    { name: `**Canal**`, value: truncate(`${oldMessage.channel}`, 1024), inline: true },
                    { name: `**Mensagem Antiga**`, value: truncate(oldMessage.content || 'N/A', 1024), inline: false },
                    { name: `**Mensagem Nova**`, value: truncate(newMessage.content || 'N/A', 1024), inline: false },
                )
                .setFooter({ text: oldMessage.guild.name, iconURL: oldMessage.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const logChannelId = configuracao.get(`ConfigChannels.mensagens`);
            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (e) {}
    }
};