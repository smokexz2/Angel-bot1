const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { configuracao, Emojis } = require("../database");
const { res } = require("../res");

async function imapConfigs(interaction) {
    const user = configuracao.get(`pagamentos.imap.user`) || "Não configurado";
    const status = configuracao.get(`pagamentos.imap.status`) ?? false;
    const banco = configuracao.get(`pagamentos.imap.banco_atual`) || "nubank";
    const chavePix = configuracao.get(`pagamentos.imap.chavepiximap`) || "Não configurada";

    const bancoEmojis = {
        nubank: "💜 Nubank",
        inter: "🧡 Banco Inter",
        picpay: "💚 PicPay"
    };

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel(`Voltar`)
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get(`banco`)} Monitoramento via IMAP (E-mail)**` },
        { type: 14 },
        { type: 10, content: `Configure o bot para ler notificações de Pix do seu e-mail.\n\n**Como funciona:** O bot fica lendo sua caixa de entrada e aprova a venda assim que o e-mail do banco chegar.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get(`email`)} **E-mail:** \`${user}\`\n> ${Emojis.get(`banco`)} **Banco Ativo:** \`${bancoEmojis[banco]}\`\n> ${Emojis.get(`_fixe_emoji`)} **Status:** \`${status ? "Sistema Ativo!" : "Sistema Desativado"}\`\n> ${Emojis.get(`pix`)} **Chave Pix:** \`${chavePix}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Editar Credenciais",
                    custom_id: "setImapCreds",
                    emoji: Emojis.get('_lapis_emoji') ? { id: Emojis.get('_lapis_emoji').match(/\d+/)?.[0] } : { name: "✏️" }
                },
                {
                    type: 2,
                    style: status ? 4 : 3,
                    label: status ? "Desativar IMAP" : "Ativar IMAP",
                    custom_id: "toggleImapStatus",
                    emoji: Emojis.get('_change_emoji') ? { id: Emojis.get('_change_emoji').match(/\d+/)?.[0] } : { name: "🔄" }
                }
            ]
        },
        { type: 14 },
        { type: 10, content: `-# Use 'Senhas de App' se usar Gmail ou Outlook!` }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = { imapConfigs };