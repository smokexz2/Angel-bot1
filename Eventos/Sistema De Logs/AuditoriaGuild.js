const { EmbedBuilder } = require("discord.js");
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: `guildUpdate`,
    run: async (oldGuild, newGuild, client) => {
        const logChannelId = configuracao.get(`ConfigChannels.auditoria`);
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let changes = [];
        if (oldGuild.name !== newGuild.name) {
            changes.push(`> **Nome:** \`${oldGuild.name}\` → \`${newGuild.name}\``);
        }
        if (oldGuild.iconURL() !== newGuild.iconURL()) {
            changes.push(`> **Ícone:** Alterado`);
        }
        if (oldGuild.bannerURL() !== newGuild.bannerURL()) {
            changes.push(`> **Banner:** Alterado`);
        }
        if (oldGuild.description !== newGuild.description) {
            changes.push(`> **Descrição:** \`${oldGuild.description || `Nenhuma`}\` → \`${newGuild.description || `Nenhuma`}\``);
        }
        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
            changes.push(`> **URL Personalizada:** \`${oldGuild.vanityURLCode || `Nenhuma`}\` → \`${newGuild.vanityURLCode || `Nenhuma`}\``);
        }
        if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
            changes.push(`> **Nível de Verificação:** \`${oldGuild.verificationLevel}\` → \`${newGuild.verificationLevel}\``);
        }

        if (changes.length === 0) return;

        const containerContent = res.main(
            { type: 10, content: `**Servidor Atualizado**` },
            { type: 14 },
            { type: 10, content: `> **Servidor:** ${newGuild.name}\n\n${changes.join(`\n`)}` }
        ).with({});

        logChannel.send(containerContent);
    }
};