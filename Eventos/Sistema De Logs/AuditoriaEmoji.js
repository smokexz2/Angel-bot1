const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: `emojiCreate`,
    run: async (emoji, client) => {
        const logChannelId = configuracao.get(`ConfigChannels.auditoria`);
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const containerContent = res.main(
            { type: 10, content: `**Emoji Adicionado**` },
            { type: 14 },
            { type: 10, content: `> **Emoji:** ${emoji}\n> **Nome:** \`${emoji.name}\`\n> **ID:** \`${emoji.id}\`\n> **Animado:** \`${emoji.animated ? `Sim` : 'Não'}\`` }
        ).with({});

        logChannel.send(containerContent);
    }
};