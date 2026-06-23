const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js")
const { res } = require("../res")
const { Emojis, gamepassJogos } = require("../database")
const { JsonDatabase } = require("../database/jsondb");

const robuxConfig = new JsonDatabase({ databasePath: "./database/configuracaorobux.json" });
const carrinhosRobux = new JsonDatabase({ databasePath: "./database/carrinhosrobux.json" });
const mensagemRobux = new JsonDatabase({ databasePath: "./database/mensagemrobux.json" });


function resolveEmoji(emojiStr) {
    if (!emojiStr || emojiStr === '') return undefined;
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return undefined;
}


function calcPrecoSemTaxa(qty) {
    const v = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    return (qty / 1000) * v;
}
function calcPrecoComTaxa(qty) {
    
    return Math.ceil(calcPrecoSemTaxa(qty) / 0.75);
}
function calcPrecoGrupo(qty) {
    const v = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const vg = parseFloat(robuxConfig.get('config.valores.robuxGrupo')) || Math.ceil(v * 1.18);
    return (qty / 1000) * vg;
}


async function getRobloxUser(username) {
    try {
        const response = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
        });
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const user = data.data[0];
            const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png`);
            const avatarData = await avatarResponse.json();
            const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
            return { id: user.id, name: user.name, displayName: user.displayName, avatar: avatarUrl };
        }
        return null;
    } catch (e) { return null; }
}

async function getUserGamepasses(userId) {
    try {
        let allGamepasses = [];
        const minimoGamepass = parseInt(robuxConfig.get('config.limites.minimoGamepass')) || 0;
        const limiteGamepass = parseInt(robuxConfig.get('config.limites.gamepass')) || 1000000;
        const gamesResponse = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`);
        const gamesData = await gamesResponse.json();
        if (!gamesData.data || gamesData.data.length === 0) return [];
        for (const game of gamesData.data) {
            const placeId = game.rootPlace?.id;
            if (!placeId) continue;
            try {
                const universeResponse = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
                const universeData = await universeResponse.json();
                const universeId = universeData.universeId;
                if (!universeId) continue;
                const gamepassResponse = await fetch(`https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full`);
                const gamepassData = await gamepassResponse.json();
                const gamepasses = gamepassData.gamePasses || gamepassData.data || [];
                for (const gp of gamepasses) {
                    const price = gp.price;
                    if (gp.isForSale && price !== null && price !== undefined && price >= minimoGamepass && price <= limiteGamepass) {
                        const safeName = (gp.name || 'gamepass').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
                        allGamepasses.push({
                            id: gp.id, name: gp.name, price: price,
                            gameId: universeId, gameName: game.name,
                            url: `https://www.roblox.com/game-passes/${gp.id}/${safeName}`,
                            iconUrl: gp.iconImageAssetId ? `https://www.roblox.com/asset-thumbnail/image?assetId=${gp.iconImageAssetId}&width=150&height=150&format=png` : null
                        });
                    }
                }
            } catch (e) {}
        }
        return allGamepasses;
    } catch (e) { return []; }
}


