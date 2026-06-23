const {
    ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder,
    TextInputStyle, StringSelectMenuBuilder, EmbedBuilder,
    ChannelType, PermissionFlagsBits
} = require("discord.js");
const { res } = require("../res");
const { JsonDatabase } = require("../database/jsondb");
const { v4: uuidv4 } = require("uuid");

const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };


function safeEmoji(emojiStr) {
    if (!emojiStr || emojiStr === '') return undefined;
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    if (/^[^\s]{1,30}$/.test(emojiStr)) return { name: emojiStr };
    return undefined;
}

function applyEmoji(btn, emojiKey) {
    const obj = safeEmoji(Emojis.get(emojiKey));
    if (obj) btn.setEmoji(obj);
    return btn;
}

const gamepassJogos = new JsonDatabase({ databasePath: "./database/gamepassJogos.json" });
const robuxConfig = new JsonDatabase({ databasePath: "./database/configuracaorobux.json" });
const carrinhosJogo = new JsonDatabase({ databasePath: "./database/carrinhosJogo.json" });

async function getUniverseInfo(universeId) {
    try {
        const r = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
        const data = await r.json();
        if (data.data && data.data.length > 0) {
            const game = data.data[0];
            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png`);
            const thumbData = await thumbRes.json();
            const icon = thumbData.data?.[0]?.imageUrl || null;
            return { id: universeId, name: game.name, creator: game.creator?.name, icon };
        }
        return null;
    } catch (e) { return null; }
}


async function painelGamepassJogos(interaction) {
    const jogos = gamepassJogos.fetchAll() || [];

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId("voltar_robux_painel").setLabel('Voltar').setStyle(2), '_back_emoji')
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > WinnBuxx > Produtos de Jogos Roblox` },
        { type: 14 },
        { type: 10, content: `**Sistema de Produtos por Jogo**\nCadastre jogos, crie **categorias** e **produtos** personalizados, envie painéis em canais diferentes e gere **carrinhos automáticos** para os compradores.` },
        { type: 14 },
        { type: 10, content: `> ${Emojis.get('caixagrande') || ''} **Jogos Cadastrados:** \`${jogos.length}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: "Adicionar Jogo", custom_id: "gpj_adicionar_jogo", emoji: { id: "1178067873894236311" } },
                { type: 2, style: 2, label: "Gerenciar Jogos", custom_id: "gpj_gerenciar_jogos", emoji: { id: "1178067945855910078" } },
                { type: 2, style: 2, label: "Enviar Painel", custom_id: "gpj_enviar_mensagem", emoji: { id: "1178076954029731930" } },
                ...(safeEmoji(Emojis.get('codigocopia')) ? [{ type: 2, style: 2, label: "Logs", custom_id: "gpj_logs", emoji: safeEmoji(Emojis.get('codigocopia')) }] : [{ type: 2, style: 2, label: "Logs", custom_id: "gpj_logs" }])
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(containerContent);
    else await interaction.update(containerContent);
}


async function modalAdicionarJogo(interaction) {
    const modal = new ModalBuilder().setCustomId('gpj_modal_add_jogo').setTitle('Adicionar Jogo do Roblox');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('jogo_nome').setLabel('Nome do Jogo').setPlaceholder('Ex: Jailbreak, Blox Fruits...').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('jogo_universe_id').setLabel('Universe ID (opcional)').setPlaceholder('Ex: 606849621 — deixe vazio se não souber').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(20)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalAdicionarJogo(interaction) {
    const nome = interaction.fields.getTextInputValue('jogo_nome').trim();
    const universeIdRaw = interaction.fields.getTextInputValue(`jogo_universe_id`).trim();
    await interaction.deferReply({ flags: 64 });

    const universeId = universeIdRaw && !isNaN(universeIdRaw) ? universeIdRaw : `custom_${Date.now()}`;
    const jogoKey = `jogo_${universeId}`;
    if (gamepassJogos.get(jogoKey)) {
        return interaction.editReply({ content: `${Emojis.get('negative') ||''} | Já existe um jogo com o ID \`${universeId}\`.` });
    }

    gamepassJogos.set(jogoKey, {
        id: universeId, nome, criador: null, icone: null,
        produtos: [], categorias: [], paineis: [], criadoEm: Date.now()
    });
    await interaction.editReply({ content: `${Emojis.get('checker') || ''} | Jogo **${nome}** adicionado! Use "Gerenciar Jogos" para criar categorias e produtos.` });
}


