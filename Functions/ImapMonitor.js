const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const { OpenAI } = require('openai');
const { configuracao } = require('../database');
const { JsonDatabase } = require("../database/jsondb");
const path = require('path');

let monitorRunning = false;
let processando = false; 

const pagamentosRobux = new JsonDatabase({
    databasePath: path.join(__dirname, '..', 'database', 'pagamentosrobux.json')
});


function normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '').trim();
}


function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/td>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#[0-9]+;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}


function nameSimilarity(emailName, expectedName) {
    const normEmail = normalizeStr(emailName);
    const normExpected = normalizeStr(expectedName);
    if (!normEmail || !normExpected) return 0;
    if (normEmail === normExpected) return 1.0;

    const eParts = normEmail.split(/\s+/).filter(Boolean);
    const xParts = normExpected.split(/\s+/).filter(Boolean);
    if (!eParts.length || !xParts.length) return 0;

    
    const emailNoSpaces = normEmail.replace(/\s+/g, '');
    const isAllInitials = emailNoSpaces.length >= 2 && emailNoSpaces.length <= 5 &&
        /^[a-z]+$/.test(emailNoSpaces) && eParts.length === 1;
    if (isAllInitials && xParts.length >= emailNoSpaces.length) {
        const initials = xParts.map(w => w[0]).join('');
        let pos = 0;
        for (const ch of emailNoSpaces) {
            const found = initials.indexOf(ch, pos);
            if (found === -1) break;
            pos = found + 1;
        }
        if (pos >= emailNoSpaces.length) return 0.85;
        const matchedInitials = emailNoSpaces.split('').filter(ch => initials.includes(ch)).length;
        if (matchedInitials / emailNoSpaces.length >= 0.5) return 0.6;
    }

    
    let totalScore = 0;
    for (const ew of eParts) {
        let bestScore = 0;
        for (const xw of xParts) {
            let score = 0;
            if (ew === xw) { score = 1.0; }
            else if (ew.length >= 3 && xw.startsWith(ew)) { score = 0.85; }
            else if (xw.length >= 3 && ew.startsWith(xw)) { score = 0.85; }
            else if (ew.length >= 4 && xw.length >= 4 && ew.slice(0, 4) === xw.slice(0, 4)) { score = 0.8; }
            else if (ew.length >= 3 && xw.includes(ew)) { score = 0.7; }
            else if (xw.length >= 3 && ew.includes(xw)) { score = 0.7; }
            else if (ew.length === 1 && xw[0] === ew) { score = 0.5; }
            if (score > bestScore) bestScore = score;
        }
        totalScore += bestScore;
    }

    const rawSim = totalScore / Math.max(eParts.length, xParts.length);

    
    const surnames = xParts.filter(w => w.length >= 4);
    const emailSurnames = eParts.filter(w => w.length >= 4);
    const surnameMatches = emailSurnames.filter(ew =>
        surnames.some(xw => xw === ew || xw.startsWith(ew) || ew.startsWith(xw))
    );
    if (surnameMatches.length > 0) return Math.min(1.0, rawSim + 0.15);

    return rawSim;
}


function getPendingImapPayments() {
    try {
        const all = pagamentosRobux.fetchAll();
        const results = [];
        for (const entry of all) {
            const channelId = entry.ID;
            const val = entry.data;
            const data = val?.pagamento;
            if (!data) continue;
            if (data.method !== 'imap') continue;
            if (val.aprovado) continue;
            results.push({ channelId, data, val });
        }
        return results;
    } catch (e) {
        console.error('[IMAP] Erro ao ler pagamentosrobux:', e.message);
        return [];
    }
}


