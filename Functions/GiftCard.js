const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { JsonDatabase } = require("../database/jsondb");
const { res } = require("../res");
const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

const giftcards = new JsonDatabase({ databasePath: "./database/giftcards.json" });


function gerarCodigo(prefixo = 'GIFT') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = prefixo + '-';
    for (let i = 0; i < 4; i++) {
        let part = '';
        for (let j = 0; j < 4; j++) {
            part += chars[Math.floor(Math.random() * chars.length)];
        }
        codigo += part + (i < 3 ? '-' : '');
    }
    return codigo;
}


async function painelGiftCard(interaction) {
    const todos = giftcards.fetchAll() || [];
    const ativos = todos.filter(g => g.data.ativo && g.data.usosAtual < g.data.limiteUsos);

    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId("voltar00").setLabel('Voltar').setStyle(2); const e = Emojis.get('_back_emoji'); if (e) b.setEmoji(e); return b; })()
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Gift Cards` },
        { type: 14 },
        { type: 10, content: `**Sistema de Gift Cards**\nCrie códigos com recompensas personalizadas para seus membros!` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get(`codigo`) || Emojis.get('gift') || ``} **Gift Cards Ativos:** \`${ativos.length}\`\n> ${Emojis.get(`caixagrande`) || ''} **Total Criados:** \`${todos.length}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: "Criar Gift Card", custom_id: "gc_criar", emoji: { id: "1178076508150059019" } },
                { type: 2, style: 2, label: "Listar Gift Cards", custom_id: "gc_listar", emoji: { id: "1178066208835252266" } },
                { type: 2, style: 4, label: "Limpar Expirados", custom_id: "gc_limpar", emoji: { id: "1178076767567757312" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}


async function modalCriarGiftCard(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('gc_modal_criar')
        .setTitle('Criar Gift Card');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('gc_codigo')
                .setLabel('Código (deixe vazio para gerar automático)')
                .setPlaceholder('Ex: PROMO2025 (sem espaços)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(30)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('gc_recompensa')
                .setLabel('Recompensa (texto entregue ao resgatar)')
                .setPlaceholder('Ex: Desconto de 10% na próxima compra! Código: DESC10')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(500)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('gc_limite')
                .setLabel('Limite de Usos')
                .setPlaceholder('Ex: 1 para uso único, 100 para 100 usos')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(6)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('gc_descricao')
                .setLabel('Descrição (aparece no painel admin)')
                .setPlaceholder('Ex: Gift card de boas vindas')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(100)
        )
    );

    await interaction.showModal(modal);
}


async function handleModalCriarGiftCard(interaction) {
    let codigo = interaction.fields.getTextInputValue('gc_codigo').trim().toUpperCase();
    const recompensa = interaction.fields.getTextInputValue('gc_recompensa').trim();
    const limiteStr = interaction.fields.getTextInputValue('gc_limite').trim();
    const descricao = interaction.fields.getTextInputValue(`gc_descricao`).trim();

    const limite = parseInt(limiteStr);
    if (isNaN(limite) || limite < 1) {
        return interaction.reply({ content: `${Emojis.get(`negative`) || ''} | Limite de usos inválido!`, flags: 64 });
    }

    if (!codigo) {
        codigo = gerarCodigo();
    } else {
        
        codigo = codigo.replace(/[^A-Z0-9\-]/g, ``);
    }

    
    const existente = giftcards.get(codigo);
    if (existente) {
        return interaction.reply({ content: `${Emojis.get(`negative`) || ''} | O código \`${codigo}\` já existe!`, flags: 64 });
    }

    giftcards.set(codigo, {
        codigo,
        recompensa,
        limiteUsos: limite,
        usosAtual: 0,
        usados: [],
        descricao: descricao || `Gift Card`,
        ativo: true,
        criadoEm: Date.now(),
        criadoPor: interaction.user.id
    });

    const containerContent = res.main(
        { type: 10, content: `${Emojis.get(`checker`) || ``} **Gift Card Criado com Sucesso!**` },
        { type: 14 },
        { type: 10, content: `**Código:** \`${codigo}\`\n**Limite de Usos:** \`${limite}\`\n**Descrição:** \`${descricao || `N/A`}\`` },
        { type: 10, content: `**Recompensa:**\n\`\`\`${recompensa}\`\`\`` },
        { type: 14 },
        { type: 10, content: `-# Compartilhe este código com seus membros para que eles possam resgatar a recompensa.` }
    ).with({ flags: [64] });

    await interaction.reply(containerContent);
}