async function criarCarrinhoRobux(interaction, tipo, client) {
    const statusRobux = robuxConfig.get('config.status') || false;
    const statusGamepass = robuxConfig.get('config.statusGamepass') || false;

    if (tipo === `comprar_robux` && !statusRobux)
        return interaction.reply({ content: `${Emojis.get('negative') || ''} | O sistema de **Robux** está desativado!`, flags: 64 });
    if (tipo === `comprar_gamepass` && !statusGamepass)
        return interaction.reply({ content: `${Emojis.get('negative') || ''} | O sistema de **Gamepass** está desativado!`, flags: 64 });

    const carrinhoExistente = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinhoExistente) {
        
        const canalExistente = interaction.guild.channels.cache.get(carrinhoExistente.channelId)
            || await interaction.guild.channels.fetch(carrinhoExistente.channelId).catch(() => null);
        if (canalExistente) return interaction.reply({ content: `${Emojis.get('negative') || ''} | Você já possui um carrinho aberto em <#${carrinhoExistente.channelId}>!`, flags: 64 });
        else carrinhosRobux.delete(`${interaction.user.id}`);
    }

    let _useFollowUp = false;
    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: 64 });
        } else {
            _useFollowUp = true;
        }
    } catch (e) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: `${Emojis.get('loading') || ''} | Aguarde, **Criando Carrinho...**`, flags: 64 });
                _useFollowUp = true;
            } else {
                _useFollowUp = true;
            }
        } catch (e2) {
            _useFollowUp = true;
        }
    }
    const _sendEphemeral = async (payload) => {
        const p = typeof payload === `string` ? { content: payload } : payload;
        try {
            if (_useFollowUp) return await interaction.followUp({ ...p, flags: 64 });
            return await interaction.editReply(p);
        } catch (e2) {
            try {
                if (!interaction.replied && !interaction.deferred) {
                    return await interaction.reply({ ...p, flags: 64 });
                }
            } catch (e3) {}
        }
    };
    await _sendEphemeral({ content: `${Emojis.get('loading') || ''} | Aguarde, **Criando Carrinho...**` });

    try {
        const categoriaId = robuxConfig.get('config.canais.categoriaCarrinhos');
        const tipoCompra = tipo === 'comprar_robux' ? 'robux' : `gamepass`;

        let parentId = null;
        if (categoriaId) {
            const catChannel = interaction.guild.channels.cache.get(categoriaId);
            if (catChannel) parentId = categoriaId;
        }

        const channel = await interaction.guild.channels.create({
            name: `🛒・${interaction.user.username}・${tipoCompra}`,
            type: ChannelType.GuildText,
            parent: parentId,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
            ]
        });

        const cfgCarrinho = mensagemRobux.get(`configCarrinho`) || {};
        const botNome = client.user.username;
        const welcomeTitle = cfgCarrinho.titulo || `${Emojis.get('_cart_emoji')||''} Bem-vindo(a) ao atendimento da ${botNome}!`;
        const welcomeDesc = cfgCarrinho.descricao || `<@${interaction.user.id}>, Seja bem-vindo(a) ao seu carrinho de compras!`;
        const { buildTermosText, buildSegurancaText } = require('./PainelRobux');
        const termos = buildTermosText(cfgCarrinho);
        const seguranca = buildSegurancaText(cfgCarrinho);

        const guildIconUrl = interaction.guild?.iconURL({ dynamic: true, size: 256 }) || null;
        const headerSection = guildIconUrl ? {
            type: 9,
            components: [
                { type: 10, content: welcomeTitle },
                { type: 10, content: welcomeDesc }
            ],
            accessory: { type: 11, media: { url: guildIconUrl }, spoiler: false }
        } : {
            type: 10, content: `${welcomeTitle}\n${welcomeDesc}`
        };

        const welcomeMsg = res.main(
            headerSection, { type: 14 },
            { type: 10, content: `${Emojis.get('negative')||''} **Segurança:**\n${seguranca}` }, { type: 14 },
            { type: 10, content: `${Emojis.get('checker')||''} Clique em **Iniciar Compra** para começar.\n${Emojis.get('information_emoji')||''} Use **Ler Termos** para ver os termos e condições.\n${Emojis.get('negative')||''} Use **Cancelar Compra** a qualquer momento para sair.` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 3, label: `Iniciar Compra`, custom_id: `robux_iniciar_compra_${tipoCompra}`, ...(resolveEmoji(Emojis.get('pix_stamp_emoji')) ? { emoji: resolveEmoji(Emojis.get('pix_stamp_emoji')) } : {}) },
                { type: 2, style: 2, label: 'Ler Termos', custom_id: 'robux_ler_termos', ...(resolveEmoji(Emojis.get('codigocopia')) ? { emoji: resolveEmoji(Emojis.get('codigocopia')) } : {}) },
                { type: 2, style: 4, label: 'Cancelar Compra', custom_id: 'robux_cancelar_compra', ...(resolveEmoji(Emojis.get('negative')) ? { emoji: resolveEmoji(Emojis.get('negative')) } : {}) }
            ]}
        );

        const msg = await channel.send({ ...welcomeMsg });

        carrinhosRobux.set(`${interaction.user.id}`, {
            channelId: channel.id, oderId: interaction.user.id, visão: tipoCompra,
            status: 'aguardando_nick', criadoEm: Date.now(),
            robloxUser: null, tipoTaxa: null, robuxFinal: null, robuxRecebe: null,
            gamepassSelecionado: null, valorFinal: null, messageId: msg.id
        });

        await enviarLogCompra(interaction.guild, 'iniciadas', {
            usuario: interaction.user, tipo: tipoCompra, canal: channel, acao: 'Carrinho Criado'
        });

        const rowLink = new ActionRowBuilder().addComponents(
            (() => { const b = new ButtonBuilder().setLabel(`Ir para o Carrinho`).setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`).setStyle(5); const e = Emojis.get('_link_emoji') || Emojis.get('link'); if (e) b.setEmoji(e); return b; })()
        );
        await _sendEphemeral({ content: `${Emojis.get('checker') || ''} | Carrinho criado com sucesso!`, components: [rowLink] });
    } catch (error) {
        console.error(`[CarrinhoRobux] Erro ao criar carrinho:`, error);
        await _sendEphemeral({ content: `${Emojis.get('negative') || ''} | Ocorreu um erro ao criar o carrinho!` });
    }
}


async function mostrarStepNick(interaction, tipo) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const nickTexto = cfgCarrinho.nickDescricao || `Olá! Para que você receba seus **Robux**, precisamos saber seu **UserName no Roblox**.\nNão pedimos senha nem dados pessoais, apenas seu User para encontrarmos seu perfil.\n\nClique no botão abaixo em **Inserir usuário** e, em seguida, escreva o seu usuário e aperte em **enviar**.`;
    const guildIconUrl = interaction.guild?.iconURL({ dynamic: true, size: 256 }) || null;
    const headerComp = guildIconUrl ? {
        type: 9,
        components: [
            { type: 10, content: `${Emojis.get('_cart_emoji')||''} **Informe seu Nome De Usuário no Roblox**` },
            { type: 10, content: nickTexto }
        ],
        accessory: { type: 11, media: { url: guildIconUrl }, spoiler: false }
    } : {
        type: 10, content: `${Emojis.get('_cart_emoji')||''} **Informe seu Nome De Usuário no Roblox**\n\n${nickTexto}`
    };
    const c = res.main(
        headerComp, { type: 14 },
        { type: 1, components: [{ type: 2, style: 1, label: `Inserir Usuário`, custom_id: `robux_inserir_usuario_${tipo}`, ...(resolveEmoji(Emojis.get('lupa')) ? { emoji: resolveEmoji(Emojis.get('lupa')) } : {}) }]}
    );
    try {
        if (interaction.deferred || interaction.replied) await interaction.editReply(c);
        else await interaction.update(c);
    } catch(e) {}
}


async function modalNickRoblox(interaction, tipo) {
    const modal = new ModalBuilder().setCustomId(`robux_modal_nick_${tipo}`).setTitle(`Informações do Roblox`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('roblox_nick').setLabel('Nick do Roblox').setPlaceholder('Digite seu nick do Roblox').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
        )
    );
    await interaction.showModal(modal);
}


async function handleModalNickRoblox(interaction, tipo) {
    const nick = interaction.fields.getTextInputValue('roblox_nick');
    
    await interaction.deferUpdate().catch(() => {});
    const loadingContent = res.main(
        { type: 10, content: `${Emojis.get('loading')||''} **Buscando informações do usuário...**\n\nVerificando o nick **${nick}**...` }
    );
    await interaction.editReply(loadingContent).catch(() => {});

    const robloxUser = await getRobloxUser(nick);
    if (!robloxUser) {
        return interaction.editReply(res.main(
            { type: 10, content: `${Emojis.get('negative')||''} | Usuário **${nick}** não encontrado no Roblox!
Verifique o nome e tente novamente.` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Tentar Novamente', custom_id: `robux_iniciar_compra_${tipo}` },
                { type: 2, style: 4, label: 'Cancelar Compra', custom_id: 'robux_cancelar_compra' }
            ]}
        ));
    }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinho) {
        carrinho.robloxUser = robloxUser;
        carrinho.status = 'usuario_verificado';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);
    }

    
    
    if (tipo === `gamepass`) {
        const _gpAv = robloxUser.avatar;
        const _gpUserComp = _gpAv ? {
            type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **Usuário Roblox Encontrado**\n\n${Emojis.get('user')||''} **Nome:** ${robloxUser.displayName}\n${Emojis.get('_camp_emoji')||''} **Usuário:** ${robloxUser.name}\n🔢 **ID:** ${robloxUser.id}` }],
            accessory: { type: 11, media: { url: _gpAv }, spoiler: false }
        } : { type: 10, content: `${Emojis.get('checker')||''} **Usuário Roblox Encontrado**\n\n${Emojis.get('user')||''} **Nome:** ${robloxUser.displayName}\n${Emojis.get('_camp_emoji')||''} **Usuário:** ${robloxUser.name}\n🔢 **ID:** ${robloxUser.id}` };
        await interaction.editReply(res.main(
            _gpUserComp, { type: 14 },
            { type: 10, content: `${Emojis.get('controller')||''} **Agora informe os dados do seu GamePass.**\n\nClique no botão abaixo para preencher as informações.` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 1, label: 'Informar dados do GamePass', custom_id: 'robux_preencher_gp_info' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ));
    } else {
        await mostrarVerificacaoPerfil(interaction, robloxUser, tipo);
    }
}


async function mostrarVerificacaoPerfil(interaction, robloxUser, tipo) {
    let criadoStr = 'Não disponível';
    try {
        const profileRes = await fetch(`https://users.roblox.com/v1/users/${robloxUser.id}`);
        const profileData = await profileRes.json();
        if (profileData.created) {
            const d = new Date(profileData.created);
            criadoStr = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: `2-digit` });
        }
    } catch(e) {}

    const parts = [
        { type: 10, content: `${Emojis.get('user')||''} **Nome:**\n${robloxUser.displayName}` }, { type: 14 },
        { type: 10, content: `${Emojis.get('_camp_emoji')||''} **Usuário:**\n${robloxUser.name}` }, { type: 14 },
        { type: 10, content: `${Emojis.get('date_emoji')||''} **Conta criada em:** ${criadoStr}` }, { type: 14 },
        { type: 10, content: `${Emojis.get('lock')||''} **Este perfil é seu?**\nClique em ${Emojis.get('checker')||''} **Sim, sou eu!** ou ${Emojis.get('negative')||''} **Não sou eu!** para confirmar.` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 3, label: 'Sim, sou eu!', custom_id: `robux_confirmar_perfil_${tipo}` },
            { type: 2, style: 4, label: 'Não sou eu!', custom_id: `robux_nao_sou_eu_${tipo}` }
        ]}
    ];

    if (robloxUser.avatar) {
        parts.unshift({ type: 14 });
        parts.unshift({ type: 12, items: [{ media: { url: robloxUser.avatar }, spoiler: false }] });
    }

    const c = res.main(...parts);
    try {
        if (interaction.deferred || interaction.replied) await interaction.editReply(c);
        else await interaction.update(c);
    } catch(e) {}
}