async function extractPaymentInfoWithAI(subject, bodyText) {
    try {
        const openaiKey = configuracao.get('pagamentos.openai_key');
        if (openaiKey) {
            const openai = new OpenAI({ apiKey: openaiKey });
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'Você extrai dados de emails bancários brasileiros sobre PIX recebido. Retorne JSON com nome do pagador exatamente como aparece (pode ser abreviado, em caixa alta, com ponto), valor em decimal, e se encontrou PIX.'
                }, {
                    role: 'user',
                    content: `Assunto: ${subject}\n\nCorpo (primeiros 4000 chars):\n${bodyText.substring(0, 4000)}\n\nJSON: {"nome":"nome do pagador","valor":0.00,"encontrouPix":true/false}`
                }],
                max_tokens: 150,
                temperature: 0
            });
            const txt = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
            return JSON.parse(txt);
        }
    } catch (e) {
        console.error('[IMAP AI]', e.message);
    }

    
    const combined = subject + '\n' + bodyText;
    const combinedLower = combined.toLowerCase();

    const isPix =
        (combinedLower.includes('pix') || combinedLower.includes('transferencia') || combinedLower.includes('transferência')) &&
        (combinedLower.includes('recebeu') || combinedLower.includes('recebido') ||
            combinedLower.includes('creditad') || combinedLower.includes('entrada') ||
            combinedLower.includes('recebemos') || combinedLower.includes('pagamento') ||
            combinedLower.includes('deposito') || combinedLower.includes('depósito'));

    
    const valorPatterns = [
        /r\$\s*([\d]{1,6}[.,][\d]{2})/i,
        /valor[:\s]+r?\$?\s*([\d]{1,6}[.,][\d]{2})/i,
        /([\d]{1,6}[.,][\d]{2})\s*reais/i,
    ];
    let valor = 0;
    for (const p of valorPatterns) {
        const m = combined.match(p);
        if (m) { valor = parseFloat(m[1].replace(',', '.')); break; }
    }

    
    const nomePatterns = [
        /(?:de:|pagador:|remetente:|nome:|origem:|enviado por:)\s*([A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú\s.]{3,60}?)(?:\n|$|cpf|cnpj|banco|nubank|inter|itau)/i,
        /transferência de\s+([A-ZÀ-Ú][a-zA-ZÀ-ú\s.]{3,50}?)(?:\n|$|cpf)/i,
        /pix de\s+([A-ZÀ-Ú][a-zA-ZÀ-ú\s.]{3,50}?)(?:\n|$|cpf)/i,
        /recebido de\s+([A-ZÀ-Ú][a-zA-ZÀ-ú\s.]{3,50}?)(?:\n|$|cpf)/i,
        /recebeu de\s+([A-ZÀ-Ú][a-zA-ZÀ-ú\s.]{3,50}?)(?:\n|$)/i,
        /\bde\s+([A-Z][A-Z\s]{5,50}?)\s+(?:cpf|cnpj|banco|nubank|inter|\d{3})/i,
    ];
    let nome = '';
    for (const pat of nomePatterns) {
        const m = combined.match(pat);
        if (m) { nome = m[1].trim().replace(/\s+/g, ' '); break; }
    }

    return { nome, valor, encontrouPix: isPix };
}


async function tentarAprovar(discordClient, channelId, data, val, emailName, emailValor, similarity) {
    console.log(`[IMAP] ✅ APROVANDO canal=${channelId} pagador="${emailName}" sim=${(similarity * 100).toFixed(0)}%`);

    try {
        const { aprovarPagamentoRobux } = require('./VerificarPagamentoRobux');
        const channel = await discordClient.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            console.error(`[IMAP] Canal ${channelId} não encontrado!`);
            return;
        }

        const paymentEntry = {
            ID: channelId,
            data: {
                pagamento: { ...data, pagadorDetectado: emailName, aprovadoPor: 'IMAP Auto' },
                carrinho: val.carrinho,
                oderId: val.oderId
            }
        };

        await aprovarPagamentoRobux(discordClient, paymentEntry, channel, `IMAP Auto (${(similarity * 100).toFixed(0)}% match)`);
        console.log(`[IMAP] 🎉 Aprovação concluída para canal ${channelId}`);
    } catch (e) {
        console.error('[IMAP] Erro ao aprovar pagamento:', e.message, e.stack);
    }
}


async function buscarEmailsNaPasta(connection, pasta, horasAtras) {
    try {
        await connection.openBox(pasta);
    } catch (e) {
        return []; 
    }
    const since = new Date(Date.now() - horasAtras * 60 * 60 * 1000);
    try {
        const messages = await connection.search(
            [['SINCE', since]],
            { bodies: ['HEADER.FIELDS (SUBJECT FROM DATE)', 'TEXT'], markSeen: false }
        );
        return messages;
    } catch (e) {
        return [];
    }
}


