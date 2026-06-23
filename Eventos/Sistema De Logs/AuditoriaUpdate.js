const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: `channelUpdate`,
    run: async (oldChannel, newChannel, client) => {
        if (!oldChannel.guild) return;

        const logChannelId = configuracao.get(`ConfigChannels.auditoria`);
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let changes = [];
        if (oldChannel.name !== newChannel.name) {
            changes.push(`> **Nome:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
        }
        if (oldChannel.topic !== newChannel.topic) {
            changes.push(`> **Tópico:** \`${oldChannel.topic || `Nenhum`}\` → \`${newChannel.topic || `Nenhum`}\``);
        }
        if (oldChannel.parentId !== newChannel.parentId) {
            changes.push(`> **Categoria:** ${oldChannel.parent?.name || `Nenhuma`} → ${newChannel.parent?.name || `Nenhuma`}`);
        }
        if (oldChannel.nsfw !== newChannel.nsfw) {
            changes.push(`> **NSFW:** \`${oldChannel.nsfw}\` → \`${newChannel.nsfw}\``);
        }

        if (changes.length === 0) return;

        const containerContent = res.main(
            { type: 10, content: `**Canal Editado**` },
            { type: 14 },
            { type: 10, content: `> **Canal:** ${newChannel}\n> **ID:** \`${newChannel.id}\`\n\n${changes.join(`\n`)}` }
        ).with({});

        logChannel.send(containerContent);
    }
};