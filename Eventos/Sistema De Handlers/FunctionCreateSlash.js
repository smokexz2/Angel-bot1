const client = require("../../index");
const Discord = require("discord.js")
const { configuracao } = require("../../database");
const { res } = require("../../res");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isChatInputCommand()) {

            const cmd = client.slashCommands.get(interaction.commandName);

            if (!cmd) return interaction.reply(`Ocorreu algum erro amigo.`);

            interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

            
            try {
                const logChannelId = configuracao.get(`ConfigChannels.logscomandos`);
                const logChannel = client.channels.cache.get(logChannelId);
                if (logChannel) {
                    const containerContent = res.main(
                        { type: 10, content: `**Comando Utilizado**` },
                        { type: 14 },
                        { type: 10, content: `> **Usuário:** ${interaction.user}\n> **Comando:** \`/${interaction.commandName}\`\n> **Canal:** ${interaction.channel}` }
                    ).with({});

                    logChannel.send({ content: `Usuário <@${interaction.user.id}> utilizou o comando \`/${interaction.commandName}\``, ...containerContent });
                }
            } catch (error) {}

            try {
                await cmd.run(client, interaction);
            } catch (error) {
                console.error(`[SlashCommand] Erro ao executar /${interaction.commandName}:`, error);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: `❌ | Ocorreu um erro ao executar este comando.`, flags: 64 });
                    } else {
                        await interaction.reply({ content: `❌ | Ocorreu um erro ao executar este comando.`, flags: 64 });
                    }
                } catch (e) {
                    console.error('[SlashCommand] Falha ao notificar usuário sobre o erro:', e);
                }
            }

        }

        if (interaction.isMessageContextMenuCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) command.run(client, interaction);
        }

        if (interaction.isUserContextMenuCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) command.run(client, interaction);
        }
    }
}