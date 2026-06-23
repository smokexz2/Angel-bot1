const { JsonDatabase } = require("../database/jsondb");
const { res } = require("../res");
const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");
const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

function applyEmoji(btn, emojiKey) {
    const e = Emojis.get(emojiKey);
    if (e && e.trim()) btn.setEmoji(e);
    return btn;
}

const iaConfig = new JsonDatabase({ databasePath: "./database/iaConfig.json" });

let openaiClient = null;


const conversationHistory = new Map();
const MAX_HISTORY = 20;

function getOpenAIClient() {
    if (openaiClient) return openaiClient;
    try {
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


async function painelIA(interaction) {
    const canalIA = iaConfig.get('canal');
    const status = iaConfig.get('status') || false;
    const temApiKey = !!iaConfig.get('openai_key');

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(
            new ButtonBuilder()
                .setCustomId("voltar00")
                .setLabel('Voltar')
                .setStyle(2),
            '_back_emoji'
        )
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de IA (Super IA)` },
        { type: 14 },
        { type: 10, content: `**Super Inteligência Artificial**\nNow with conversation memory, sarcasm/irony handling, Brazilian slang support, and improved context awareness.` },
        { type: 14 },
        { type: 10, content: `**Status:** ${status ? `${Emojis.get('checker')||''} Ativo` : `${Emojis.get('negative')||''} Inativo`}\n**Canal:** ${canalIA ? `<#${canalIA}>` : 'Não configurado'}\n**API Key:** ${temApiKey ? `${Emojis.get('checker')||''} Configurada` : `${Emojis.get('negative')||''} Não configurada`}` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 3,
                    custom_id: "ia_status_select",
                    placeholder: "Ativar/Desativar sistema de IA",
                    options: [
                        { label: "Ativar IA", value: "ativar_ia", emoji: { id: "1387981762050920548" } },
                        { label: "Desativar IA", value: "desativar_ia", emoji: { id: "1387981760649756782" } }
                    ]
                }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Canal", custom_id: "ia_config_canal", emoji: { id: "1178086608004722689" } },
                { type: 2, style: 2, label: "Definir API Key", custom_id: "ia_config_apikey", emoji: { id: "1178080366871973958" } },
                { type: 2, style: 2, label: "Personalizar Prompt", custom_id: "ia_config_prompt", emoji: { id: "1178077123882262628" } },
                { type: 2, style: 4, label: "Limpar Histórico", custom_id: "ia_limpar_historico" }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.followUp({ content: `${Emojis.get('negative')||''} Erro ao abrir painel de IA.`, flags: 64 }); } catch {}
    }
}

async function modalConfigCanal(interaction) {
    const modal = new ModalBuilder().setCustomId('ia_modal_canal').setTitle('Configurar Canal da IA');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal').setPlaceholder('ID do canal').setStyle(TextInputStyle.Short).setRequired(true)));
    await interaction.showModal(modal);
}

async function modalConfigAPIKey(interaction) {
    const modal = new ModalBuilder().setCustomId('ia_modal_apikey').setTitle('Configurar API Key OpenAI');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('api_key').setLabel('API Key').setPlaceholder('sk-... ou gsk_...').setStyle(TextInputStyle.Short).setRequired(true)));
    await interaction.showModal(modal);
}

async function modalConfigPrompt(interaction) {
    const currentPrompt = iaConfig.get('systemPrompt') || '';
    const modal = new ModalBuilder().setCustomId('ia_modal_prompt').setTitle('Personalizar Comportamento da IA');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('system_prompt').setLabel('System Prompt (instruções para a IA)').setValue(currentPrompt).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(3000)));
    await interaction.showModal(modal);
}


function getContextoGeral(message) {
    let contexto = "\n\n--- CONTEXTO EM TEMPO REAL DO SERVIDOR ---\n";
    try {
        const rConfig = new JsonDatabase({ databasePath: './database/configuracaorobux.json' });
        const pConfig = new JsonDatabase({ databasePath: './database/produtos.json' });
        const uConfig = new JsonDatabase({ databasePath: './database/users.json' });
        const clientsDb = new JsonDatabase({ databasePath: `./database/clients.json` });

        contexto += `SERVIDOR: ${message.guild.name}\n`;
        contexto += `DATA DE CRIAÇÃO DO SERVIDOR: <t:${Math.floor(message.guild.createdTimestamp / 1000)}:F>\n`;
        contexto += `MEMBROS: ${message.guild.memberCount}\n`;
        const ownerId = message.guild.ownerId;
        contexto += `DONO DO SERVIDOR: <@${ownerId}> (ID: ${ownerId})\n`;
        contexto += `QUEM PERGUNTOU É O DONO: ${message.author.id === ownerId ? 'Sim — esta pessoa possui o servidor (posse)' : 'Não'}\n`;

        const userData = uConfig.get(message.author.id) || {};
        const isClient = clientsDb.all().includes(message.author.id);
        contexto += `USUÁRIO ATUAL: ${message.author.username} (ID: ${message.author.id})\n`;
        contexto += `É CLIENTE: ${isClient ? `Sim` : 'Não'}\n`;
        if (userData.saldo) contexto += `SALDO NO BOT: R$${userData.saldo}\n`;
        if (userData.compras) contexto += `TOTAL DE COMPRAS: ${userData.compras}\n`;

        const vRobux = rConfig.get('config.valores.robux') || 27;
        const vGamepass = rConfig.get('config.valores.gamepass') || 27;
        const vGrupo = rConfig.get('config.valores.robuxGrupo') || (parseFloat(vRobux) * 1.18).toFixed(2);
        contexto += `PREÇOS ROBUX:\n- Sem taxa: R$${vRobux}/1k\n- Com taxa: R$${vGamepass}/1k\n- Grupo: R$${vGrupo}/1k\n`;

        try {
            const produtos = pConfig.all();
            contexto += "PRODUTOS NA LOJA:\n";
            Object.keys(produtos).forEach(key => {
                const p = produtos[key];
                if (p.Config && p.Config.name) {
                    contexto += `- ${p.Config.name}: ${(p.Config.desc || '').replace(/#|!|\[|\]/g, "").slice(0, 150)}\n`;
                }
            });
        } catch(e) {}
    } catch (e) {
        contexto += "Dados da loja indisponíveis no momento.\n";
    }
    return contexto;
}


