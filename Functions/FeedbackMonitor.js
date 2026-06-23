const { EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder } = require("discord.js");
const { JsonDatabase } = require("../database/jsondb");
const { res } = require("../res");
const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

const feedbackConfig = new JsonDatabase({ databasePath: "./database/feedbackConfig.json" });

let openaiClient = null;

function getOpenAIClient() {
    if (openaiClient) return openaiClient;
    try {
        const iaConfig = new JsonDatabase({ databasePath: "./database/iaConfig.json" });
        const { OpenAI } = require("openai");
        const apiKey = iaConfig.get('openai_key');
        if (!apiKey) return null;
        const options = { apiKey };
        if (apiKey.startsWith('gsk_')) {
            options.baseURL = 'https://api.groq.com/openai/v1';
        }
        openaiClient = new OpenAI(options);
        return openaiClient;
    } catch (e) {
        return null;
    }
}


async function painelFeedbackMonitor(interaction) {
    const config = feedbackConfig.get('config') || {};
    const status = config.status || false;
    const canais = config.canais || [];
    const emoji = config.emoji || Emojis.get('checker') || '';
    const canalLogs = config.canalLogs;

    const _fbBackEmoji = Emojis.get('_back_emoji');
    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId("voltar00").setLabel('Voltar').setStyle(2); if (_fbBackEmoji) b.setEmoji(_fbBackEmoji); return b; })()
    );

    const canaisTexto = canais.length > 0 ? canais.map(id => `<#${id}>`).join(`, `) : 'Nenhum configurado';

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Monitorador de Feedbacks` },
        { type: 14 },
        { type: 10, content: `**Monitorador de Feedbacks com IA**\nA IA analisa automaticamente as mensagens nos canais configurados, reage com o emoji definido e registra um log detalhado.` },
        { type: 14 },
        { type: 10, content: `**Status:** ${status ? `${Emojis.get('checker') ||''} Ativo` : `${Emojis.get('negative') ||''} Inativo`}\n**Canais Monitorados:** ${canaisTexto}\n**Emoji de Reação:** ${emoji}\n**Canal de Logs:** ${canalLogs ? `<#${canalLogs}>` : 'Não configurado'}` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "feedback_status_select",
                placeholder: "Ativar/Desativar sistema",
                options: [
                    { label: "Ativar Sistema", value: "ativar_feedback", emoji: { id: "1387981762050920548" } },
                    { label: "Desativar Sistema", value: "desativar_feedback", emoji: { id: "1387981760649756782" } }
                ]
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Adicionar Canal", custom_id: "feedback_add_canal", emoji: { id: "1178086608004722689" } },
                { type: 2, style: 4, label: "Remover Canal", custom_id: "feedback_remove_canal", emoji: { id: "1178076767567757312" } },
                { type: 2, style: 2, label: "Configurar Emoji", custom_id: "feedback_config_emoji", emoji: { id: "1178077123882262628" } }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Canal de Logs", custom_id: "feedback_config_logs", emoji: { id: "1178066208835252266" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.followUp({ content: `${Emojis.get('negative')||''} Erro ao abrir monitor de feedbacks.`, flags: 64 }); } catch {}
    }
}


async function processarFeedback(message, client) {
    const config = feedbackConfig.get('config') || {};
    if (!config.status) return;

    const canais = config.canais || [];
    if (!canais.includes(message.channel.id)) return;
    if (message.author.bot) return;

    const emoji = config.emoji || Emojis.get('checker') || '';
    const canalLogsId = config.canalLogs;

    
    try {
        if (/^\d{10,}$/.test(emoji)) {
            const emojiObj = message.guild.emojis.cache.get(emoji);
            if (emojiObj) await message.react(emojiObj);
            else await message.react(Emojis.get('checker') || '');
        } else {
            await message.react(emoji);
        }
    } catch (e) {
        try { await message.react(Emojis.get('checker') || ''); } catch {}
    }

    if (!canalLogsId) return;
    const canalLogs = client.channels.cache.get(canalLogsId);
    if (!canalLogs) return;

    
    let analise = null;
    const openai = getOpenAIClient();
    if (openai && message.content.trim().length > 0) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'system', content: 'Você é um analisador de feedbacks de uma loja de Robux/Roblox. Analise o feedback e responda no formato: "[POSITIVO/NEGATIVO/NEUTRO] breve resumo em 1 linha em português".' },
                    { role: 'user', content: message.content.slice(0, 500) }
                ],
                max_tokens: 80,
                temperature: 0.3
            });
            analise = completion.choices[0]?.message?.content?.trim();
        } catch (e) {}
    }

    const embed = new EmbedBuilder()
        .setColor(analise?.includes('[POSITIVO]') ? '#22c55e' : analise?.includes('[NEGATIVO]') ? '#ef4444' : '#5865f2')
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTitle(`${Emojis.get('codigocopia')||''} Novo Feedback Recebido`)
        .addFields(
            { name: 'Autor', value: `${message.author} (\`${message.author.id}\`)`, inline: true },
            { name: 'Canal', value: `<#${message.channel.id}>`, inline: true },
            { name: 'Mensagem', value: message.content.slice(0, 1024) || '*Sem texto*' }
        )
        .setTimestamp();

    if (analise) {
        embed.addFields({ name: `${Emojis.get('robot')||''} Análise da IA`, value: analise });
    }

    if (message.attachments.size > 0) {
        const img = message.attachments.find(a => a.contentType?.startsWith('image/'));
        if (img) embed.setImage(img.url);
    }

    try {
        await canalLogs.send({ embeds: [embed] });
    } catch (e) {}
}


