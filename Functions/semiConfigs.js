const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao } = require("../database");
const { res } = require("../res");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

async function semiConfigs(interaction, client) {
    const statusSemi = configuracao.get("pagamentos.SemiAutomatico.status");
    const chavePix = configuracao.get("pagamentos.SemiAutomatico.pix") || "Não configurado";
    const msgAuxilio = configuracao.get("pagamentos.SemiAutomatico.msg") || "Não configurado";

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel(`Voltar`)
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get(`pix_stamp_emoji`)} Configurar Pagamento Manual - ${statusSemi === false ? "Desabilitado" : "Habilitado"}**` },
        { type: 14 },
        { type: 10, content: `Aqui, você pode definir uma chave Pix e uma mensagem para o seu ${client.user.username} enviar quando a forma de pagamento "Pix" for selecionada. Ele irá gerar um QR Code com o valor exato do carrinho para essa chave.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get(`pix_stamp_emoji`)} **Chave PIX:** \`${chavePix}\`\n> ${Emojis.get(`cargovery`)} **Status:** \`${statusSemi === false ? "Desabilitado" : "Habilitado"}\`\n> ${Emojis.get(`_mail_emoji`)} **Mensagem De Auxílio:** \`${msgAuxilio}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Editar Configurações",
                    custom_id: "editConfigSemi",
                    emoji: { id: "1246953149009367173" }
                },
                {
                    type: 2,
                    style: statusSemi !== false ? 3 : 4,
                    label: statusSemi !== false ? "Habilitado" : "Desativado",
                    custom_id: "onOffSemi",
                    emoji: { id: "1246953228655132772" }
                }
            ]
        },
        { type: 14 },
        { type: 10, content: `-# Aviso: Manter esta função habilitada sobrescreverá a função automática do Mercado Pago e do Efi Bank.` }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = {
    semiConfigs
};