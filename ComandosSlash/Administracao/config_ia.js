const { ApplicationCommandType } = require("discord.js");
const { painelIA } = require("../../Functions/SistemaIA");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "config-ia",
    description: "[👑 | Admin] Configure o sistema de IA (ChatGPT) do servidor",
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `❌ | Você não possui permissão para usar esse comando.`, flags: 64 });
        }

        
        const containerContent = await getPainelIAContent(interaction);
        await interaction.reply(containerContent);
    }
};

async function getPainelIAContent(interaction) {
    const { JsonDatabase } = require("../../database/jsondb");
    const { res } = require("../../res");
    const { ButtonBuilder, ActionRowBuilder } = require("discord.js");
    const emojisDb = require("../../database/emojis.json");
    const Emojis = { get: (name) => emojisDb[name] || "" };

    const iaConfig = new JsonDatabase({ databasePath: "./database/iaConfig.json" });
    const canalIA = iaConfig.get('canal');
    const status = iaConfig.get('status') || false;
    const temApiKey = !!iaConfig.get(`openai_key`);

    return res.main(
        { type: 10, content: `-# Painel > Sistema de IA (ChatGPT)` },
        { type: 14 },
        { type: 10, content: `**Sistema de Inteligência Artificial**\nConfigure um canal onde a IA responderá automaticamente as mensagens dos usuários.` },
        { type: 14 },
        { type: 10, content: `**Status:** ${status ? `${Emojis.get(`checker`) || `✅`} Ativo` : `${Emojis.get(`negative`) || `❌`} Inativo`}\n**Canal:** ${canalIA ? `<#${canalIA}>` : 'Não configurado'}\n**API Key:** ${temApiKey ? `${Emojis.get(`checker`) || `✅`} Configurada` : `${Emojis.get(`negative`) || '❌'} Não configurada`}` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "ia_status_select",
                placeholder: "Ativar/Desativar sistema de IA",
                options: [
                    { label: "Ativar IA", value: "ativar_ia", emoji: { id: "1387981762050920548" } },
                    { label: "Desativar IA", value: "desativar_ia", emoji: { id: "1387981760649756782" } }
                ]
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Canal", custom_id: "ia_config_canal", emoji: { id: "1178086608004722689" } },
                { type: 2, style: 2, label: "Definir API Key", custom_id: "ia_config_apikey", emoji: { id: "1178080366871973958" } },
                { type: 2, style: 2, label: "Personalizar Prompt", custom_id: "ia_config_prompt", emoji: { id: "1178077123882262628" } }
            ]
        }
    ).with({ flags: [64] });
}