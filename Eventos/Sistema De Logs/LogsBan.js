const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: 'guildBanAdd',
    run: async (ban, client) => {
        const logChannelId = configuracao.get(`ConfigChannels.logsban`);
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let reason = ban.reason || 'Motivo não informado';

        const containerContent = res.main(
            { type: 10, content: `**Usuário Banido**` },
            { type: 14 },
            { type: 10, content: `> **Usuário:** ${ban.user.tag}\n> **ID:** \`${ban.user.id}\`\n> **Motivo:** ${reason}` }
        ).with({});

        logChannel.send(containerContent);
    }
};