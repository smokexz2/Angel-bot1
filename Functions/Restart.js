const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { configuracao, Emojis } = require('../database');

async function restart(client) {

    if (configuracao.get('ConfigChannels.systemlogs') == null) return;

    const cor = parseInt((configuracao.get(`Cores.Principal`) || '2f3136').replace('#', ``), 16);

    const container = new ContainerBuilder()
        .setAccentColor(cor)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${Emojis.get(`butts`)} **Sistema Reiniciado**`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Seu bot foi reiniciado com sucesso e já está operando normalmente.`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${Emojis.get(`permissions_emoji`)} **Versão:** \`3.9.8\`\n${Emojis.get(`time_emoji`)} **Data:** <t:${Math.ceil(Date.now() / 1000)}:R>`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        )
        .addActionRowComponents(row =>
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Reiniciado com Sucesso!')
                    .setCustomId("restart_success")
                    .setStyle(2)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setLabel('Servidor de Suporte')
                    .setURL('https://discord.gg/SmkshsgUEr')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('Dashboard')
                    .setURL('https://ilusionsoluctions.com.br/dashboard')
                    .setStyle(ButtonStyle.Link)
            )
        );

    try {
        const channel = await client.channels.fetch(configuracao.get('ConfigChannels.systemlogs'));
        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    } catch (error) { }
}

module.exports = {
    restart
}