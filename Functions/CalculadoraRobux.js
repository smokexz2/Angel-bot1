let createCanvas, loadImage;
try {
    const canvasMod = require("canvas");
    createCanvas = canvasMod.createCanvas;
    loadImage = canvasMod.loadImage;
} catch (e) {
    console.warn('[CalculadoraRobux] canvas não disponível, imagens desabilitadas:', e.message);
}
const path = require('path');
const WINNBUXX_LOGO_PATH = path.join(__dirname, '../database/winnbuxx-logo.png');
const { AttachmentBuilder } = require("discord.js");
const { JsonDatabase } = require("../database/jsondb");
const { res } = require("../res");
const axios = require("axios");
const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

const robuxConfig = new JsonDatabase({ databasePath: "./database/configuracaorobux.json" });


function calcularPrecos(quantidade, config) {
    const valorPor1000 = parseFloat(config.get('config.valores.robux')) || 27;
    const valorGamepassPor1000 = parseFloat(config.get('config.valores.gamepass')) || 27;
    const valorGrupoPor1000 = parseFloat(config.get('config.valores.robuxGrupo')) || (valorPor1000 * 1.18);

    const precoSemTaxa = (quantidade / 1000) * valorPor1000;
    const recebeSemTaxa = Math.floor(quantidade * 0.7);

    const precoComTaxa = Math.ceil(precoSemTaxa / 0.75);
    const gamepassNecessario = Math.ceil(quantidade / 0.7);

    const precoViaGrupo = (quantidade / 1000) * valorGrupoPor1000;

    const precoGamepassProduto = (quantidade / 1000) * valorGamepassPor1000;

    return {
        semTaxa: { preco: precoSemTaxa, recebe: recebeSemTaxa },
        comTaxa: { preco: precoComTaxa, gamepassNecessario },
        viaGrupo: { preco: precoViaGrupo },
        gamepassProduto: { preco: precoGamepassProduto }
    };
}