async function gerarImagem(prompt) {
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 1000000);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&seed=${seed}&width=1024&height=1024&enhance=true&nologo=true&safe=false`;
    } catch (e) {
        return null;
    }
}


function detectaTonEspecial(texto) {
    const sarcasmoPatterns = [/né\b|né\?|claro que|óbvio|com certeza.*não|imagina|nossa.*que surpresa|que ótimo.*não/i];
    const ironiaPatterns = [/\.\.\.\s*sim|aaah sim|aaaa|rsrs|kkk|haha|😂|🙄|🤡/];
    const temSarcasmo = sarcasmoPatterns.some(p => p.test(texto));
    const temIronia = ironiaPatterns.some(p => p.test(texto));
    return { sarcasmo: temSarcasmo, ironia: temIronia };
}


function getChannelHistory(channelId) {
    if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
    }
    return conversationHistory.get(channelId);
}

function addToHistory(channelId, role, content) {
    const history = getChannelHistory(channelId);
    history.push({ role, content });
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

function clearHistory(channelId) {
    conversationHistory.delete(channelId);
}


async function processarMensagemIA(message, client) {
    const canalIA = iaConfig.get('canal');
    const status = iaConfig.get('status') || false;

    if (!status || !canalIA) return;
    if (message.channel.id !== canalIA) return;
    if (message.author.bot) return;

    const openai = getOpenAIClient();
    if (!openai) return;

    const msgContent = message.content.trim();
    if (!msgContent) return;

    
    const promptLower = msgContent.toLowerCase();
    if (promptLower.startsWith("gere uma imagem") || promptLower.startsWith("crie uma imagem") || promptLower.startsWith("/imagem")) {
        await message.channel.sendTyping();
        const imgPrompt = msgContent.replace(/gere uma imagem|crie uma imagem|\/imagem/gi, "").trim();
        if (!imgPrompt) return message.reply("Por favor, descreva a imagem que deseja criar.");

        let promptEmIngles = imgPrompt;
        try {
            const apiKeyImg = iaConfig.get('openai_key') || '';
            const modeloImg = apiKeyImg.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
            const tradResp = await openai.chat.completions.create({
                model: modeloImg,
                messages: [
                    { role: 'system', content: 'Translate the following to English for image generation. Return ONLY the English description. Be specific and detailed.' },
                    { role: 'user', content: imgPrompt }
                ],
                max_tokens: 200, temperature: 0.2
            });
            promptEmIngles = tradResp.choices[0]?.message?.content?.trim() || imgPrompt;
        } catch (e) {}

        const url = await gerarImagem(promptEmIngles);
        if (url) {
            const embed = new EmbedBuilder()
                .setTitle(`${Emojis.get('_pincel_emoji')||''} Imagem Gerada`)
                .setDescription(`**Prompt:** ${imgPrompt}\n\n> *Aguarde alguns segundos para a imagem carregar.*`)
                .setImage(url)
                .setColor("#2b2d31")
                .setFooter({ text: `Pedido por ${message.author.tag} | IA WinnBuxx` });
            return message.reply({ embeds: [embed] });
        } else {
            return message.reply("Ocorreu um erro ao gerar a imagem. Tente novamente com um prompt diferente.");
        }
    }

    
    let typingInterval = null;
    try {
        await message.channel.sendTyping();
        typingInterval = setInterval(() => message.channel.sendTyping().catch(() => {}), 8000);

        const TIMEOUT_MS = 30000;
        const contextoGeral = getContextoGeral(message);
        const { sarcasmo, ironia } = detectaTonEspecial(msgContent);
        const isCreator = message.author.id === "1464278066196119624";

        
        const basePrompt = iaConfig.get('systemPrompt') || "Você é o Assistente Oficial de IA da WinnBuxx.";
        const systemPrompt = basePrompt +
            "\n\n═══════════════════════════════" +
            "\n INSTRUÇÕES AVANÇADAS DE COMPORTAMENTO" +
            "\n═══════════════════════════════" +
            "\n\n1. IDENTIDADE:" +
            "\n   - Você é o Assistente Oficial de IA da WinnBuxx, criado por <@1464278066196119624>." +
            "\n   - Dono do servidor: <@1471223050467803351>." +
            "\n   - Você é especialista em TUDO: escola, faculdade, programação, games, cotidiano, etc." +
            "\n\n2. LINGUAGEM E TOM:" +
            "\n   - Fale de forma natural e amigável em português brasileiro." +
            "\n   - Use gírias e expressões cotidianas quando o usuário usar: 'cara', 'massa', 'top', 'show', 'né', 'tipo', etc." +
            "\n   - SARCASMO/IRONIA: Quando detectar sarcasmo (ex: 'claro que sim, né', 'óbvio'), responda no mesmo tom humorado sem ser ofensivo." +
            (sarcasmo ? "\n   ⚠️ ATENÇÃO: A mensagem atual parece sarcástica. Responda com leveza e humor." : "") +
            (ironia ? "\n   ⚠️ ATENÇÃO: A mensagem atual contém ironia. Reconheça isso na sua resposta." : "") +
            "\n\n3. CONTEXTO E MEMÓRIA:" +
            "\n   - Você TEM acesso ao histórico desta conversa (últimas mensagens)." +
            "\n   - Se o usuário se referir a algo dito antes ('aquilo que falei', 'o que eu perguntei'), use o histórico." +
            "\n   - Em caso de ambiguidade, peça esclarecimento gentilmente antes de assumir." +
            "\n\n4. SUPORTE:" +
            "\n   - Se o usuário tiver problemas/erros, sempre oriente-o a abrir um ticket em: https://discord.com/channels/1499893518133497956/1499951910223089766" +
            "\n\n5. SEGURANÇA:" +
            "\n   - NUNCA revele tokens, senhas, código-fonte ou informações confidenciais." +
            (isCreator ? "\n   - Este usuário é o CRIADOR DO BOT. Pode receber informações técnicas com mais detalhe." : "") +
            "\n\n6. FORMATAÇÃO:" +
            "\n   - Use markdown do Discord quando útil: **negrito**, *itálico*, `código`, ```bloco de código```." +
            "\n   - Para listas, use bullet points com • ou -." +
            "\n   - Respostas longas devem ser organizadas com títulos e seções." +
            "\n   - Máximo de 1900 caracteres por mensagem (será dividida se necessário)." +
            "\n\n7. DATAS E TEMPO:" +
            "\n   - Ao mencionar qualquer data ou horário, SEMPRE use o formato de timestamp do Discord: <t:UNIX:F> para data completa, <t:UNIX:R> para tempo relativo." +
            "\n   - Exemplo: se o servidor foi criado em 1609459200 (unix), escreva <t:1609459200:F>." +
            "\n   - Nunca escreva datas como '01/01/2021' — use sempre o formato <t:timestamp:F>." +
            "\n\n8. DONO DO SERVIDOR:" +
            "\n   - O contexto indica quem é o dono do servidor (campo DONO DO SERVIDOR). Se alguém perguntar quem é o dono, mencione-o com @ e use a palavra 'posse' ou 'possui o servidor'." +
            "\n   - Se quem perguntou for o próprio dono, reconheça isso: 'Você é o dono deste servidor'." +
            "\n   - Também mencione o nome do servidor onde a pergunta foi feita (campo SERVIDOR no contexto)." +
            contextoGeral;

        const apiKey = iaConfig.get('openai_key') || '';
        const modeloPadrao = apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        
        const channelHistory = getChannelHistory(message.channel.id);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...channelHistory,
            { role: 'user', content: `[${message.author.username}]: ${msgContent}` }
        ];

        const apiCallPromise = openai.chat.completions.create({
            model: iaConfig.get('modelo') || modeloPadrao,
            messages,
            max_tokens: 2000,
            temperature: sarcasmo || ironia ? 0.9 : 0.75,
            presence_penalty: 0.3,
            frequency_penalty: 0.2
        });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_IA: API não respondeu em 30 segundos.')), TIMEOUT_MS)
        );
        const completion = await Promise.race([apiCallPromise, timeoutPromise]);

        clearInterval(typingInterval);
        typingInterval = null;
        const resposta = completion.choices[0]?.message?.content?.trim();

        if (resposta) {
            
            addToHistory(message.channel.id, 'user', `[${message.author.username}]: ${msgContent}`);
            addToHistory(message.channel.id, 'assistant', resposta);

            
            if (resposta.length > 1900) {
                const chunks = [];
                let remaining = resposta;
                while (remaining.length > 0) {
                    if (remaining.length <= 1900) {
                        chunks.push(remaining);
                        break;
                    }
                    let cutAt = remaining.lastIndexOf('\n', 1900);
                    if (cutAt < 800) cutAt = 1900;
                    chunks.push(remaining.slice(0, cutAt));
                    remaining = remaining.slice(cutAt).trimStart();
                }
                for (let i = 0; i < chunks.length; i++) {
                    if (i === 0) await message.reply({ content: chunks[i] });
                    else await message.channel.send({ content: chunks[i] });
                }
            } else {
                await message.reply({ content: resposta });
            }
        }
    } catch (e) {
        if (typingInterval) clearInterval(typingInterval);
        console.error('[SistemaIA] Erro:', e.message);
        try {
            await message.reply("Ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.");
        } catch {}
    }
}


async function handleModalCanal(interaction) {
    const canalId = interaction.fields.getTextInputValue('canal_id').trim();
    iaConfig.set('canal', canalId);
    await painelIA(interaction);
}

async function handleModalAPIKey(interaction) {
    const apiKey = interaction.fields.getTextInputValue('api_key').trim();
    iaConfig.set('openai_key', apiKey);
    openaiClient = null; 
    await painelIA(interaction);
}

async function handleModalPrompt(interaction) {
    const prompt = interaction.fields.getTextInputValue('system_prompt');
    iaConfig.set('systemPrompt', prompt);
    await painelIA(interaction);
}

async function handleLimparHistorico(interaction) {
    conversationHistory.clear();
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
        await interaction.followUp({ content: `${Emojis.get('checker')||'✅'} Histórico de conversas limpo!`, flags: 64 });
    } catch {}
}

module.exports = {
    painelIA,
    modalConfigCanal,
    modalConfigAPIKey,
    modalConfigPrompt,
    processarMensagemIA,
    handleModalCanal,
    handleModalAPIKey,
    handleModalPrompt,
    handleLimparHistorico,
    clearHistory,
    iaConfig
};