async function painelGerenciarJogos(interaction) {
    const jogos = gamepassJogos.fetchAll() || [];
    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId("gpj_painel_main").setLabel('Voltar').setStyle(2), '_back_emoji')
    );

    if (jogos.length === 0) {
        const c = res.main({ type: 10, content: `-# Painel > Jogos > Gerenciar` }, { type: 14 }, { type: 10, content: `${Emojis.get('negative') || ''} Nenhum jogo cadastrado ainda.` })
            .with({ components: [rowVoltar], flags: [64] });
        return interaction.deferred || interaction.replied ? interaction.editReply(c) : interaction.update(c);
    }

    const options = jogos.slice(0, 25).map(j => ({
        label: (j.data?.nome || `Sem nome`).slice(0, 25),
        description: `${(j.data?.categorias || []).length} cat. | ${(j.data?.produtos || []).length} prod.`,
        value: `jogo_${j.data?.id || j.key}`,
        emoji: { id: "1459388854715940968" }
    }));

    const c = res.main(
        { type: 10, content: `-# Painel > Jogos > Gerenciar` }, { type: 14 },
        { type: 10, content: `**Jogos Cadastrados**\nSelecione um jogo para gerenciar.` }, { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "gpj_select_jogo", placeholder: "Selecione um jogo", options }] }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}


