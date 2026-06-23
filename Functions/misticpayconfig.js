const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { configuracao, Emojis } = require("../database");
const { res } = require("../res");
const axios = require("axios");

async function misticConfigs(interaction) {
    const clientId = configuracao.get(`pagamentos.mistclientid`) || "";
    const clientSecret = configuracao.get(`pagamentos.misticsecret`) || "";
    const status = configuracao.get(`pagamentos.MisticSystem`) ?? false;
    
    let saldoDisplay = "❌ Credenciais não configuradas";
    let credenciaisStatus = "❌ As credenciais não foram configuradas ainda.";

    const maskKey = (key) => {
        if (!key || key.length < 5) return "Não definido";
        return `${key.substring(0, 4)}********`;
    };

    if (clientId !== "" && clientSecret !== "") {
        credenciaisStatus = "✅ Todas as credenciais estão configuradas perfeitamente!";
        
        try {
            const response = await axios.get('https://api.misticpay.com/api/users/balance', {
                headers: { 
                    'ci': clientId,
                    'cs': clientSecret 
                }
            });

            const saldo = response.data.data?.balance || 0;
            saldoDisplay = `R$ ${Number(saldo).toLocaleString(`pt-BR`, { minimumFractionDigits: 2 })}`;
        } catch (error) {
            console.error("Erro Mistic Pay:", error.response?.data || error.message);
            saldoDisplay = "⚠️ Erro (Verifique as chaves)";
            credenciaisStatus = "⚠️ Erro de Autenticação na API";
        }
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("formasdepagamentos")
            .setLabel(`Voltar ao Menu`)
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get(`mistic`)} Configurar Mistic Pay**` },
        { type: 14 },
        { type: 10, content: `Bem-vindo à Central de Controle Mistic Pay. Através deste painel, você tem total autonomia sobre a integração financeira do seu sistema, monitore o saldo disponível em tempo real e realize saques instantâneos.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get(`credencias`)} **Client ID:** \`${maskKey(clientId)}\`\n> ${Emojis.get(`credencias`)} **Client Secret:** \`${maskKey(clientSecret)}\`\n> ${Emojis.get(`carteirasaque`)} **Saldo na Carteira:** \`${saldoDisplay}\`\n> ${Emojis.get(`_fixe_emoji`)} **Status Gateway:** \`${status ? "Habilitado" : "Desativado"}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Configurar Credenciais",
                    custom_id: "setMisticCreds",
                    emoji: Emojis.get('_lapis_emoji') ? { id: Emojis.get('_lapis_emoji').match(/\d+/)?.[0] } : { name: "✏️" }
                },
                {
                    type: 2,
                    style: status ? 4 : 3,
                    label: status ? "Desativar Gateway" : "Ativar Gateway",
                    custom_id: "toggleMisticStatus",
                    emoji: { id: "1246953228655132772" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Sacar Saldo",
                    custom_id: "requestMisticWithdraw",
                    emoji: Emojis.get('carteirasaque') ? { id: Emojis.get('carteirasaque').match(/\d+/)?.[0] } : { name: "💰" }
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = { misticConfigs };