const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../../database");

module.exports = {
    name: 'guildMemberRemove',
    run: async (member, client) => {

        try {
            const testando = configuracao.get(`ConfigChannels.saídas`);
            const canal_logs = member.guild.channels.cache.get(testando);
            if (!canal_logs) return 
            
            const nomeUsuario = member.user.username;

            let embed = new EmbedBuilder()
                .setColor(`${configuracao.get(`Cores.Erro`) == null ? `#FF0000` : configuracao.get(`Cores.Erro`)}`)
                .setAuthor({ name: `Saida`, iconURL: `https://images-ext-1.discordapp.net/external/IdSW4LSsW6a7fc205f8TO88wMetM3BuOhnnUN8Q-pyQ/%3Fsize%3D2048/https/cdn.discordapp.com/emojis/1249486921084698727.png?format=webp&quality=lossless` })
                .setDescription(`${member} **${nomeUsuario}** saiu do servidor.`)
                .setFooter(
                    { text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) }
                  )
                .setTimestamp();

            canal_logs.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro:', error);
        }
    }
}