const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../database");
const { res } = require("../res");

function msgbemvindo(interaction, client) {
    const canaisConfig = configuracao.get("Entradas.canaisConfig") || [];

    
    const legacyMsg = configuracao.get("Entradas.msg");
    const legacyCanais = configuracao.get("Entradas.channelid") || [];
    const legacyTempo = configuracao.get("Entradas.tempo") || 0;

    let textoCanais = "*Nenhum canal configurado*";

    if (canaisConfig.length > 0) {
        textoCanais = canaisConfig.map(c => {
            const ch = interaction.guild.channels.cache.get(c.id);
            const nomeCh = ch ? `<#${c.id}>` : `\`${c.id}\``;
            const tempo = c.tempo > 0 ? `apagar em ${c.tempo}s` : `nunca apagar`;
            const msgPreview = c.msg ? c.msg.substring(0, 40) + (c.msg.length > 40 ? '...' : '') : 'sem mensagem';
            return `> ${nomeCh} — ${tempo}\n> -# Msg: \`${msgPreview}\``;
        }).join('\n');
    } else if (Array.isArray(legacyCanais) && legacyCanais.length > 0) {
        textoCanais = legacyCanais.map(id => {
            const ch = interaction.guild.channels.cache.get(id);
            return ch ? `<#${id}>` : `\`${id}\``;
        }).join(`, `);
        if (legacyMsg) {
            textoCanais += `\n> -# Msg legada: \`${legacyMsg.substring(0, 50)}${legacyMsg.length > 50 ? `...` : ``}\``;
        }
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar1")
            .setLabel("Voltar")
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Boas Vindas` },
        { type: 14 },
        { type: 10, content: `**Sistema de Boas-Vindas por Canal**\nConfigure mensagens automáticas para novos membros. Cada canal pode ter uma **mensagem e tempo de exclusão diferentes**.` },
        { type: 14 },
        { type: 10, content: `**Canais Configurados (${canaisConfig.length}):**\n${textoCanais}` },
        { type: 14 },
        { type: 10, content: `**Variáveis Disponíveis:**\n> \`{member}\` — Menciona o usuário\n> \`{guildname}\` — Nome do servidor` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: "Adicionar Canal", emoji: { id: "1178067873894236311" }, custom_id: "bv_adicionar_canal" },
                { type: 2, style: 4, label: "Remover Canal", emoji: { id: "1178076767567757312" }, custom_id: "bv_remover_canal" }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        return interaction.editReply(containerContent);
    }
    return interaction.update(containerContent);
}

module.exports = {
    msgbemvindo,
};