async function modalAddCanal(interaction) {
    const modal = new ModalBuilder().setCustomId('feedback_modal_add_canal').setTitle('Adicionar Canal de Feedback');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal de Feedback').setPlaceholder('Cole o ID do canal').setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function modalRemoveCanal(interaction) {
    const modal = new ModalBuilder().setCustomId('feedback_modal_remove_canal').setTitle('Remover Canal de Feedback');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal para remover').setPlaceholder('Cole o ID do canal que deseja remover').setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function modalConfigEmoji(interaction) {
    const config = feedbackConfig.get('config') || {};
    const modal = new ModalBuilder().setCustomId('feedback_modal_emoji').setTitle('Configurar Emoji de Reação');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('emoji').setLabel('Emoji (unicode ou ID de emoji customizado)').setPlaceholder(`Ex: ${Emojis.get('checker')||''} ou ID numérico do emoji`).setValue(config.emoji || Emojis.get('checker') || '').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
        )
    );
    await interaction.showModal(modal);
}

async function modalConfigLogs(interaction) {
    const config = feedbackConfig.get('config') || {};
    const modal = new ModalBuilder().setCustomId('feedback_modal_logs').setTitle('Configurar Canal de Logs');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal de Logs').setPlaceholder('Cole o ID do canal para logs').setValue(config.canalLogs || '').setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}


async function handleModalAddCanal(interaction) {
    const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal) return interaction.reply({ content: `${Emojis.get('negative')||''} | Canal \`${canalId}\` não encontrado!`, flags: 64 });

    let config = feedbackConfig.get('config') || {};
    const canais = config.canais || [];
    if (!canais.includes(canalId)) canais.push(canalId);
    config.canais = canais;
    feedbackConfig.set(`config`, config);

    await painelFeedbackMonitor(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Canal <#${canalId}> adicionado ao monitoramento!`, flags: 64 });
}

async function handleModalRemoveCanal(interaction) {
    const canalId = interaction.fields.getTextInputValue('canal_id').trim();
    let config = feedbackConfig.get('config') || {};
    config.canais = (config.canais || []).filter(id => id !== canalId);
    feedbackConfig.set(`config`, config);

    await painelFeedbackMonitor(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Canal removido do monitoramento!`, flags: 64 });
}

async function handleModalEmoji(interaction) {
    const emoji = interaction.fields.getTextInputValue('emoji').trim();
    let config = feedbackConfig.get('config') || {};
    config.emoji = emoji;
    feedbackConfig.set(`config`, config);

    await painelFeedbackMonitor(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Emoji de reação configurado: ${emoji}`, flags: 64 });
}

async function handleModalLogs(interaction) {
    const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal) return interaction.reply({ content: `${Emojis.get('negative')||''} | Canal \`${canalId}\` não encontrado!`, flags: 64 });

    let config = feedbackConfig.get('config') || {};
    config.canalLogs = canalId;
    feedbackConfig.set(`config`, config);

    await painelFeedbackMonitor(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Canal de logs definido como <#${canalId}>!`, flags: 64 });
}

module.exports = {
    painelFeedbackMonitor,
    processarFeedback,
    modalAddCanal,
    modalRemoveCanal,
    modalConfigEmoji,
    modalConfigLogs,
    handleModalAddCanal,
    handleModalRemoveCanal,
    handleModalEmoji,
    handleModalLogs,
    feedbackConfig
};