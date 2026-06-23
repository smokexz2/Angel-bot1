const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: `channelDelete`,
    run: async (channel, client) => {
        if (!channel.guild) return;

        const logChannelId = configuracao.get(`ConfigChannels.auditoria`);
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const containerContent = res.main(
            { type: 10, content: `**Canal Deletado**` },
            { type: 14 },
            { type: 10, content: `> **Nome:** \`${channel.name}\`\n> **ID:** \`${channel.id}\`\n> **Tipo:** \`${channel.type}\`\n> **Categoria:** ${channel.parent ? channel.parent.name : `Nenhuma`}` }
        ).with({});

        logChannel.send(containerContent);
    }
};