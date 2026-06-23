const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Emojis, configuracao } = require("../database");
const { res } = require("../res");

const dbPath = path.join(__dirname, "..", "database", "configauth02api.json");
const API_URL = "https://auth.ilusionsoluctions.com.br/"; 
const AUTH_TOKEN = "galaodamassa581";

async function auth02api(interaction) {
    let configLocal = {};
    let totalMembros = 0;

    if (fs.existsSync(dbPath)) {
        configLocal = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }

    const botID = configLocal.bot_id;
    const isVerificacaoAtiva = configuracao.get('Verificacaobrigatoria') === "true";

    if (botID) {
        try {
            const response = await axios.get(`${API_URL}/api/auth02/info/${botID}`, {
                headers: { 'Authorization': AUTH_TOKEN },
                timeout: 5000
            });
            if (response.data.sucesso) {
                totalMembros = response.data.membros;
            }
        } catch (err) {
            console.error("Erro ao buscar info na API:", err.message);
        }
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId("voltar00").setLabel('Voltar ao Menu Principal').setStyle(ButtonStyle.Secondary); const e = Emojis.get('_back_emoji'); if (e) b.setEmoji(e); return b; })()
    );

    const btnAddBot = new ButtonBuilder()
        .setLabel('Adicionar Bot')
        .setStyle(ButtonStyle.Link);

    if (botID) {
        btnAddBot.setURL(`https://discord.com/api/oauth2/authorize?client_id=${botID}&permissions=8&scope=bot%20applications.commands`);
    } else {
        btnAddBot.setURL('https://discord.com').setDisabled(true);
    }

    const rowLink = new ActionRowBuilder().addComponents(btnAddBot);

    const containerContent = res.main(
        { type: 10, content: `-# Painel > WINNBUXX Cloud` },
        { type: 14 },
        { type: 10, content: `**Gestão Auth02 Enterprise**\n\n> Gerencie sua infraestrutura OAuth2 e a retenção de membros em tempo real.` },
        { type: 14 },
        { type: 10, content: `**Informações do Sistema:**\n> **Bot Auth02:** ${botID ? `<@${botID}>` : `\`Nenhum bot vinculado\``}\n> **Verificados:** \`${totalMembros}\` usuários\n> **Status:** ${botID ? `\`🟢 Ativo\`` : `\`🔴 Pendente\``}\n> **Verificação Obrigatória:** ${isVerificacaoAtiva ? `\`✅ Habilitada\`` : `\`❌ Desabilitada\``}` },
        { type: 14 },
        { type: 10, content: `**URL da API:**\n> \`https://auth.ilusionsoluctions.com.br/auth02/verify\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Enviar Verificação",
                    emoji: Emojis.get('_lapis_emoji') ? { id: Emojis.get('_lapis_emoji').match(/\d+/)?.[0] } : { name: "📝" },
                    custom_id: "mensagem_auth02",
                    disabled: !botID
                },
                {
                    type: 2,
                    style: 2,
                    label: "Logs Webhook",
                    emoji: Emojis.get('_rigth_emoji') ? { id: Emojis.get('_rigth_emoji').match(/\d+/)?.[0] } : { name: "📋" },
                    custom_id: "logauth"
                },
                {
                    type: 2,
                    style: 3,
                    label: "Recuperar Membros",
                    emoji: Emojis.get('_change_emoji') ? { id: Emojis.get('_change_emoji').match(/\d+/)?.[0] } : { name: "🔄" },
                    custom_id: "recuperarmembroauth",
                    disabled: !botID
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Configurar Bot",
                    emoji: Emojis.get('_settings_emoji') ? { id: Emojis.get('_settings_emoji').match(/\d+/)?.[0] } : { name: "⚙️" },
                    custom_id: "setAuth02Keys"
                },
                {
                    type: 2,
                    style: isVerificacaoAtiva ? 4 : 3,
                    label: isVerificacaoAtiva ? "Desativar Verificação" : "Ativar Verificação",
                    emoji: { id: "1454551431918129214" },
                    custom_id: "configurar_venda_membro",
                    disabled: !botID
                }
            ]
        }
    ).with({
        components: [rowLink, rowVoltar],
        flags: [64]
    });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

module.exports = { auth02api };