async function confirmarPerfil(interaction, tipo) {
    if (tipo === 'gamepass') {
        await mostrarSelecaoJogosGamepass(interaction);
    } else {
        await mostrarCarrinhoRobuxPrincipal(interaction);
    }
}


async function mostrarCarrinhoRobuxPrincipal(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) return;

    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const robuxQty = carrinho.robuxFinal || 0;
    const tipoTaxa = carrinho.tipoTaxa || 'sem_taxa';
    const cupom = carrinho.cupomRobux || null;

    let valorTotal = 0, robuxRecebe = 0;
    if (robuxQty > 0) {
        if (tipoTaxa === 'sem_taxa') { valorTotal = calcPrecoSemTaxa(robuxQty); robuxRecebe = Math.floor(robuxQty * 0.7); }
        else if (tipoTaxa === 'com_taxa') { valorTotal = calcPrecoComTaxa(robuxQty); robuxRecebe = robuxQty; }
        else { valorTotal = calcPrecoGrupo(robuxQty); robuxRecebe = robuxQty; }
        if (cupom) {
            const descPct = carrinho.cupomDesconto || 0;
            if (descPct > 0) valorTotal = valorTotal * (1 - descPct / 100);
        }
    }

    const tipoLabel = tipoTaxa === 'sem_taxa' ? 'Sem Taxa' : tipoTaxa === 'com_taxa' ? 'Com Taxa' : `Via Grupo`;
    const valorFmt = valorTotal > 0 ? `R$ ${valorTotal.toFixed(2).replace('.', ',')}` : `R$ 0,00`;
    const robuxFmt = robuxQty > 0 ? `${robuxQty.toLocaleString('pt-BR')} Robux (${tipoLabel})` : `0 Robux`;
    const robloxUser = carrinho.robloxUser;

    
    let valorOriginal = 0;
    if (robuxQty > 0) {
        if (tipoTaxa === 'sem_taxa') valorOriginal = calcPrecoSemTaxa(robuxQty);
        else if (tipoTaxa === `com_taxa`) valorOriginal = calcPrecoComTaxa(robuxQty);
        else valorOriginal = calcPrecoGrupo(robuxQty);
    }
    const valorOrigFmt = valorOriginal > 0 ? `R$ ${valorOriginal.toFixed(2).replace('.', ',')}` : `R$ 0,00`;
    const descPct = carrinho.cupomDesconto || 0;
    const valorDisplay = (cupom && descPct > 0)
        ? `~~${valorOrigFmt}~~ → **${valorFmt}** (-${descPct}% off)`
        : valorFmt;
    const cupomFmt = cupom ? `${Emojis.get('checker')||''} **${cupom}** — ${descPct}% de desconto` : `_Nenhum cupom aplicado_`;

    
    const avatarUrl = robloxUser?.avatar || null;
    const headerComp = avatarUrl ? {
        type: 9,
        components: [
            { type: 10, content: cfgCarrinho.cartTitulo || `${Emojis.get('thunder')||''} **Bem-vindo(a) ao menu de compras!**\nEscolha quantos Robux vão chegar na sua conta` },
            { type: 10, content: `-# Quantidade mínima: \`${minimoRobux}\` Robux` }
        ],
        accessory: { type: 11, media: { url: avatarUrl }, spoiler: false }
    } : {
        type: 10, content: `${cfgCarrinho.cartTitulo || `${Emojis.get('thunder')||''} **Bem-vindo(a) ao menu de compras!**\nEscolha quantos Robux vão chegar na sua conta`}\n-# Quantidade mínima: \`${minimoRobux}\` Robux`
    };

    const c = res.main(
        headerComp, { type: 14 },
        { type: 10, content: `${Emojis.get('green')||''} **Valor Total:** ${valorDisplay}\n${Emojis.get('controller')||''} **Quantidade:** ${robuxFmt}\n${Emojis.get('_camp_emoji')||''} **Cupom:** ${cupomFmt}` }, { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: 'robux_opcoes_select', placeholder: 'Selecione uma Opção', options: [
            { label: 'Alterar Quantidade', description: 'Altere a quantidade de Robux e tipo de compra', value: `alterar_quantidade`, ...(resolveEmoji(Emojis.get('controller')) ? { emoji: resolveEmoji(Emojis.get('controller')) } : {}) },
            { label: 'Adicionar Cupom', description: 'Adicione um cupom de desconto', value: `adicionar_cupom`, ...(resolveEmoji(Emojis.get('_camp_emoji')) ? { emoji: resolveEmoji(Emojis.get('_camp_emoji')) } : {}) }
        ]}]}, { type: 14 },
        { type: 10, content: `${Emojis.get('thunder')||''} **Usuário:** ${robloxUser?.name || `Não definido`} (@${robloxUser?.displayName || `?`})` },
        { type: 1, components: [{ type: 2, style: 2, label: 'Editar Perfil', custom_id: `robux_editar_perfil_robux`, ...(resolveEmoji(Emojis.get('user')) ? { emoji: resolveEmoji(Emojis.get('user')) } : {}) }]}, { type: 14 },
        { type: 10, content: `${Emojis.get('pix_stamp_emoji')||''} **Pagamento via PIX:**` },
        { type: 1, components: [{ type: 2, style: 3, label: `Ir para o Pagamento`, ...(resolveEmoji(Emojis.get('pix_stamp_emoji')) ? { emoji: resolveEmoji(Emojis.get('pix_stamp_emoji')) } : {}), custom_id: 'robux_ir_pagamento', ...(robuxQty === 0 ? { disabled: true } : {}) }]}
    );

    try {
        if (interaction.deferred || interaction.replied) await interaction.editReply(c);
        else await interaction.update(c);
    } catch(e) {}
}