function formatBRL(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


async function gerarImagemCalculadora(quantidade, calculos, guild) {
    if (!createCanvas) throw new Error('Canvas não disponível neste ambiente.');
    const W = 920, H = 560;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, W, H);

    
    const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
    grad.addColorStop(0, 'rgba(60,40,100,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    
    let winnbuxxIcon = null;
    try {
        winnbuxxIcon = await loadImage(WINNBUXX_LOGO_PATH);
    } catch (e) {}

    const iconSize = 48;
    const iconX = 28, iconY = 22;

    if (winnbuxxIcon) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(winnbuxxIcon, iconX, iconY, iconSize, iconSize);
        ctx.restore();
    } else {
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    
    const dotX = iconX + iconSize + 14;
    const dotY = iconY + iconSize / 2;
    ctx.fillStyle = '#57f287';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '600 14px Arial';
    ctx.fillText('Winnbuxx', dotX + 12, dotY + 5);

    
    const btnW = 140, btnH = 28, btnX = W - btnW - 24, btnY = iconY + 10;
    ctx.fillStyle = '#1a1a1f';
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '600 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Canal automático', btnX + btnW / 2, btnY + 18);
    ctx.textAlign = 'left';

    
    const titleY = iconY + iconSize + 24;
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    const titlePre = 'Calculadora ';
    ctx.fillText(titlePre, 28, titleY);
    const preW = ctx.measureText(titlePre).width;
    ctx.fillStyle = '#e53935';
    ctx.fillText('Robux', 28 + preW, titleY);

    
    ctx.font = '15px Arial';
    ctx.fillStyle = `#8888aa`;
    ctx.fillText(`Preço estimado para ${quantidade.toLocaleString(`pt-BR`)} Robux`, 28, titleY + 26);

    
    const badgeText = `${quantidade.toLocaleString(`pt-BR`)} Robux informado`;
    const badgePad = 12;
    ctx.font = '600 13px Arial';
    const badgeW = ctx.measureText(badgeText).width + badgePad * 2;
    const badgeX = 28, badgeY = titleY + 44;
    ctx.fillStyle = '#1e1e28';
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#ccccdd';
    ctx.fillText(badgeText, badgeX + badgePad, badgeY + 17);

    
    const cardMargin = 14;
    const cardPad = 18;
    const cardsTop = badgeY + 44;
    const cardsLeft = 28;
    const cardW = (W - cardsLeft * 2 - cardMargin) / 2;
    const cardH = (H - cardsTop - 70 - cardMargin) / 2;

    const cardsData = [
        {
            titulo: `● Robux sem taxa`,
            preco: `R$ ${formatBRL(calculos.semTaxa.preco)}`,
            sub: `Você recebe: ${calculos.semTaxa.recebe.toLocaleString(`pt-BR`)} Robux.`,
            cor: '#e53935'
        },
        {
            titulo: `● Robux com taxa`,
            preco: `R$ ${formatBRL(calculos.comTaxa.preco)}`,
            sub: `Você recebe ${quantidade.toLocaleString(`pt-BR`)} Robux aprox.\nCrie uma gamepass de ${calculos.comTaxa.gamepassNecessario.toLocaleString(`pt-BR`)} Robux.`,
            cor: '#e53935'
        },
        {
            titulo: `● Robux via grupo`,
            preco: `R$ ${formatBRL(calculos.viaGrupo.preco)}`,
            sub: `Você recebe ${quantidade.toLocaleString(`pt-BR`)} Robux exatos.`,
            cor: '#e53935'
        },
        {
            titulo: `● Gamepass produto`,
            preco: `R$ ${formatBRL(calculos.gamepassProduto.preco)}`,
            sub: `Compra de gamepass pronta em produto.\nPreço estimado para ${quantidade.toLocaleString(`pt-BR`)} Robux.`,
            cor: '#e53935'
        }
    ];

    for (let i = 0; i < cardsData.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = cardsLeft + col * (cardW + cardMargin);
        const cy = cardsTop + row * (cardH + cardMargin);

        
        ctx.fillStyle = '#13131a';
        drawRoundedRect(ctx, cx, cy, cardW, cardH, 10);
        ctx.fill();
        ctx.strokeStyle = '#1e1e2a';
        ctx.lineWidth = 1;
        ctx.stroke();

        const card = cardsData[i];

        
        ctx.font = '600 13px Arial';
        ctx.fillStyle = card.cor;
        ctx.fillText(card.titulo, cx + cardPad, cy + 26);

        
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(card.preco, cx + cardPad, cy + 62);

        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#8888aa';
        const lines = card.sub.split('\n');
        lines.forEach((line, li) => {
            ctx.fillText(line, cx + cardPad, cy + 82 + li * 16);
        });
    }

    
    const now = new Date();
    const dataStr = now.toLocaleDateString('pt-BR') + ', ' + now.toLocaleTimeString('pt-BR');
    ctx.font = '11px Arial';
    ctx.fillStyle = '#555566';
    ctx.fillText(`Valores baseados no limite atual de 100.000 Robux  •  ${dataStr}`, 28, H - 18);

    return canvas.toBuffer(`image/png`);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}


async function gerarEmbedCalculadora(interaction, quantidade) {
    const calculos = calcularPrecos(quantidade, robuxConfig);

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get(`robux`) || Emojis.get('diamond') || ``} Calculadora Robux` },
        { type: 14 },
        { type: 10, content: `-# Preço estimado para ${quantidade.toLocaleString(`pt-BR`)} Robux\n**${quantidade.toLocaleString(`pt-BR`)} Robux informado**` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2, style: 2,
                    label: `${Emojis.get(`dinheiro`)||``} Sem Taxa — R$ ${formatBRL(calculos.semTaxa.preco)}`,
                    custom_id: `calc_info_semtaxa`, disabled: true
                },
                {
                    type: 2, style: 2,
                    label: `${Emojis.get(`diamond`)||``} Com Taxa — R$ ${formatBRL(calculos.comTaxa.preco)}`,
                    custom_id: `calc_info_comtaxa`, disabled: true
                }
            ]
        },
        { type: 10, content: `**${Emojis.get(`negative`) || ``} Robux sem taxa**\n> Preço: \`R$ ${formatBRL(calculos.semTaxa.preco)}\`\n> Você recebe: \`${calculos.semTaxa.recebe.toLocaleString(`pt-BR`)} Robux\` *(Roblox cobra 30%)*` },
        { type: 10, content: `**${Emojis.get(`checker`) || ``} Robux com taxa**\n> Preço: \`R$ ${formatBRL(calculos.comTaxa.preco)}\`\n> Você recebe: \`${quantidade.toLocaleString(`pt-BR`)} Robux\` aproximados\n> Crie uma gamepass de: \`${calculos.comTaxa.gamepassNecessario.toLocaleString(`pt-BR`)} Robux\`` },
        { type: 10, content: `**${Emojis.get(`dinheiro`) || ``} Robux via grupo**\n> Preço: \`R$ ${formatBRL(calculos.viaGrupo.preco)}\`\n> Você recebe: \`${quantidade.toLocaleString(`pt-BR`)} Robux\` exatos` },
        { type: 10, content: `**${Emojis.get(`robux`) || Emojis.get('diamond') || ''} Gamepass produto**\n> Preço: \`R$ ${formatBRL(calculos.gamepassProduto.preco)}\`\n> Compra de gamepass pronta em produto` },
        { type: 14 },
        { type: 10, content: `-# Valores baseados no limite de 100.000 Robux` }
    ).with({ flags: [64] });

    await interaction.reply(containerContent);
}


