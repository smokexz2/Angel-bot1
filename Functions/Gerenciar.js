const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { res } = require("../res");

async function Gerenciar(interaction, client) {

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar1")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        )

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Configurações` },
        { type: 14 },
        { type: 10, content: `**O que precisa configurar?**\n> Selecione uma das opções abaixo para configurar.` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Cargos",
                    custom_id: "configcargos",
                    emoji: { id: "1178086257784533092" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Canais",
                    custom_id: "personalizarcanais",
                    emoji: { id: "1178086457169170454" }
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Anti-Fake",
                    custom_id: "personalizarantifake",
                    emoji: { id: "1346211926056763443" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Formas de pagamento",
                    custom_id: "formasdepagamentos",
                    emoji: { id: "1345629571642294272" }
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent)
    } else {
        interaction.update(containerContent)
    }
}

module.exports = {
    Gerenciar
}