async function modalAlterarQuantidadeCarrinho(interaction) {
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get('config.limites.robux')) || 20000;
    const valorRobux = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const modal = new ModalBuilder().setCustomId('robux_modal_alterar_qtd').setTitle('Alterar Quantidade de Robux');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('robux_qtd_cart').setLabel(`Quantidade (${minimoRobux}–${limiteRobux} Robux)`)
                .setPlaceholder(`Ex: 1000 — R$ ${valorRobux.toFixed(2)}/1000`).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('robux_tipo_cart').setLabel('Tipo: sem_taxa, com_taxa ou via_grupo')
                .setPlaceholder('sem_taxa').setValue('sem_taxa').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalAlterarQuantidadeCarrinho(interaction) {
    const qtdStr = interaction.fields.getTextInputValue('robux_qtd_cart').trim().replace(/[^0-9]/g, '');
    const tipoStr = interaction.fields.getTextInputValue('robux_tipo_cart').trim().toLowerCase().replace(/\s/g, '_');
    const qty = parseInt(qtdStr);
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get(`config.limites.robux`)) || 20000;

    if (isNaN(qty) || qty < minimoRobux || qty > limiteRobux) {
        return interaction.reply({ content: `${Emojis.get('negative') || ''} | Quantidade inválida! Use entre ${minimoRobux} e ${limiteRobux} Robux.`, flags: 64 });
    }

    const tipoTaxa = ['sem_taxa', 'com_taxa', 'via_grupo'].includes(tipoStr) ? tipoStr : 'sem_taxa';
    let preco, robuxRecebe;
    if (tipoTaxa === 'sem_taxa') { preco = calcPrecoSemTaxa(qty); robuxRecebe = Math.floor(qty * 0.7); }
    else if (tipoTaxa === 'com_taxa') { preco = calcPrecoComTaxa(qty); robuxRecebe = qty; }
    else { preco = calcPrecoGrupo(qty); robuxRecebe = qty; }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinho) {
        carrinho.tipoTaxa = tipoTaxa;
        carrinho.robuxFinal = qty;
        carrinho.robuxRecebe = robuxRecebe;
        carrinho.valorFinal = preco.toFixed(2);
        carrinho.status = 'aguardando_pagamento';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);
    }
    await mostrarCarrinhoRobuxPrincipal(interaction);
}


async function mostrarSelecaoJogosGamepass(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const allData = gamepassJogos.all ? gamepassJogos.all() : [];
    const jogos = allData.filter(item => item.ID && item.ID.startsWith(`jogo_`) && item.data && item.data.nome && (item.data.produtos || []).some(p => p.status));

    if (jogos.length === 0) {
        const c = res.main(
            { type: 10, content: `${Emojis.get('warn_emoji')||''} **Nenhum jogo configurado**\nAinda não há jogos com produtos disponíveis. Entre em contato com o suporte.` }, { type: 14 },
            { type: 1, components: [{ type: 2, style: 4, label: 'Fechar Carrinho', custom_id: 'robux_cancelar_compra' }]}
        );
        try { if (interaction.deferred || interaction.replied) await interaction.editReply(c); else await interaction.update(c); } catch(e) {}
        return;
    }

    const options = jogos.slice(0, 25).map(item => ({
        label: (item.data.nome || 'Jogo').slice(0, 25),
        value: item.ID.replace('jogo_', ``),
        ...(item.data.icone ? {} : {})
    }));

    const botNome = cfgCarrinho.gamepassTitulo || `${Emojis.get('thunder')||''} **Olá! Seja bem-vindo(a) ao atendimento!**`;
    const instrucoes = cfgCarrinho.gamepassInstrucoes || 'Escolha o **jogo correto** na lista abaixo.\nSe não encontrar o jogo desejado, clique em **"Não estou vendo meu jogo"** e nossa equipe vai te ajudar.\nCaso tenha aberto este carrinho por engano, clique em **"Fechar Carrinho"** para cancelar';

    const c = res.main(
        { type: 10, content: botNome }, { type: 14 },
        { type: 10, content: `Para continuarmos com sua compra, precisamos saber qual é o jogo relacionado ao seu pedido.\nPor favor, siga as instruções abaixo:\n\n${instrucoes}` }, { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: 'robux_selecao_jogo_gp', placeholder: 'Selecione um Jogo', options }]}, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 1, label: 'Não estou vendo meu jogo', custom_id: 'robux_jogo_nao_encontrado' },
            { type: 2, style: 4, label: 'Fechar Carrinho', custom_id: `robux_cancelar_compra` }
        ]}
    );
    try { if (interaction.deferred || interaction.replied) await interaction.editReply(c); else await interaction.update(c); } catch(e) {}
}


async function mostrarCarrinhoGamepassJogo(interaction, universeId, catSelecionada) {
    const jogoKey = `jogo_${universeId}`;
    const jogo = gamepassJogos.get(jogoKey);
    if (!jogo) { try { await interaction.reply({ content: `${Emojis.get('negative')||''} | Jogo não encontrado!`, flags: 64 }); } catch(e) {} return; }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) return;
    if (!carrinho.jogoSelecionado) { carrinho.jogoSelecionado = { universeId, nome: jogo.nome, icone: jogo.icone }; }
    if (!carrinho.itensCarrinho) carrinho.itensCarrinho = [];
    const catAtual = catSelecionada || carrinho.catSelecionada || null;
    if (catSelecionada) carrinho.catSelecionada = catSelecionada;
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    const categorias = jogo.categorias || [];
    const produtos = (jogo.produtos || []).filter(p => p.status);
    const produtosFiltrados = catAtual ? produtos.filter(p => p.categoriaId === catAtual) : produtos.filter(p => !p.categoriaId);
    const itens = carrinho.itensCarrinho || [];
    const total = itens.reduce((s, i) => s + i.preco, 0);
    const totalFmt = `R$ ${total.toFixed(2).replace(`.`, `,`)}`;

    const prodOptions = produtosFiltrados.slice(0, 25).map(p => ({
        label: p.nome.slice(0, 25),
        description: `R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}`.slice(0, 50),
        value: `gpprod_${universeId}|||${p.id}`
    }));

    const catBtns = categorias.slice(0, 3).map(cat => ({
        type: 2, style: catAtual === cat.id ? 1 : 2,
        label: cat.nome.slice(0, 15),
        custom_id: `robux_gp_cat_${universeId}|||${cat.id}`
    }));
    const semCatBtn = { type: 2, style: (!catAtual ? 1 : 2), label: `Gamepass`, custom_id: `robux_gp_cat_${universeId}|||sem_cat` };
    const allTabBtns = [semCatBtn, ...catBtns].slice(0, 4);

    const comps = [];
    comps.push({ type: 10, content: `${Emojis.get('_cart_emoji')||''} **Valor Total de ${jogo.nome}** ‖ **${totalFmt}**\n${itens.length === 0 ? `Nenhum produto adicionado ao carrinho ainda...` : itens.map(i => `• ${i.nome} — R$ ${parseFloat(i.preco).toFixed(2).replace('.', ',')}`).join('\n')}` });
    if (jogo.icone) comps.push({ type: 12, items: [{ media: { url: jogo.icone }, spoiler: false }] });
    comps.push({ type: 14 });
    comps.push({ type: 10, content: `**Seleção de Produtos** ‖ ${jogo.nome}\nSelecione abaixo os produtos que deseja adicionar ao carrinho!` });
    comps.push({ type: 1, components: [{ type: 2, style: 2, label: totalFmt, custom_id: `robux_gp_total_info`, disabled: true }, ...allTabBtns] });
    if (prodOptions.length > 0) {
        comps.push({ type: 1, components: [{ type: 3, custom_id: `robux_gp_select_prod_${universeId}`, placeholder: `Selecione um produto`, options: prodOptions }]});
    } else {
        comps.push({ type: 10, content: '_Nenhum produto disponível nesta seleção._' });
    }
    comps.push({ type: 14 });
    comps.push({ type: 1, components: [
        { type: 2, style: 2, label: '↩️', custom_id: 'robux_cancelar_compra' },
        { type: 2, style: 2, label: 'Adicionar Cupom', custom_id: `robux_gp_cupom_${universeId}` },
        { type: 2, style: 3, label: 'Ir para o carrinho', custom_id: `robux_gp_ir_pagamento_${universeId}`, ...(total === 0 ? { disabled: true } : {}) }
    ]});

    const c = res.main(...comps);
    try { if (interaction.deferred || interaction.replied) await interaction.editReply(c); else await interaction.update(c); } catch(e) {}
}