async function painelJogo(interaction, jogoKey) {
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') || ''} | Jogo não encontrado!`, flags: 64 });

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId("gpj_gerenciar_jogos").setLabel('Voltar').setStyle(2), '_back_emoji')
    );

    const totalProd = (jogo.produtos || []).length;
    const ativos = (jogo.produtos || []).filter(p => p.status).length;
    const totalCat = (jogo.categorias || []).length;
    const totalPaineis = (jogo.paineis || []).length;

    const c = res.main(
        { type: 10, content: `-# Painel > Jogos > ${jogo.nome}` }, { type: 14 },
        ...(jogo.icone ? [{ type: 12, items: [{ media: { url: jogo.icone }, spoiler: false }] }] : []),
        { type: 10, content: `**${jogo.nome}**\n> Universe ID: \`${jogo.id}\`\n> Categorias: \`${totalCat}\` | Produtos: \`${totalProd}\` (${ativos} ativos) | Painéis: \`${totalPaineis}\`` },
        { type: 14 },
        {
            type: 1, components: [
                { type: 2, style: 1, label: "Categorias", custom_id: `gpj_categorias_${jogo.id}`, emoji: { id: "1178067873894236311" } },
                { type: 2, style: 2, label: "Produtos", custom_id: `gpj_ver_produtos_${jogo.id}`, emoji: { id: "1178067945855910078" } },
                { type: 2, style: 2, label: "Enviar Painel", custom_id: `gpj_enviar_jogo_${jogo.id}`, emoji: { id: "1178076954029731930" } },
                { type: 2, style: 4, label: "Remover Jogo", custom_id: `gpj_remover_jogo_${jogo.id}`, emoji: { id: "1178076767567757312" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}


async function painelCategorias(interaction, universeId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const categorias = jogo.categorias || [];
    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId(`gpj_jogo_${universeId}`).setLabel(`Voltar`).setStyle(2), '_back_emoji')
    );

    const listaText = categorias.length === 0 ? `> Nenhuma categoria criada ainda.`
        : categorias.map((c, i) => `> **${i + 1}. ${c.emoji || Emojis.get('caixagrande') ||''} ${c.nome}** \`(${(jogo.produtos || []).filter(p => p.categoriaId === c.id).length} prod.)\``).join(`\n`);

    const rows = [rowVoltar];
    if (categorias.length > 0) {
        rows.unshift(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('gpj_select_cat').setPlaceholder(`Selecione uma categoria para remover ou gerenciar`)
                .addOptions(categorias.slice(0, 25).map(c => ({
                    label: `${c.nome}`.slice(0, 25),
                    description: `${(jogo.produtos || []).filter(p => p.categoriaId === c.id).length} produto(s)`,
                    value: `gpj_cat_${universeId}|||${c.id}`,
                    emoji: c.emoji ? undefined : { id: "1459388854715940968" }
                })))
        ));
    }

    const c = res.main(
        { type: 10, content: `-# ${jogo.nome} > Categorias` }, { type: 14 },
        { type: 10, content: `**Categorias do Jogo**\n${listaText}` }, { type: 14 },
        { type: 1, components: [{ type: 2, style: 1, label: "Nova Categoria", custom_id: `gpj_add_cat_${universeId}`, emoji: { id: "1178067873894236311" } }] }
    ).with({ components: rows, flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}

async function modalCriarCategoria(interaction, universeId) {
    const modal = new ModalBuilder().setCustomId(`gpj_modal_cat_${universeId}`).setTitle(`Nova Categoria`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cat_nome').setLabel('Nome da Categoria').setPlaceholder('Ex: Frutas, Gamepasses...').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cat_emoji').setLabel('Emoji (opcional)').setPlaceholder('Ex:  ou ID do emoji').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalCriarCategoria(interaction, universeId) {
    const nome = interaction.fields.getTextInputValue('cat_nome').trim();
    const emoji = interaction.fields.getTextInputValue(`cat_emoji`).trim();
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const categorias = jogo.categorias || [];
    categorias.push({ id: uuidv4(), nome, emoji });
    gamepassJogos.set(`${jogoKey}.categorias`, categorias);
    await painelCategorias(interaction, universeId);
}

async function removerCategoria(interaction, universeId, catId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const categorias = (jogo.categorias || []).filter(c => c.id !== catId);
    const produtos = (jogo.produtos || []).map(p => p.categoriaId === catId ? { ...p, categoriaId: null } : p);
    gamepassJogos.set(`${jogoKey}.categorias`, categorias);
    gamepassJogos.set(`${jogoKey}.produtos`, produtos);
    await painelCategorias(interaction, universeId);
}

async function painelGerenciarCategoria(interaction, universeId, catId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const cat = (jogo.categorias || []).find(c => c.id === catId);
    if (!cat) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Categoria não encontrada!`, flags: 64 });

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId(`gpj_categorias_${universeId}`).setLabel(`Voltar`).setStyle(2), '_back_emoji')
    );

    const c = res.main(
        { type: 10, content: `-# ${jogo.nome} > Categoria > ${cat.nome}` }, { type: 14 },
        { type: 10, content: `**Gerenciar Categoria**\n> Nome: \`${cat.nome}\`\n> Emoji: \`${cat.emoji || `Nenhum`}\`` }, { type: 14 },
        {
            type: 1, components: [
                { type: 2, style: 1, label: "Adicionar Produto", custom_id: `gpj_add_prod_cat_${universeId}|||${cat.id}`, emoji: { id: "1178067873894236311" } },
                { type: 2, style: 4, label: "Remover Categoria", custom_id: `gpj_remover_cat_${universeId}|||${cat.id}`, emoji: { id: "1178076767567757312" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}


async function painelVerProdutos(interaction, universeId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const produtos = jogo.produtos || [];
    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId(`gpj_jogo_${universeId}`).setLabel(`Voltar`).setStyle(2), '_back_emoji')
    );

    const rows = [rowVoltar];
    if (produtos.length > 0) {
        rows.unshift(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('gpj_select_produto').setPlaceholder(`Selecione um produto para gerenciar`)
                .addOptions(produtos.slice(0, 25).map(p => ({
                    label: `${p.nome}`.slice(0, 25),
                    description: `R$ ${parseFloat(p.preco).toFixed(2)} - ${p.status ? `Ativo` : `Inativo`}`,
                    value: `gpj_prod_${universeId}|||${p.id}`,
                    emoji: { id: "1459388854715940968" }
                })))
        ));
    }

    const c = res.main(
        { type: 10, content: `-# ${jogo.nome} > Produtos` }, { type: 14 },
        { type: 10, content: `**Produtos do Jogo**\nTotal: \`${produtos.length}\`` }, { type: 14 },
        { type: 1, components: [{ type: 2, style: 1, label: "Novo Produto", custom_id: `gpj_criar_produto_${universeId}`, emoji: { id: "1178067873894236311" } }] }
    ).with({ components: rows, flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}

async function modalCriarProduto(interaction, universeId, catId = null) {
    const modal = new ModalBuilder().setCustomId(catId ? `gpj_modal_criar_produto_cat_${universeId}|||${catId}` : `gpj_modal_criar_produto_${universeId}`).setTitle(`Novo Produto`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_nome').setLabel('Nome do Produto').setPlaceholder('Ex: Dragon Fruit, VIP...').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_preco').setLabel('Preço (BRL)').setPlaceholder('Ex: 10.00').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_tipo').setLabel('Tipo (Ex: Gamepass, Item, Fruta)').setPlaceholder('Ex: Gamepass').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalCriarProduto(interaction, universeId, catId = null) {
    const nome = interaction.fields.getTextInputValue('prod_nome').trim();
    const preco = interaction.fields.getTextInputValue('prod_preco').trim().replace(',', '.');
    const tipo = interaction.fields.getTextInputValue(`prod_tipo`).trim();

    if (isNaN(preco)) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Preço inválido!`, flags: 64 });

    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const produtos = jogo.produtos || [];
    produtos.push({ id: uuidv4(), nome, preco: parseFloat(preco), tipo, categoriaId: catId, status: true, criadoEm: Date.now() });
    gamepassJogos.set(`${jogoKey}.produtos`, produtos);

    if (catId) await painelGerenciarCategoria(interaction, universeId, catId);
    else await painelVerProdutos(interaction, universeId);
}

async function painelProduto(interaction, universeId, produtoId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const prod = (jogo.produtos || []).find(p => p.id === produtoId);
    if (!prod) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Produto não encontrado!`, flags: 64 });

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId(`gpj_ver_produtos_${universeId}`).setLabel(`Voltar`).setStyle(2), '_back_emoji')
    );

    const c = res.main(
        { type: 10, content: `-# ${jogo.nome} > Produto > ${prod.nome}` }, { type: 14 },
        { type: 10, content: `**Gerenciar Produto**\n> Nome: \`${prod.nome}\`\n> Preço: \`R$ ${parseFloat(prod.preco).toFixed(2)}\`\n> Tipo: \`${prod.tipo}\`\n> Status: \`${prod.status ? `Ativo` : `Inativo`}\`` }, { type: 14 },
        {
            type: 1, components: [
                { type: 2, style: 2, label: "Editar", custom_id: `gpj_editar_prod_${universeId}|||${prod.id}`, emoji: { id: "1178067945855910078" } },
                { type: 2, style: prod.status ? 2 : 3, label: prod.status ? "Desativar" : "Ativar", custom_id: `gpj_toggle_prod_${universeId}_${prod.id}`, emoji: { id: "1178076954029731930" } },
                { type: 2, style: 4, label: "Excluir", custom_id: `gpj_excluir_prod_${universeId}_${prod.id}`, emoji: { id: "1178076767567757312" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}

async function modalEditarProduto(interaction, universeId, produtoId) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    const prod = (jogo.produtos || []).find(p => p.id === produtoId);

    const modal = new ModalBuilder().setCustomId(`gpj_modal_edit_produto_${universeId}|||${produtoId}`).setTitle(`Editar Produto`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_nome').setLabel('Nome do Produto').setValue(prod.nome).setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_preco').setLabel('Preço (BRL)').setValue(prod.preco.toString()).setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('prod_tipo').setLabel('Tipo').setValue(prod.tipo).setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalEditarProduto(interaction, universeId, produtoId) {
    const nome = interaction.fields.getTextInputValue('prod_nome').trim();
    const preco = interaction.fields.getTextInputValue('prod_preco').trim().replace(',', '.');
    const tipo = interaction.fields.getTextInputValue(`prod_tipo`).trim();

    if (isNaN(preco)) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Preço inválido!`, flags: 64 });

    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    const produtos = jogo.produtos || [];
    const idx = produtos.findIndex(p => p.id === produtoId);
    if (idx !== -1) {
        produtos[idx] = { ...produtos[idx], nome, preco: parseFloat(preco), tipo };
        gamepassJogos.set(`${jogoKey}.produtos`, produtos);
    }
    await painelProduto(interaction, universeId, produtoId);
}


async function modalEnviarPainelJogo(interaction, universeId) {
    const modal = new ModalBuilder().setCustomId(`gpj_modal_enviar_jogo_${universeId}`).setTitle(`Enviar Painel do Jogo`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal').setPlaceholder(`Insira o ID do canal onde o painel será enviado`).setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function enviarPainelJogoNoCanal(interaction, universeId, canalId, client) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    const produtosAtivos = (jogo.produtos || []).filter(p => p.status);
    if (produtosAtivos.length === 0) return false;

    const canal = client.channels.cache.get(canalId);
    if (!canal) return false;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`comprar_jogo_btn_${universeId}`).setLabel(`Comprar`).setEmoji({ id: "1459388854715940968" }).setStyle(1)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Loja > ${jogo.nome}` },
        { type: 14 },
        ...(jogo.icone ? [{ type: 12, items: [{ media: { url: jogo.icone }, spoiler: false }] }] : []),
        { type: 10, content: `**${jogo.nome}**\nBem-vindo à loja de **${jogo.nome}**!\nSelecione uma categoria abaixo para iniciar sua compra.` },
        { type: 14 },
        { type: 10, content: `WinnBuxx - Qualidade e Segurança` }
    ).with({ components: [row] });

    await canal.send(containerContent);
    return true;
}

async function modalEnviarMensagemJogos(interaction) {
    const modal = new ModalBuilder().setCustomId('gpj_modal_enviar_msg').setTitle('Enviar Painel Geral de Jogos');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('canal_id').setLabel('ID do Canal').setPlaceholder('Insira o ID do canal onde o painel será enviado').setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function enviarMensagemJogos(interaction, canalId, client) {
    const jogos = gamepassJogos.fetchAll() || [];
    const jogosAtivos = jogos.filter(j => (j.data.produtos || []).some(p => p.status));
    if (jogosAtivos.length === 0) return null;

    const canal = client.channels.cache.get(canalId);
    if (!canal) return false;

    const options = jogosAtivos.map(j => ({
        label: j.data.nome.slice(0, 25),
        description: `Ver produtos de ${j.data.nome}`,
        value: `comprar_jogo_${j.data.id}`,
        emoji: { id: "1459388854715940968" }
    }));

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('comprar_jogo_select').setPlaceholder(`Selecione um jogo para comprar`).addOptions(options.slice(0, 25))
    );

    const containerContent = res.main(
        { type: 10, content: `-# Loja > Jogos Roblox` },
        { type: 14 },
        { type: 10, content: `**Loja de Jogos Roblox**\nSelecione um dos jogos abaixo para ver os produtos disponíveis.` },
        { type: 14 },
        { type: 10, content: `WinnBuxx - Qualidade e Segurança` }
    ).with({ components: [row] });

    await canal.send(containerContent);
    return true;
}


async function painelComprarJogo(interaction, universeId, client) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const categorias = jogo.categorias || [];
    const produtosAtivos = (jogo.produtos || []).filter(p => p.status);

    if (produtosAtivos.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative') || ''} | Este jogo não possui produtos disponíveis.`, flags: 64 });
    }

    if (categorias.length > 0) {
        const catsComProdutos = categorias.filter(c => produtosAtivos.some(p => p.categoriaId === c.id));
        const semCategoria = produtosAtivos.filter(p => !p.categoriaId);
        const options = [
            ...catsComProdutos.map(c => ({
                label: `${c.nome}`.slice(0, 25),
                description: `${produtosAtivos.filter(p => p.categoriaId === c.id).length} produto(s)`,
                value: `cat_jogo_${universeId}|||${c.id}`,
                emoji: c.emoji ? (c.emoji.includes(':') ? { id: c.emoji.split(':')[2].replace('>', '') } : { name: c.emoji }) : { id: "1459388854715940968" }
            })),
            ...(semCategoria.length > 0 ? [{ label: `Outros`, description: `${semCategoria.length} produto(s)`, value: `cat_jogo_${universeId}|||sem_cat`, emoji: { id: "1459388854715940968" } }] : [])
        ];

        const c = res.main(
            { type: 10, content: `-# Loja > ${jogo.nome}` }, { type: 14 },
            ...(jogo.icone ? [{ type: 12, items: [{ media: { url: jogo.icone }, spoiler: false }] }] : []),
            { type: 10, content: `**${jogo.nome}**\n> Selecione uma categoria abaixo:` }, { type: 14 },
            { type: 1, components: [{ type: 3, custom_id: "comprar_cat_select", placeholder: "Selecione uma categoria", options: options.slice(0, 25) }] }
        ).with({ components: [], flags: [64] });

        return interaction.deferred || interaction.replied ? interaction.editReply(c) : interaction.reply(c);
    }

    const selectOptions = produtosAtivos.slice(0, 25).map(p => ({
        label: p.nome.slice(0, 25),
        description: `R$ ${parseFloat(p.preco).toFixed(2)} - ${p.tipo}`,
        value: `comprar_produto_jogo_${universeId}|||${p.id}`,
        emoji: { id: "1459388854715940968" }
    }));

    const c = res.main(
        { type: 10, content: `-# Loja > ${jogo.nome}` }, { type: 14 },
        ...(jogo.icone ? [{ type: 12, items: [{ media: { url: jogo.icone }, spoiler: false }] }] : []),
        { type: 10, content: `**${jogo.nome}**\n> ${produtosAtivos.length} produto(s) disponível(is)` }, { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "comprar_produto_select", placeholder: "Selecione um produto", options: selectOptions }] }
    ).with({ components: [], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.reply(c);
}

async function painelCategoriaPublica(interaction, universeId, catId, client) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') || ''} | Jogo não encontrado!`, flags: 64 });

    const cat = (jogo.categorias || []).find(c => c.id === catId);
    const catNome = cat ? cat.nome : 'Outros';
    const produtosAtivos = (jogo.produtos || []).filter(p => p.status && (catId === `sem_cat` ? !p.categoriaId : p.categoriaId === catId));

    if (produtosAtivos.length === 0) {
        return interaction.reply({ content: `${Emojis.get('negative') ||''} | Nenhum produto disponível nesta categoria.`, flags: 64 });
    }

    const selectOptions = produtosAtivos.slice(0, 25).map(p => ({
        label: p.nome.slice(0, 25),
        description: `R$ ${parseFloat(p.preco).toFixed(2)} - ${p.tipo}`,
        value: `comprar_produto_jogo_${universeId}|||${p.id}`,
        emoji: { id: "1459388854715940968" }
    }));

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId(`comprar_voltar_jogo_${universeId}`).setLabel(`Voltar`).setStyle(2), '_back_emoji')
    );

    const c = res.main(
        { type: 10, content: `-# ${jogo.nome} > ${catNome}` }, { type: 14 },
        { type: 10, content: `**${catNome}**\n> ${produtosAtivos.length} produto(s) disponível(is)\n\nSelecione o produto abaixo:` }, { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "comprar_produto_select", placeholder: "Selecione um produto", options: selectOptions }] }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}


const LOG_TIPOS = {
    carrinho_criado:     { label: 'Carrinho Criado',          emoji: Emojis.get('_cart_emoji') || '', cor: '#5865F2' },
    compra_cancelada:    { label: 'Compra Cancelada',         emoji: Emojis.get('negative') || '', cor: '#ff4444' },
    pagamento_efetuado:  { label: 'Pagamento Efetuado',       emoji: Emojis.get('dinheiro') || '', cor: '#00cc44' },
    compra_publica:      { label: 'Compras Realizadas (Público)', emoji: Emojis.get('star') || '', cor: '#ffd700' },
};

async function painelLogsJogos(interaction) {
    const cfg = gamepassJogos.get(`_logs_config`) || {};
    const linhas = Object.entries(LOG_TIPOS).map(([key, info]) =>
        `${info.emoji} **${info.label}:** ${cfg[key] ? `<#${cfg[key]}>` : 'Não definido'}`
    ).join('\n');

    const rowVoltar = new ActionRowBuilder().addComponents(
        applyEmoji(new ButtonBuilder().setCustomId('gpj_painel_main').setLabel('Voltar').setStyle(2), '_back_emoji')
    );

    const c = res.main(
        { type: 10, content: `-# Painel > WinnBuxx > Jogos Roblox > Logs` },
        { type: 14 },
        { type: 10, content: `**Sistema de Logs de Jogos**\nDefina um canal para cada tipo de notificação. Deixe em branco para desativar.` },
        { type: 14 },
        { type: 10, content: linhas },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: 'Carrinho Criado', custom_id: 'gpj_log_set_carrinho_criado', ...(safeEmoji(Emojis.get('_cart_emoji')) ? { emoji: safeEmoji(Emojis.get('_cart_emoji')) } : {}) },
                { type: 2, style: 1, label: 'Compra Cancelada', custom_id: 'gpj_log_set_compra_cancelada', ...(safeEmoji(Emojis.get('negative')) ? { emoji: safeEmoji(Emojis.get('negative')) } : {}) },
                { type: 2, style: 1, label: 'Pagamento Efetuado', custom_id: 'gpj_log_set_pagamento_efetuado', ...(safeEmoji(Emojis.get('dinheiro')) ? { emoji: safeEmoji(Emojis.get('dinheiro')) } : {}) },
                { type: 2, style: 1, label: 'Compras Públicas', custom_id: 'gpj_log_set_compra_publica', ...(safeEmoji(Emojis.get('star')) ? { emoji: safeEmoji(Emojis.get('star')) } : {}) },
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 4, label: 'Limpar Carrinho Criado', custom_id: 'gpj_log_clear_carrinho_criado' },
                { type: 2, style: 4, label: 'Limpar Cancelada', custom_id: 'gpj_log_clear_compra_cancelada' },
                { type: 2, style: 4, label: 'Limpar Pagamento', custom_id: 'gpj_log_clear_pagamento_efetuado' },
                { type: 2, style: 4, label: 'Limpar Público', custom_id: 'gpj_log_clear_compra_publica' },
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) await interaction.editReply(c);
    else await interaction.update(c);
}

