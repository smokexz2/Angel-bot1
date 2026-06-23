const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { res } = require("../res");
const { sorteios } = require("../database");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function getEstatisticas() {
    const allSorteios = sorteios.valueArray() || [];
    const ativos = allSorteios.filter(s => s.status === "ativo").length;
    const realizados = allSorteios.filter(s => s.status === "finalizado").length;
    const participacoes = allSorteios.reduce((acc, s) => acc + (s.participantes?.length || 0), 0);
    
    return { ativos, realizados, participacoes };
}

async function PainelSorteios(interaction, client) {
    const stats = getEstatisticas();

    const rowBotoes = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("criar_sorteio")
                .setLabel('Realizar sorteio')
                .setEmoji("<:presentes:1456162063255601162>")
                .setStyle(3),

            new ButtonBuilder()
                .setCustomId("gerenciar_sorteios")
                .setLabel(`Gerenciar sorteios`)
                .setEmoji(Emojis.get(`_settings_emoji`) || '⚙️')
                .setStyle(2)
        );

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar00")
                .setLabel(`Voltar`)
                .setEmoji(Emojis.get(`_back_emoji`) || '🔙')
                .setStyle(2)
        );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Sorteios` },
        { type: 14 },
        {
            type: 17,
            accessory: {
                type: 4,
                media: { url: client.user.displayAvatarURL({ dynamic: true }) }
            },
            fields: [
                { type: 10, content: `### ${Emojis.get(`_star_emoji`)} Giveaway` },
                { type: 10, content: `Gerencie todos os sorteios do seu servidor de forma intuitiva.` }
            ]
        },
        { type: 14 },
        { type: 10, content: `**Sorteios ativos**\n${Emojis.get(`ligado`)} \`${stats.ativos}x Ativos\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 10,
                    content: `**Sorteios realizados**\n${Emojis.get(`_star_emoji`)} \`${stats.realizados}x Realizados\``
                },
                {
                    type: 10,
                    content: `**Participações totais**\n${Emojis.get(`_people_emoji`)} \`${stats.participacoes}x Usuários\``
                }
            ]
        },
        { type: 14 },
        { type: 10, content: `-# teste • hoje às ${new Date().toLocaleTimeString(`pt-BR`, { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` }
    ).with({
        components: [rowBotoes, rowVoltar],
        flags: [64]
    });

    if (interaction.message == undefined) {
        interaction.reply(containerContent);
    } else {
        interaction.update(containerContent);
    }
}

module.exports = {
    PainelSorteios
};