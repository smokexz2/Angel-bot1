const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { configuracao } = require("../database");
const { res } = require("../res");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

function getEmojiObject(emojiStr) {
    if (!emojiStr || emojiStr === "") return { name: "💳" };
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return { name: emojiStr };
}

async function FormasDePagamentos(interaction) {

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("formas_pagamento_menu")
        .setPlaceholder("Selecione uma forma de pagamento")
        .addOptions([
            {
                label: "Configurar Mercado Pago",
                description: "Configure sua integração com Mercado Pago",
                value: "configurarmercadopago",
                emoji: getEmojiObject(Emojis.get('_mp_emoji'))
            },
            {
                label: "Configurar Efi Bank",
                description: "Configure sua integração com Efi Bank",
                value: "config_pagamentos_efibank",
                emoji: { id: "1306786969652564091" }
            },
            {
                label: "Configurar Bancos IMAPS",
                description: "Configure integração via IMAP",
                value: "config_pagamentos_inter",
                emoji: getEmojiObject(Emojis.get('banco'))
            },
            {
                label: "Configurar Pix (Semi Auto)",
                description: "Configure pagamento semi-automático",
                value: "ConfigurarPagamentoManual",
                emoji: { id: "1193427093158105129" }
            },
            {
                label: "Configurar Mistic Pay",
                description: "Configure sua integração com Mistic Pay",
                value: "configurarmistic",
                emoji: getEmojiObject(Emojis.get('mistic'))
            }
        ]);

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltaradawdwa")
                .setLabel('Voltar')
                .setEmoji(`1178068047202893869`)
                .setStyle(2)
        )

    const containerContent = res.main(
        { type: 10, content: `**WINNBUXX - Formas de Pagamentos**` },
        { type: 14 },
        { type: 10, content: `> Gerencie suas formas de pagamentos de uma maneira simples e eficiente, ajuste as opções conforme necessário para atender as necessidades de seus clientes` },
        { type: 14 },
        {
            type: 1,
            components: [selectMenu.toJSON()]
        }
    ).with({
        components: [row3],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.update(containerContent);
        else await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.editReply(containerContent); } catch {}
    }
}

module.exports = {
    FormasDePagamentos
}