async function modalLogChannel(interaction, tipo) {
    const info = LOG_TIPOS[tipo];
    const modal = new ModalBuilder()
        .setCustomId(`gpj_modal_log_${tipo}`)
        .setTitle(`Log: ${info ? info.label : tipo}`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('log_canal_id')
                .setLabel('ID do Canal')
                .setPlaceholder('Cole aqui o ID do canal onde os logs serão enviados')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(20)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalLogChannel(interaction, tipo) {
    const canalId = interaction.fields.getTextInputValue(`log_canal_id`).trim();
    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal) {
        return interaction.reply({ content: `${Emojis.get('negative')||''} Canal não encontrado com o ID \`${canalId}\`. Copie o ID do canal corretamente.`, flags: 64 });
    }
    const cfg = gamepassJogos.get('_logs_config') || {};
    cfg[tipo] = canalId;
    gamepassJogos.set('_logs_config', cfg);
    await interaction.deferUpdate();
    return painelLogsJogos(interaction);
}

async function enviarLogJogo(client, tipo, dados) {
    try {
        const cfg = gamepassJogos.get('_logs_config') || {};
        const canalId = cfg[tipo];
        if (!canalId) return;

        const canal = await client.channels.fetch(canalId).catch(() => null);
        if (!canal) return;

        const info = LOG_TIPOS[tipo] || { cor: '#2b2d31', emoji: Emojis.get('codigocopia') || '', label: tipo };
        let embed;

        if (tipo === 'carrinho_criado') {
            embed = new EmbedBuilder()
                .setColor(info.cor)
                .setTitle(`${info.emoji} Carrinho de Jogo Criado`)
                .addFields(
                    { name: `${Emojis.get('user')||''} Comprador`, value: `<@${dados.userId}> (\`${dados.userTag}\`)`, inline: true },
                    { name: `${Emojis.get('controller')||''} Produto`, value: `\`${dados.nome}\``, inline: true },
                    { name: `${Emojis.get('dinheiro')||''} Preço`, value: `\`R$ ${Number(dados.preco).toFixed(2)}\``, inline: true },
                    { name: `${Emojis.get('link')||''} Tópico`, value: dados.threadId ? `<#${dados.threadId}>` : `—`, inline: true }
                )
                .setTimestamp();
        } else if (tipo === 'compra_cancelada') {
            embed = new EmbedBuilder()
                .setColor(info.cor)
                .setTitle(`${info.emoji} Compra Cancelada`)
                .addFields(
                    { name: `${Emojis.get('user')||''} Comprador`, value: `<@${dados.userId}> (\`${dados.userTag}\`)`, inline: true },
                    { name: `${Emojis.get('controller')||''} Produto`, value: `\`${dados.nome || `Desconhecido`}\``, inline: true },
                    { name: `${Emojis.get('dinheiro')||''} Valor`, value: `\`R$ ${Number(dados.preco || 0).toFixed(2)}\``, inline: true }
                )
                .setTimestamp();
        } else if (tipo === 'pagamento_efetuado') {
            embed = new EmbedBuilder()
                .setColor(info.cor)
                .setTitle(`${info.emoji} Pagamento Efetuado`)
                .addFields(
                    { name: `${Emojis.get('user')||''} Comprador`, value: `<@${dados.userId}> (\`${dados.userTag}\`)`, inline: true },
                    { name: `${Emojis.get('controller')||''} Produto`, value: `\`${dados.nome}\``, inline: true },
                    { name: '🔢 Quantidade', value: `\`${dados.quantidade}x\``, inline: true },
                    { name: `${Emojis.get('dinheiro')||''} Valor Pago`, value: `\`R$ ${Number(dados.valor).toFixed(2)}\``, inline: true },
                    { name: `${Emojis.get('codigocopia')||''} Pedido`, value: `\`#${dados.pedidoId}\``, inline: true }
                )
                .setTimestamp();
        } else if (tipo === 'compra_publica') {
            embed = new EmbedBuilder()
                .setColor(info.cor)
                .setTitle(`${info.emoji} Nova Compra Realizada!`)
                .setDescription('Um membro acabou de realizar uma compra no servidor!')
                .addFields(
                    { name: `${Emojis.get('controller')||''} Produto`, value: `\`${dados.nome}\``, inline: true },
                    { name: '🔢 Quantidade', value: `\`${dados.quantidade}x\``, inline: true },
                    { name: `${Emojis.get('dinheiro')||''} Valor`, value: `\`R$ ${Number(dados.valor).toFixed(2)}\``, inline: true }
                )
                .setTimestamp();
        }

        if (embed) await canal.send({ embeds: [embed] });
    } catch (e) {}
}

async function criarCarrinhoJogo(interaction, universeId, produtoId, client) {
    const { CreateCarrinho } = require("./CreateCarrinho");
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) return interaction.reply({ content: `${Emojis.get('negative') ||''} | Jogo não encontrado!`, flags: 64 });

    const produto = (jogo.produtos || []).find(p => p.id === produtoId && p.status);
    if (!produto) return interaction.reply({ content: `${Emojis.get('negative') || ''} | Produto indisponível!`, flags: 64 });

    const infosAdaptadas = {
        produto: `GAME_${universeId}`,
        nome: produto.nome,
        preco: parseFloat(produto.preco),
        valor: parseFloat(produto.preco),
        estoque: 999,
        campo: produto.nome,
        tipo: "jogo",
        universeId: universeId,
        produtoId: produtoId
    };

    return CreateCarrinho(interaction, infosAdaptadas);
}

module.exports = {
    painelGamepassJogos, modalAdicionarJogo, handleModalAdicionarJogo,
    painelGerenciarJogos, painelJogo,
    painelCategorias, modalCriarCategoria, handleModalCriarCategoria, removerCategoria,
    painelGerenciarCategoria, modalEditarProduto, handleModalEditarProduto,
    modalCriarProduto, handleModalCriarProduto,
    painelVerProdutos, painelProduto,
    modalEnviarPainelJogo, enviarPainelJogoNoCanal,
    modalEnviarMensagemJogos, enviarMensagemJogos,
    painelComprarJogo, painelCategoriaPublica,
    criarCarrinhoJogo, gamepassJogos,
    painelLogsJogos, modalLogChannel, handleModalLogChannel, enviarLogJogo,
};