async function mostrarEscolhaTipoTaxa(interaction, tipo, robloxUser) {
    const valorRobux = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const valorGrupo = parseFloat(robuxConfig.get('config.valores.robuxGrupo')) || Math.ceil(valorRobux * 1.18);
    const precoSemTaxa1k = valorRobux.toFixed(2).replace('.', ',');
    const precoComTaxa1k = Math.ceil(valorRobux / 0.75).toFixed(2).replace('.', ',');
    const precoGrupo1k = valorGrupo.toFixed(2).replace('.', ',');

    const _etAv = robloxUser.avatar;
    const _etUserComp = _etAv ? {
        type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\` — ID: \`${robloxUser.id}\`)` }],
        accessory: { type: 11, media: { url: _etAv }, spoiler: false }
    } : { type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\` — ID: \`${robloxUser.id}\`)` };

    const _etBtns1 = [
        { type: 2, style: 2, label: `Sem Taxa — R$ ${precoSemTaxa1k}/1k`, custom_id: `robux_tipo_sem_taxa_${tipo}`, ...(resolveEmoji(Emojis.get('dinheiro')) ? { emoji: resolveEmoji(Emojis.get('dinheiro')) } : {}) },
        { type: 2, style: 1, label: `Com Taxa — R$ ${precoComTaxa1k}/1k`, custom_id: `robux_tipo_com_taxa_${tipo}`, ...(resolveEmoji(Emojis.get('diamond')) ? { emoji: resolveEmoji(Emojis.get('diamond')) } : {}) }
    ];
    if (tipo === `robux`) _etBtns1.push({ type: 2, style: 3, label: `Via Grupo — R$ ${precoGrupo1k}/1k`, custom_id: `robux_tipo_via_grupo_${tipo}` });

    const _etTaxaDesc = `${Emojis.get('dinheiro')||''} **Sem Taxa** — R$ ${precoSemTaxa1k}/1000 Robux
-# Você cria uma gamepass no valor solicitado. O Roblox retém 30%, você recebe ~70% dos Robux.

${Emojis.get('diamond')||''} **Com Taxa** — R$ ${precoComTaxa1k}/1000 Robux
-# Preço ajustado para cobrir a taxa. Você recebe o valor **exato** de Robux solicitado.${tipo === `robux` ? `

${Emojis.get('controller')||''} **Via Grupo** — R$ ${precoGrupo1k}/1000 Robux
-# Envio direto pelo grupo. Você recebe **100%** sem precisar de gamepass.` : ``}`;
    await interaction.editReply(res.main(
        _etUserComp, { type: 14 },
        { type: 10, content: `${Emojis.get('dinheiro')||''} **Escolha o Tipo de Compra**

${_etTaxaDesc}` }, { type: 14 },
        { type: 1, components: _etBtns1 },
        { type: 1, components: [{ type: 2, style: 4, label: 'Cancelar Compra', custom_id: 'robux_cancelar_compra' }] }
    ));
}


async function modalGamepassInfo(interaction, tipoTaxa) {
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get('config.limites.robux')) || 20000;
    const modal = new ModalBuilder()
        .setCustomId(`robux_modal_gp_info_${tipoTaxa}`)
        .setTitle('Informações do GamePass');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gp_jogo').setLabel('Qual o jogo?')
                .setPlaceholder('Ex: Arsenal, Adopt Me, Jailbreak...').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gp_gamepass').setLabel('Qual a GamePass?')
                .setPlaceholder('Nome exato da gamepass que você vai criar').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gp_valor').setLabel(`Valor da GamePass em Robux (${minimoRobux}–${limiteRobux})`)
                .setPlaceholder('Ex: 1000').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gp_presente').setLabel('O jogo dá pra enviar presente?')
                .setPlaceholder('Sim ou Não — para nossa equipe enviar a gamepass').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalGamepassInfo(interaction, tipoTaxa) {
    const jogo = interaction.fields.getTextInputValue('gp_jogo').trim();
    const gamepass = interaction.fields.getTextInputValue('gp_gamepass').trim();
    const valorStr = interaction.fields.getTextInputValue('gp_valor').trim().replace(/[^0-9]/g, '');
    const presente = interaction.fields.getTextInputValue('gp_presente').trim();

    const valorRobux = parseInt(valorStr);
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get(`config.limites.robux`)) || 20000;

    if (isNaN(valorRobux) || valorRobux < minimoRobux || valorRobux > limiteRobux) {
        return interaction.reply({
            content: `${Emojis.get('negative') || ''} | Valor inválido! Informe entre **${minimoRobux}** e **${limiteRobux}** Robux.`,
            flags: 64
        });
    }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) return interaction.reply({ content: `${Emojis.get('negative') || ''} | Carrinho não encontrado!`, flags: 64 });

    
    const valorPor1000Robux = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const valorPor1000Gamepass = parseFloat(robuxConfig.get('config.valores.gamepass')) || valorPor1000Robux;

    let preco, robuxRecebe, descTaxa;

    if (tipoTaxa === 'gamepass_produto') {
        
        preco = ((valorRobux / 1000) * valorPor1000Gamepass).toFixed(2);
        robuxRecebe = valorRobux;
        descTaxa = 'GamePass Produto';
    } else if (tipoTaxa === 'sem_taxa') {
        preco = ((valorRobux / 1000) * valorPor1000Robux).toFixed(2);
        robuxRecebe = Math.floor(valorRobux * 0.7);
        descTaxa = 'Sem Taxa';
    } else {
        const gpComTaxa = Math.ceil(valorRobux / 0.7);
        preco = ((gpComTaxa / 1000) * valorPor1000Robux).toFixed(2);
        robuxRecebe = valorRobux;
        descTaxa = 'Com Taxa';
    }

    carrinho.tipoTaxa = tipoTaxa;
    carrinho.robuxFinal = valorRobux;
    carrinho.robuxRecebe = robuxRecebe;
    carrinho.valorFinal = preco;
    carrinho.gamepassSelecionado = { id: null, name: gamepass, price: valorRobux, jogo, presente, url: null };
    carrinho.status = 'checkout';
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    
    
    if (tipoTaxa === 'gamepass_produto') {
        return `ir_pagamento`;
    }

    
    await interaction.deferUpdate();

    const _gpCoAv = carrinho.robloxUser.avatar;
    const _gpCoUserComp = _gpCoAv ? {
        type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }],
        accessory: { type: 11, media: { url: _gpCoAv }, spoiler: false }
    } : { type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` };
    const _gpCoPresenteEmoji = presente.toLowerCase().startsWith(`s`) ? `${Emojis.get('checker')||''}` : `${Emojis.get('negative')||''}`;
    await interaction.editReply(res.main(
        _gpCoUserComp, { type: 14 },
        { type: 10, content: `${Emojis.get('_cart_emoji')||''} **Checkout — GamePass**

${Emojis.get('controller')||''} **Jogo:** \`${jogo}\`
${Emojis.get('_ticket_emoji')||''} **GamePass:** \`${gamepass}\`
${Emojis.get('_camp_emoji')||''} **Tipo:** ${descTaxa}
${Emojis.get('diamond')||''} **Valor:** ${valorRobux.toLocaleString('pt-BR')} Robux
${Emojis.get('checker')||''} **Você Recebe:** **${robuxRecebe.toLocaleString('pt-BR')} Robux**
${Emojis.get('gift')||''} **Aceita Presente?** ${_gpCoPresenteEmoji} ${presente}
${Emojis.get('pix_stamp_emoji')||''} **Valor Total:** **R$ ${preco.replace('.', ',')}**` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 3, label: 'Ir para o Pagamento', custom_id: 'robux_ir_pagamento' },
            { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
        ]}
    ));
}