async function listarGiftCards(interaction) {
    const todos = giftcards.fetchAll() || [];

    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId("gc_painel").setLabel('Voltar').setStyle(2); const e = Emojis.get('_back_emoji'); if (e) b.setEmoji(e); return b; })()
    );

    if (todos.length === 0) {
        const containerContent = res.main(
            { type: 10, content: `-# Painel > Gift Cards > Lista` },
            { type: 14 },
            { type: 10, content: `${Emojis.get(`negative`) || ''} Nenhum gift card criado ainda.` }
        ).with({ components: [rowVoltar], flags: [64] });

        return interaction.deferred || interaction.replied
            ? interaction.editReply(containerContent)
            : interaction.update(containerContent);
    }

    const lista = todos.slice(0, 15).map(g => {
        const gc = g.data;
        const statusEmoji = gc.ativo && gc.usosAtual < gc.limiteUsos
            ? (Emojis.get('checker') || Emojis.get('checker') || '')
            : (Emojis.get('negative') || Emojis.get('negative') || ``);
        return `> ${statusEmoji} \`${gc.codigo}\` — ${gc.usosAtual}/${gc.limiteUsos} usos — ${gc.descricao || `N/A`}`;
    }).join(`\n`);

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Gift Cards > Lista (${todos.length} total)` },
        { type: 14 },
        { type: 10, content: `**Gift Cards Criados**\n\n${lista}` }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}


async function resgatarGiftCard(interaction, codigo) {
    const codigoLimpo = codigo.trim().toUpperCase();
    const gc = giftcards.get(codigoLimpo);

    if (!gc) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Código \`${codigoLimpo}\` **não encontrado** ou inválido!`,
            flags: 64
        });
    }

    if (!gc.ativo) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Este gift card está **desativado**!`,
            flags: 64
        });
    }

    if (gc.usosAtual >= gc.limiteUsos) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Este gift card já **esgotou** todos os seus usos!`,
            flags: 64
        });
    }

    if (gc.usados.includes(interaction.user.id)) {
        return interaction.reply({
            content: `${Emojis.get(`negative`) || ``} | Você **já resgatou** este gift card!`,
            flags: 64
        });
    }

    
    gc.usosAtual += 1;
    gc.usados.push(interaction.user.id);
    giftcards.set(codigoLimpo, gc);

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get(`sucesso`) || Emojis.get('gift') || ``} Gift Card Resgatado!` },
        { type: 14 },
        { type: 10, content: `Parabéns ${interaction.user}! Seu gift card foi resgatado com sucesso.` },
        { type: 14 },
        { type: 10, content: `**Sua Recompensa:**\n\`\`\`${gc.recompensa}\`\`\`` },
        { type: 14 },
        { type: 10, content: `-# Código: ${codigoLimpo} | Usos restantes: ${gc.limiteUsos - gc.usosAtual}` }
    ).with({ flags: [64] });

    await interaction.reply(containerContent);
}


async function limparExpirados(interaction) {
    const todos = giftcards.fetchAll() || [];
    let removidos = 0;

    for (const g of todos) {
        if (!g.data.ativo || g.data.usosAtual >= g.data.limiteUsos) {
            giftcards.delete(g.ID);
            removidos++;
        }
    }

    await painelGiftCard(interaction);
    interaction.followUp({
        content: `${Emojis.get(`checker`) || ''} | ${removidos} gift card(s) expirado(s) removido(s).`,
        flags: 64
    });
}

module.exports = {
    painelGiftCard,
    modalCriarGiftCard,
    handleModalCriarGiftCard,
    listarGiftCards,
    resgatarGiftCard,
    limparExpirados,
    giftcards
};