async function processNewEmails(discordClient) {
    if (processando) return;
    processando = true;

    const cfg = configuracao.get('pagamentos.imap');
    if (!cfg?.host || !cfg?.user || !cfg?.senha) {
        processando = false;
        return;
    }

    const pending = getPendingImapPayments();
    if (!pending.length) { processando = false; return; }

    console.log(`[IMAP] Verificando emails. Pendentes: ${pending.length}`);

    const imapConfig = {
        imap: {
            user: cfg.user,
            password: cfg.senha,
            host: cfg.host,
            port: cfg.porta || 993,
            tls: true,
            authTimeout: 25000,
            connTimeout: 25000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    let connection;
    try {
        connection = await imaps.connect(imapConfig);

        
        const pastasParaTentar = ['INBOX', 'Inbox', 'NOTIFICATIONS', 'Notificações', 'Nubank', 'Inter'];
        let allMessages = [];

        for (const pasta of pastasParaTentar) {
            const msgs = await buscarEmailsNaPasta(connection, pasta, 6); 
            if (msgs.length > 0) {
                console.log(`[IMAP] ${msgs.length} email(s) em "${pasta}"`);
                allMessages = allMessages.concat(msgs.map(m => ({ ...m, _pasta: pasta })));
            }
        }

        console.log(`[IMAP] Total de emails encontrados: ${allMessages.length}`);

        for (const msg of allMessages) {
            const header = msg.parts.find(p => p.which.startsWith('HEADER'));
            const body = msg.parts.find(p => p.which === 'TEXT');
            const subject = header?.body?.subject?.[0] || '';
            const rawBody = body?.body || '';

            let emailTextPlain = '';
            let emailTextHtml = '';
            try {
                const parsed = await simpleParser(rawBody);
                emailTextPlain = parsed.text || '';
                emailTextHtml = parsed.html ? stripHtml(parsed.html) : '';
            } catch (e) {
                emailTextPlain = rawBody;
            }

            
            const emailText = emailTextPlain.length > emailTextHtml.length
                ? emailTextPlain
                : emailTextHtml;

            const fullText = subject + '\n' + emailText;

            console.log(`[IMAP] Email: assunto="${subject}" | texto=${emailText.length} chars`);
            if (emailText.length < 10) {
                console.log(`[IMAP] Email sem corpo útil, tentando raw...`);
            }

            const info = await extractPaymentInfoWithAI(subject, fullText);

            console.log(`[IMAP] Extração: encontrouPix=${info.encontrouPix} nome="${info.nome}" valor=${info.valor}`);

            if (!info.encontrouPix) continue;

            for (const { channelId, data, val } of pending) {
                const pagadorEsperado = data.pagador || '';
                const expectedValor = parseFloat(data.valor || 0);

                
                const valorOk = info.valor <= 0 || expectedValor <= 0 ||
                    Math.abs(info.valor - expectedValor) < 0.10;

                if (!info.nome) {
                    
                    if (valorOk && expectedValor > 0 && info.valor > 0) {
                        console.log(`[IMAP] Sem nome no email, mas valor bate (${info.valor} ≈ ${expectedValor}). Aprovando...`);
                        await tentarAprovar(discordClient, channelId, data, val, 'Detectado por valor', info.valor, 0.7);
                        break;
                    }
                    continue;
                }

                const similarity = nameSimilarity(info.nome, pagadorEsperado);

                console.log(`[IMAP] Comparando "${info.nome}" vs "${pagadorEsperado}" | sim=${(similarity * 100).toFixed(0)}% valorOk=${valorOk}`);

                if (similarity >= 0.50 && valorOk) {
                    await tentarAprovar(discordClient, channelId, data, val, info.nome, info.valor, similarity);
                    break;
                }

                
                if (valorOk && info.valor > 0 && expectedValor > 0 && Math.abs(info.valor - expectedValor) < 0.02) {
                    if (similarity >= 0.30) {
                        console.log(`[IMAP] Valor exato + nome parcial (${(similarity*100).toFixed(0)}%) → aprovando`);
                        await tentarAprovar(discordClient, channelId, data, val, info.nome, info.valor, similarity);
                        break;
                    }
                }
            }
        }
    } catch (e) {
        const msg = e.message || '';
        if (!msg.includes('timeout') && !msg.includes('ECONNREFUSED') && !msg.includes('ENOTFOUND')) {
            console.error('[IMAP] Erro:', msg);
        } else {
            console.log(`[IMAP] Conexão falhou: ${msg}`);
        }
    } finally {
        try { if (connection) await connection.end(); } catch (e) {}
        processando = false;
    }
}


async function validateBankNameWithAI(name) {
    try {
        const openaiKey = configuracao.get('pagamentos.openai_key');
        if (openaiKey) {
            const openai = new OpenAI({ apiKey: openaiKey });
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `O texto abaixo é um nome de pessoa para PIX no Brasil? Pode ser abreviado, iniciais ou nome completo. Responda apenas "sim" ou "nao".\n\nTexto: "${name}"`
                }],
                max_tokens: 5, temperature: 0
            });
            return completion.choices[0].message.content.trim().toLowerCase().includes('sim');
        }
    } catch (e) {}
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 80) return false;
    const words = trimmed.split(/\s+/);
    if (words.length === 1) return /^[A-Za-zÀ-ú]{2,}$/.test(words[0]);
    return words.length >= 2 && words.every(w => /^[A-Za-zÀ-ú.]{1,}$/.test(w));
}


function startImapMonitor(discordClient) {
    if (monitorRunning) return;

    const cfg = configuracao.get('pagamentos.imap');
    if (!cfg?.host || !cfg?.user || !cfg?.senha) {
        console.log('[IMAP] Credenciais não configuradas. Acesse o painel para configurar.');
        return;
    }

    monitorRunning = true;
    console.log(`[IMAP] ✅ Monitor iniciado! Host: ${cfg.host} | Verificando a cada 20s`);

    
    setTimeout(() => processNewEmails(discordClient).catch(e =>
        console.error('[IMAP] Erro inicial:', e.message)
    ), 8000);

    
    setInterval(() => processNewEmails(discordClient).catch(e =>
        console.error('[IMAP] Erro ciclo:', e.message)
    ), 20000);
}

module.exports = { startImapMonitor, validateBankNameWithAI, nameSimilarity };