async function modalQuantidadeRobux(interaction, tipoTaxa, tipo) {
    const valorRobux = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get('config.limites.robux')) || 20000;

    let precoInfo = '';
    if (tipoTaxa === 'sem_taxa') precoInfo = `R$ ${valorRobux.toFixed(2)}/1000 Robux (sem taxa)`;
    else if (tipoTaxa === 'com_taxa') precoInfo = `R$ ${Math.ceil(valorRobux / 0.75).toFixed(2)}/1000 Robux (com taxa)`;
    else precoInfo = `Via Grupo`;

    const modal = new ModalBuilder().setCustomId(`robux_modal_qtd_${tipoTaxa}_${tipo}`).setTitle(`Quantidade de Robux`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('robux_qtd')
                .setLabel(`Quantidade de Robux (${minimoRobux}–${limiteRobux})`)
                .setPlaceholder(`Ex: 1000 — Preço: ${precoInfo}`)
                .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10)
        )
    );
    await interaction.showModal(modal);
}


async function handleModalQuantidadeRobux(interaction, tipoTaxa, tipo) {
    const qtdStr = interaction.fields.getTextInputValue('robux_qtd').trim().replace(/[^0-9]/g, '');
    const qty = parseInt(qtdStr);
    const minimoRobux = parseInt(robuxConfig.get('config.limites.minimoRobux')) || 100;
    const limiteRobux = parseInt(robuxConfig.get(`config.limites.robux`)) || 20000;

    if (isNaN(qty) || qty < minimoRobux || qty > limiteRobux) {
        return interaction.reply({ content: `${Emojis.get('negative') || ''} | Quantidade inválida! Informe entre **${minimoRobux}** e **${limiteRobux}** Robux.`, flags: 64 });
    }

    let preco, descTaxa, robuxRecebe;
    if (tipoTaxa === 'sem_taxa') {
        preco = calcPrecoSemTaxa(qty);
        descTaxa = 'Sem Taxa';
        robuxRecebe = Math.floor(qty * 0.7);
    } else if (tipoTaxa === 'com_taxa') {
        preco = calcPrecoComTaxa(qty);
        descTaxa = 'Com Taxa';
        robuxRecebe = qty;
    } else {
        preco = calcPrecoGrupo(qty);
        descTaxa = 'Via Grupo';
        robuxRecebe = qty;
    }

    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (carrinho) {
        carrinho.tipoTaxa = tipoTaxa;
        carrinho.robuxFinal = qty;
        carrinho.robuxRecebe = robuxRecebe;
        carrinho.valorFinal = preco.toFixed(2);
        carrinho.status = 'checkout';
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);
    }

    if (tipo === `gamepass`) {
        
        await interaction.deferUpdate().catch(()=>{});
        await interaction.editReply(res.main({ type: 10, content: `${Emojis.get('loading')||''} **Buscando GamePasses...**` }));
        const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
        const minimo = robuxConfig.get('config.limites.minimoGamepass') || 0;
        const limite = robuxConfig.get(`config.limites.gamepass`) || 1000000;
        if (gamepasses.length === 0) await mostrarSemGamepass(interaction, carrinho.robloxUser, minimo, limite);
        else await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses, tipoTaxa, qty);
        return;
    }

    
    await interaction.deferUpdate().catch(()=>{});
    const _mqAv = carrinho.robloxUser.avatar;
    const _mqUserComp = _mqAv ? {
        type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }],
        accessory: { type: 11, media: { url: _mqAv }, spoiler: false }
    } : { type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.name}** — ID: \`${carrinho.robloxUser.id}\`` };
    await interaction.editReply(res.main(
        _mqUserComp, { type: 14 },
        { type: 10, content: `${Emojis.get('_cart_emoji')||''} **Resumo do Pedido**

${Emojis.get('_camp_emoji')||''} **Tipo:** ${descTaxa}
${Emojis.get('controller')||''} **Solicitado:** ${qty} Robux
${Emojis.get('checker')||''} **Você Recebe:** **${robuxRecebe} Robux**
${Emojis.get('pix_stamp_emoji')||''} **Valor Total:** **R$ ${preco.toFixed(2).replace('.', ',')}**` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 3, label: 'Ir para o Pagamento', custom_id: 'robux_ir_pagamento' },
            { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
        ]}
    ));
}


async function mostrarGamepasses(interaction, robloxUser, gamepasses, tipoTaxa, qtdSolicitada) {
    const valorPor1000 = parseFloat(robuxConfig.get('config.valores.robux')) || 27;

    
    const ordenados = [...gamepasses].sort((a, b) => b.price - a.price);

    const tipoLabel = tipoTaxa === 'com_taxa' ? 'Com Taxa' : tipoTaxa === 'via_grupo' ? 'Via Grupo' : `Sem Taxa`;
    const _mgAv = robloxUser.avatar;
    const _mgUserComp = _mgAv ? {
        type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\` — ID: \`${robloxUser.id}\`)` }],
        accessory: { type: 11, media: { url: _mgAv }, spoiler: false }
    } : { type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\` — ID: \`${robloxUser.id}\`)` };
    const _mgOptions = ordenados.slice(0, 25).map(gp => {
        const preco = ((gp.price / 1000) * valorPor1000).toFixed(2).replace('.', ',');
        return { label: `${gp.price.toLocaleString('pt-BR')} Robux disponível`, description: `${gp.name.slice(0, 40)} — R$ ${preco}`, value: `${gp.id}_${gp.price}`, emoji: { id: `1350550813898178570` } };
    });
    const rows = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('robux_select_gamepass').setPlaceholder(`${Emojis.get('_ticket_emoji')||''} Selecione a quantidade de Robux disponível`).addOptions(_mgOptions)
        ),
        new ActionRowBuilder().addComponents(
            (() => { const b = new ButtonBuilder().setCustomId('robux_atualizar_gamepass').setLabel('Atualizar Lista').setStyle(1); const e = Emojis.get('_change_emoji'); if (e) b.setEmoji(e); return b; })(),
            (() => { const b = new ButtonBuilder().setCustomId('robux_cancelar_compra').setLabel('Cancelar Compra').setStyle(4); const e = Emojis.get('_trash_emoji'); if (e) b.setEmoji(e); return b; })()
        )
    ];

    const _mgDesc = `${Emojis.get('_ticket_emoji')||''} **GamePasses Disponíveis**

Encontramos **${ordenados.length}** GamePass(es) no seu perfil.
Selecione abaixo qual deseja usar.
-# Tipo: **${tipoLabel}** • R$ ${valorPor1000}/1000 Robux`;
    await interaction.editReply(res.main(
        _mgUserComp, { type: 14 },
        { type: 10, content: _mgDesc }, { type: 14 },
        rows[0].toJSON(),
        rows[1].toJSON()
    ));
}

