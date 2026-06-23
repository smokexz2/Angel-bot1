const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { configuracao, produtos, Emojis } = require("../../database");
const { agendarRepostagem } = require("../../Functions/repostagem");
const { res } = require("../../res");
const moment = require('moment-timezone');

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        if (interaction.isButton()) {
            if (interaction.customId === 'setTimeRepost') {
                const modal = new ModalBuilder()
                    .setCustomId('timeRepostModal')
                    .setTitle('Definir Horário de Repostagem');

                const timeInput = new TextInputBuilder()
                    .setCustomId('timeInput')
                    .setLabel('Horário (HH:MM)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 14:30')
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(timeInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'timeRepostModal') {
                const timeInput = interaction.fields.getTextInputValue(`timeInput`);
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

                if (!timeRegex.test(timeInput)) {
                    await interaction.reply({
                        content: `${Emojis.get(`negative`)} | Formato de horário inválido. Use o formato HH:MM.`,
                        flags: 64
                    });
                    return;
                }

                configuracao.set(`Repostagem.Hora`, timeInput);

                agendarRepostagem(client);

                try {
                    const containerContent = await criarContainerRepostagem(interaction, client);
                    await interaction.update(containerContent);
                } catch (error) {
                    console.error(`Erro ao atualizar a mensagem:`, error);
                    await interaction.reply({
                        content: `${Emojis.get(`checker`)} | Horário de repostagem atualizado para ${timeInput}.`,
                        flags: 64
                    });
                }
            }
        }
    }
};

async function criarContainerRepostagem(interaction, client) {
    const repostagemHora = configuracao.get(`Repostagem.Hora`) || "00:01";
    const currentStatus = configuracao.get(`Repostagem.Status`);
    const currentTime = moment.tz("America/Sao_Paulo");

    const [hours, minutes] = repostagemHora.split(':').map(Number);
    let nextExecutionTime = moment.tz("America/Sao_Paulo").set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    if (nextExecutionTime.isBefore(currentTime)) {
        nextExecutionTime.add(1, 'day');
    }

    const nextExecutionTimestamp = Math.floor(nextExecutionTime.valueOf() / 1000);
    const todosProdutos = await produtos.all();

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltarautomaticos')
            .setLabel(`Voltar`)
            .setEmoji(Emojis.get(`_back_emoji`) || '🔙')
            .setStyle(ButtonStyle.Secondary)
    );

    return res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > Repostagem Automática` },
        { type: 14 },
        { type: 10, content: `### ${Emojis.get(`repost_emoji`)} Repostagem Automática de Produtos` },
        { type: 10, content: `> Seu ${client.user.username} vai repostar seus produtos periodicamente, apagando a mensagem antiga e enviando-a novamente, para evitar denúncias nas mensagens.\n\n> **Observação:** O sistema ajustará automaticamente o intervalo e a frequência dos reposts, considerando o fluxo de interações e a quantidade de produtos postados.` },
        { type: 14 },
        { type: 10, content: `**Configurações Atuais:**\n> **Produtos em repostagem:** \`${todosProdutos.length}\`\n> **Status:** ${currentStatus ? `${Emojis.get(`ligado`)} \`Ativado\`` : `${Emojis.get(`desligado`)} \`Desativado\``}\n> **Horário configurado:** \`${repostagemHora}\`\n> **Próxima execução:** ${currentStatus ? `\`${nextExecutionTime.format(`DD/MM/YYYY HH:mm:ss`)}\`` : `\`Desativado\``}\n> **Tempo restante:** ${currentStatus ? `<t:${nextExecutionTimestamp}:R>` : `\`Desativado\``}` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: currentStatus ? 4 : 3,
                    label: currentStatus ? "Desabilitar função" : "Habilitar função",
                    emoji: { id: Emojis.get('_settings_emoji')?.match(/:(\d+)>/)?.[1] || "1259569896472182784" },
                    custom_id: currentStatus ? "desabilityRepost" : "enableRepost"
                },
                {
                    type: 2,
                    style: 2,
                    label: "Definir horário",
                    emoji: { id: Emojis.get('relogio')?.match(/:(\d+)>/)?.[1] || "1241819612044197949" },
                    custom_id: "setTimeRepost",
                    disabled: !currentStatus
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });
}