async function gerarImagemCalculadoraReply(interaction, quantidade) {
    await interaction.deferReply({ flags: 64 });

    const calculos = calcularPrecos(quantidade, robuxConfig);

    try {
        const imageBuffer = await gerarImagemCalculadora(quantidade, calculos, interaction.guild);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'calculadora-robux.png' });

        await interaction.editReply({ files: [attachment] });
    } catch (e) {
        console.error(`[Calculadora] Erro ao gerar imagem:`, e);
        await interaction.editReply({ content: `${Emojis.get(`negative`) || ``} | Erro ao gerar imagem. Tente novamente.` });
    }
}


async function perguntarTipoCalculadora(interaction, quantidade) {
    const containerContent = res.main(
        { type: 10, content: `${Emojis.get(`robux`) || Emojis.get('diamond') || ``} **Calculadora de Robux — ${quantidade.toLocaleString(`pt-BR`)} Robux**` },
        { type: 10, content: `Como deseja visualizar o resultado?` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: "Gerar por Imagem", custom_id: `calc_imagem_${quantidade}`, emoji: { id: "1178347788501794836" } },
                { type: 2, style: 2, label: "Gerar como Embed", custom_id: `calc_embed_${quantidade}`, emoji: { id: "1178066208835252266" } }
            ]
        }
    ).with({ flags: [64] });

    await interaction.reply(containerContent);
}


async function painelCalculadora(interaction) {
    const calcConfig = new JsonDatabase({ databasePath: "./database/calculadoraConfig.json" });
    const canal = calcConfig.get('canal');
    const status = calcConfig.get(`status`) || false;

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Calculadora Robux` },
        { type: 14 },
        { type: 10, content: `**Calculadora Robux Automática**\nQuando ativado, qualquer número enviado no canal configurado gera automaticamente a imagem de cálculo de preços.` },
        { type: 14 },
        { type: 10, content: `**Status:** ${status ? `${Emojis.get(`checker`) || ``} Ativo` : `${Emojis.get(`negative`) || ``} Inativo`}\n**Canal Automático:** ${canal ? `<#${canal}>` : 'Não configurado'}` },
        { type: 14 },
        { type: 10, content: `**Como funciona:**\n> Alguém digita um número (ex: \`1500\`) no canal configurado\n> O bot automaticamente gera e envia a imagem da calculadora com os preços atuais` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: status ? 4 : 3,
                    label: status ? "Desativar Sistema" : "Ativar Sistema",
                    custom_id: "calc_toggle_status",
                    emoji: { id: status ? "1387981760649756782" : "1387981762050920548" }
                },
                { type: 2, style: 2, label: "Configurar Canal", custom_id: "calc_config_canal", emoji: { id: "1178086608004722689" } }
            ]
        }
    ).with({ flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

module.exports = {
    perguntarTipoCalculadora,
    gerarEmbedCalculadora,
    gerarImagemCalculadoraReply,
    gerarImagemCalculadora,
    calcularPrecos,
    formatBRL,
    painelCalculadora
};