async function mostrarSemGamepass(interaction, robloxUser, minimo, limite) {
    const _nsgAv = robloxUser.avatar;
    const _nsgUserComp = _nsgAv ? {
        type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\` — ID: \`${robloxUser.id}\`)` }],
        accessory: { type: 11, media: { url: _nsgAv }, spoiler: false }
    } : { type: 10, content: `${Emojis.get('checker')||''} **${robloxUser.displayName}** (\`${robloxUser.name}\`)` };
    await interaction.editReply(res.main(
        _nsgUserComp, { type: 14 },
        { type: 10, content: `${Emojis.get('forbidden')||''} **Nenhum GamePass Encontrado**

O usuário **${robloxUser.name}** não possui GamePass à venda no valor aceito (${minimo}–${limite} Robux).

> Crie um GamePass e clique em **Atualizar Lista**.
> Acesse: Roblox → Experiências → Passes → Criar Novo` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 1, label: 'Atualizar Lista', custom_id: 'robux_atualizar_gamepass' },
            { type: 2, style: 4, label: 'Cancelar Compra', custom_id: `robux_cancelar_compra` }
        ]}
    ));
}


async function mostrarRevisaoPedido(interaction, gamepassId, gamepassPrice) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Erro ao buscar carrinho!`, flags: 64 });
    }
    await interaction.deferUpdate();

    const valorPor1000 = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const gpPrice = parseInt(gamepassPrice);
    const gpComTaxa = Math.ceil(gpPrice / 0.7);

    let gamepassNome = 'GamePass';
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const gpEncontrado = gamepasses.find(gp => gp.id.toString() === gamepassId.toString());
    if (gpEncontrado) gamepassNome = gpEncontrado.name;

    
    let gpUrl = null;
    const gpEncontradoR = gamepasses.find(gp => gp.id.toString() === gamepassId.toString());
    if (gpEncontradoR) gpUrl = gpEncontradoR.url || null;
    if (!gpUrl) {
        const sn = (gamepassNome || 'gamepass').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
        gpUrl = `https://www.roblox.com/game-passes/${gamepassId}/${sn}`;
    }

    carrinho.gamepassSelecionado = { id: gamepassId, name: gamepassNome, price: gpPrice, priceComTaxa: gpComTaxa, url: gpUrl };
    carrinho.status = 'revisao_pedido';
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    
    
    if (carrinho.tipoTaxa && carrinho.tipoTaxa !== 'via_grupo') {
        const robuxAmount = carrinho.tipoTaxa === 'com_taxa' ? gpComTaxa : gpPrice;
        const valorTotal = ((robuxAmount / 1000) * valorPor1000).toFixed(2);
        const tipoLabel = carrinho.tipoTaxa === 'com_taxa' ? 'Com Taxa' : 'Sem Taxa';
        const robuxRecebe = carrinho.tipoTaxa === 'com_taxa' ? gpPrice : Math.floor(gpPrice * 0.7);

        carrinho.robuxFinal = robuxAmount;
        carrinho.robuxRecebe = robuxRecebe;
        carrinho.valorFinal = valorTotal;
        carrinho.status = `checkout`;
        carrinhosRobux.set(`${interaction.user.id}`, carrinho);

        const _rpAv1 = carrinho.robloxUser.avatar;
        const _rpUC1 = _rpAv1 ? { type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _rpAv1 }, spoiler: false } } : { type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
        return interaction.editReply(res.main(
            _rpUC1, { type: 14 },
            { type: 10, content: `${Emojis.get('_cart_emoji')||''} **Checkout**

${Emojis.get('_ticket_emoji')||''} **GamePass:** \`${gamepassNome}\`
${Emojis.get('_camp_emoji')||''} **Tipo:** ${tipoLabel}
${Emojis.get('diamond')||''} **GamePass:** ${gpPrice} Robux
${Emojis.get('checker')||''} **Você Recebe:** **${robuxRecebe} Robux**
${Emojis.get('pix_stamp_emoji')||''} **Valor Total:** **R$ ${valorTotal.replace('.', ',')}**` }, { type: 14 },
            { type: 1, components: [
                { type: 2, style: 3, label: 'Ir para o Pagamento', custom_id: 'robux_ir_pagamento' },
                { type: 2, style: 2, label: 'Voltar', custom_id: 'robux_voltar_gamepasses' },
                { type: 2, style: 4, label: 'Cancelar', custom_id: 'robux_cancelar_compra' }
            ]}
        ));
    }

    
    const precoSemTaxa = ((gpPrice / 1000) * valorPor1000).toFixed(2).replace('.', ',');
    const precoComTaxa = ((gpComTaxa / 1000) * valorPor1000).toFixed(2).replace('.', ',');

    
    const _rpAv2 = carrinho.robloxUser.avatar;
    const _rpUC2 = _rpAv2 ? { type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _rpAv2 }, spoiler: false } } : { type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
    await interaction.editReply(res.main(
        _rpUC2, { type: 14 },
        { type: 10, content: `${Emojis.get('codigocopia')||''} **Revisão do Pedido — ${gamepassNome}**

${Emojis.get('dinheiro')||''} **Sem Taxa — R$ ${precoSemTaxa}**
-# ${gpPrice} Robux → ~${Math.floor(gpPrice * 0.7)} Robux recebidos (Roblox retém 30%)

${Emojis.get('diamond')||''} **Com Taxa — R$ ${precoComTaxa}**
-# Gamepass ajustado para ${gpComTaxa} Robux → ${gpPrice} Robux recebidos (valor cheio)` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 2, label: `Sem Taxa — R$ ${precoSemTaxa}`, ...(resolveEmoji(Emojis.get('dinheiro')) ? { emoji: resolveEmoji(Emojis.get('dinheiro')) } : {}), custom_id: `robux_comprar_sem_taxa_${gamepassId}_${gpPrice}` },
            { type: 2, style: 1, label: `Com Taxa — R$ ${precoComTaxa}`, ...(resolveEmoji(Emojis.get('diamond')) ? { emoji: resolveEmoji(Emojis.get('diamond')) } : {}), custom_id: `robux_comprar_com_taxa_${gamepassId}_${gpComTaxa}` }
        ]},
        { type: 1, components: [
            { type: 2, style: 2, label: `Voltar`, ...(resolveEmoji(Emojis.get('_back_emoji')) ? { emoji: resolveEmoji(Emojis.get('_back_emoji')) } : {}), custom_id: 'robux_voltar_gamepasses' },
            { type: 2, style: 4, label: 'Cancelar Compra', custom_id: `robux_cancelar_compra` }
        ]}
    ));
}


async function mostrarCheckout(interaction, gamepassId, robuxAmount) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Erro ao buscar carrinho!`, flags: 64 });
    }
    await interaction.deferUpdate();

    
    const valorPor1000 = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const valorTotal = ((robuxAmount / 1000) * valorPor1000).toFixed(2);

    let gamepassNome = 'GamePass';
    let gamepassUrl = null;
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const gpEncontrado = gamepasses.find(gp => gp.id.toString() === gamepassId.toString());
    if (gpEncontrado) {
        gamepassNome = gpEncontrado.name;
        gamepassUrl = gpEncontrado.url || null;
    }
    if (!gamepassUrl) {
        const safeName = (gamepassNome || 'gamepass').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gamepass';
        gamepassUrl = `https://www.roblox.com/game-passes/${gamepassId}/${safeName}`;
    }

    carrinho.gamepassSelecionado = { id: gamepassId, name: gamepassNome, price: robuxAmount, url: gamepassUrl };
    carrinho.robuxFinal = robuxAmount;
    carrinho.valorFinal = valorTotal;
    carrinho.status = `checkout`;
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    const _mcAv = carrinho.robloxUser.avatar;
    const _mcUC = _mcAv ? { type: 9, components: [{ type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\` — ID: \`${carrinho.robloxUser.id}\`)` }], accessory: { type: 11, media: { url: _mcAv }, spoiler: false } } : { type: 10, content: `${Emojis.get('checker')||''} **${carrinho.robloxUser.displayName}** (\`${carrinho.robloxUser.name}\`)` };
    await interaction.editReply(res.main(
        _mcUC, { type: 14 },
        { type: 10, content: `${Emojis.get('_cart_emoji')||''} **Checkout**

${Emojis.get('_ticket_emoji')||''} **GamePass:** \`${gamepassNome}\`
${Emojis.get('controller')||''} **Robux:** ${robuxAmount} Robux
${Emojis.get('pix_stamp_emoji')||''} **Valor Total:** **R$ ${valorTotal.replace('.', ',')}**` }, { type: 14 },
        { type: 1, components: [
            { type: 2, style: 3, label: 'Ir para o Pagamento', custom_id: 'robux_ir_pagamento' },
            { type: 2, style: 2, label: 'Voltar', custom_id: 'robux_voltar_gamepasses' },
            { type: 2, style: 4, label: 'Cancelar', custom_id: `robux_cancelar_compra` }
        ]}
    ));
}


async function voltarParaGamepasses(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Erro ao buscar carrinho!`, flags: 64 });
    }
    await interaction.deferUpdate();
    await interaction.editReply(res.main({ type: 10, content: `${Emojis.get('loading')||''} **Carregando GamePasses...**` }));
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const minimo = robuxConfig.get('config.limites.minimoGamepass') || 0;
    const limite = robuxConfig.get(`config.limites.gamepass`) || 1000000;
    if (gamepasses.length === 0) await mostrarSemGamepass(interaction, carrinho.robloxUser, minimo, limite);
    else await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses, carrinho.tipoTaxa, carrinho.robuxFinal);
}

async function atualizarGamepasses(interaction) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Erro ao buscar carrinho!`, flags: 64 });
    }
    await interaction.deferUpdate();
    await interaction.editReply(res.main({ type: 10, content: `${Emojis.get('loading')||''} **Buscando GamePasses novamente...**` }));
    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const minimo = robuxConfig.get('config.limites.minimoGamepass') || 0;
    const limite = robuxConfig.get(`config.limites.gamepass`) || 1000000;
    if (gamepasses.length === 0) await mostrarSemGamepass(interaction, carrinho.robloxUser, minimo, limite);
    else await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses, carrinho.tipoTaxa, carrinho.robuxFinal);
}

async function cancelarCompra(interaction, client) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Você não possui um carrinho aberto!`, flags: 64 });
    }
    await enviarLogCompra(interaction.guild, 'canceladas', {
        usuario: interaction.user, tipo: carrinho.visão, canal: interaction.channel,
        acao: `Compra Cancelada`, robloxUser: carrinho.robloxUser
    });
    carrinhosRobux.delete(`${interaction.user.id}`);
    const cancelMsg = res.main(
        { type: 10, content: `${Emojis.get('negative')||''} **Compra cancelada!**
O canal será deletado em 5 segundos...` }
    );
    try {
        if (interaction.deferred || interaction.replied) await interaction.editReply(cancelMsg);
        else await interaction.update(cancelMsg);
    } catch(e) {}
    setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) {} }, 5000);
}

async function enviarLogCompra(guild, tipo, dados) {
    
    const canalLogRobux = robuxConfig.get('config.canais.logRobux');
    const canalId = canalLogRobux || robuxConfig.get(`config.canais.${tipo}`);
    if (!canalId) return;
    const canal = guild.channels.cache.get(canalId);
    if (!canal) return;

    const cores = { iniciadas: '#3498db', canceladas: '#e74c3c', aprovadas: '#2ecc71' };
    const embed = new EmbedBuilder()
        .setColor(cores[tipo] || '#7c3aed')
        .setAuthor({ name: dados.acao })
        .setDescription(`Usuário ${dados.usuario} — ${tipo}`)
        .addFields({ name: `${Emojis.get('date_emoji')||''} Data`, value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false })
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    if (dados.robloxUser) {
        embed.addFields({ name: `${Emojis.get('controller')||''} Roblox`, value: `${dados.robloxUser.name} (${dados.robloxUser.id})`, inline: true });
        if (dados.robloxUser.avatar) embed.setThumbnail(dados.robloxUser.avatar);
    }
    if (dados.canal) embed.addFields({ name: `${Emojis.get('_lapis_emoji')||''} Canal`, value: `<#${dados.canal.id}>`, inline: true });
    if (dados.carrinho) {
        embed.addFields({ name: `${Emojis.get('_ticket_emoji')||''} Detalhes`, value: `\`${dados.carrinho.robuxFinal} Robux — R$ ${dados.carrinho.valorFinal}\``, inline: false });
    }
    try { await canal.send({ embeds: [embed] }); } catch (e) {}
}



async function buscarGamepassesParaMetodo(interaction, tipoTaxa) {
    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
    if (!carrinho || !carrinho.robloxUser) {
        return interaction.reply({ content: `${Emojis.get('negative') || `${Emojis.get('negative')||''}`} | Erro ao buscar carrinho!`, flags: 64 });
    }
    carrinho.tipoTaxa = tipoTaxa;
    carrinhosRobux.set(`${interaction.user.id}`, carrinho);

    await interaction.deferUpdate().catch(()=>{});
    await interaction.editReply(res.main({ type: 10, content: `${Emojis.get('loading')||''} **Buscando GamePasses...**` }));

    const gamepasses = await getUserGamepasses(carrinho.robloxUser.id);
    const minimo = robuxConfig.get('config.limites.minimoGamepass') || 0;
    const limite = robuxConfig.get('config.limites.gamepass') || 1000000;
    if (gamepasses.length === 0) await mostrarSemGamepass(interaction, carrinho.robloxUser, minimo, limite);
    else await mostrarGamepasses(interaction, carrinho.robloxUser, gamepasses, tipoTaxa, null);
}

module.exports = {
    criarCarrinhoRobux, modalNickRoblox, handleModalNickRoblox,
    mostrarEscolhaTipoTaxa, modalQuantidadeRobux, handleModalQuantidadeRobux,
    modalGamepassInfo, handleModalGamepassInfo,
    cancelarCompra, atualizarGamepasses, mostrarGamepasses, mostrarSemGamepass,
    mostrarCheckout, mostrarRevisaoPedido, voltarParaGamepasses,
    enviarLogCompra, carrinhosRobux, getRobloxUser, getUserGamepasses, buscarGamepassesParaMetodo,
    mostrarStepNick, mostrarVerificacaoPerfil, confirmarPerfil,
    mostrarCarrinhoRobuxPrincipal, modalAlterarQuantidadeCarrinho, handleModalAlterarQuantidadeCarrinho,
    mostrarSelecaoJogosGamepass, mostrarCarrinhoGamepassJogo
}