const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");
const { JsonDatabase } = require("../database/jsondb");
const { res } = require("../res");
const emojisDb = require("../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

const stockAutoConfig = new JsonDatabase({ databasePath: "./database/stockAutoConfig.json" });


async function painelStockAuto(interaction) {
    const config = stockAutoConfig.get('config') || {};
    const canal = config.canal;
    const status = config.status || false;
    const formato = config.formato || 'compv2';
    const botaoNome = config.botaoNome || 'Ver Produto';

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar00")
            .setLabel('Voltar')
            
            .setStyle(2)
    );

    const formatoTexto = formato === 'embed' ? 'Embed' : formato === 'mensagem' ? 'Mensagem Padrão' : `Comp V2 (moderno)`;

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Automático de Stock` },
        { type: 14 },
        { type: 10, content: `**Sistema Automático de Notificação de Stock**\nQuando qualquer produto receber novo estoque, o bot enviará uma mensagem customizada no canal configurado.` },
        { type: 14 },
        { type: 10, content: `**Status:** ${status ? `${Emojis.get(`checker`) || ``} Ativo` : `${Emojis.get(`negative`) || ``} Inativo`}\n**Canal:** ${canal ? `<#${canal}>` : 'Não configurado'}\n**Formato:** \`${formatoTexto}\`\n**Nome do Botão:** \`${botaoNome}\`` },
        { type: 14 },
        { type: 10, content: `**Variáveis disponíveis na mensagem:**\n> \`{Produto}\` = Nome do produto\n> \`{Stock}\` = Quantidade adicionada\n> \`{StockTotal}\` = Estoque total atual\n> \`{Campo}\` = Nome do campo que recebeu stock` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "stock_auto_status_select",
                placeholder: "Ativar/Desativar sistema",
                options: [
                    { label: "Ativar Sistema", value: "ativar_stock_auto", emoji: { id: "1387981762050920548" } },
                    { label: "Desativar Sistema", value: "desativar_stock_auto", emoji: { id: "1387981760649756782" } }
                ]
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Canal", custom_id: "stock_auto_config_canal", emoji: { id: "1178086608004722689" } },
                { type: 2, style: 2, label: "Editar Mensagem", custom_id: "stock_auto_config_mensagem", emoji: { id: "1178066208835252266" } },
                { type: 2, style: 2, label: "Configurar Formato", custom_id: "stock_auto_config_formato", emoji: { id: "1178077123882262628" } }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Config. Botão", custom_id: "stock_auto_config_botao", emoji: { id: "1178080366871973958" } },
                { type: 2, style: 2, label: "Adicionar Imagem", custom_id: "stock_auto_config_imagem", emoji: { id: "1178347788501794836" } },
                { type: 2, style: 1, label: "Testar Notificação", custom_id: "stock_auto_testar", emoji: { id: "1178156643121365063" } }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}


async function modalConfigCanal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('stock_auto_modal_canal')
        .setTitle('Configurar Canal de Stock');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('canal_id')
                .setLabel('ID do Canal')
                .setPlaceholder('Cole aqui o ID do canal para notificações')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        )
    );

    await interaction.showModal(modal);
}


async function modalEditarMensagem(interaction) {
    const config = stockAutoConfig.get('config') || {};
    const msgAtual = config.mensagem || 'O produto **{Produto}** acabou de receber stock!\n\nStock adicionado: `{Stock}`\nStock total: `{StockTotal}`\nCampo: `{Campo}`';

    const modal = new ModalBuilder()
        .setCustomId('stock_auto_modal_mensagem')
        .setTitle('Editar Mensagem de Stock');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('mensagem')
                .setLabel('Mensagem (use as variáveis)')
                .setPlaceholder('{Produto} {Stock} {StockTotal} {Campo}')
                .setValue(msgAtual)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1500)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('titulo')
                .setLabel('Título (para embed/comp v2)')
                .setPlaceholder('Ex: 🆕 Novo Stock Disponível!')
                .setValue(config.titulo || '🆕 Novo Stock!')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('cor_embed')
                .setLabel('Cor (hex, ex: #7c3aed)')
                .setPlaceholder('#7c3aed')
                .setValue(config.corEmbed || '#7c3aed')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(10)
        )
    );

    await interaction.showModal(modal);
}


async function modalConfigFormato(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('stock_auto_modal_formato')
        .setTitle('Configurar Formato da Notificação');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('formato')
                .setLabel('Formato: compv2, embed, ou mensagem')
                .setPlaceholder('compv2')
                .setValue(stockAutoConfig.get('config.formato') || 'compv2')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(10)
        )
    );

    await interaction.showModal(modal);
}


async function modalConfigBotao(interaction) {
    const config = stockAutoConfig.get('config') || {};
    const modal = new ModalBuilder()
        .setCustomId('stock_auto_modal_botao')
        .setTitle('Configurar Botão de Notificação');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('botao_nome')
                .setLabel('Nome do Botão')
                .setPlaceholder('Ex: Ver Produto, Comprar Agora, Acessar Loja')
                .setValue(config.botaoNome || 'Ver Produto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(40)
        )
    );

    await interaction.showModal(modal);
}


async function modalConfigImagem(interaction) {
    const config = stockAutoConfig.get('config') || {};
    const modal = new ModalBuilder()
        .setCustomId('stock_auto_modal_imagem')
        .setTitle('Configurar Imagem da Notificação');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('imagem_url')
                .setLabel('URL da Imagem (opcional)')
                .setPlaceholder('https://... (deixe vazio para remover)')
                .setValue(config.imagem || '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
        )
    );

    await interaction.showModal(modal);
}


async function handleModalCanal(interaction) {
    const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal) {
        return interaction.reply({ content: `${Emojis.get(`negative`) || ''} | Canal não encontrado com o ID \`${canalId}\`.`, flags: 64 });
    }

    stockAutoConfig.set(`config.canal`, canalId);
    await painelStockAuto(interaction);
    interaction.followUp({ content: `${Emojis.get(`checker`) || ''} | Canal definido como <#${canalId}>!`, flags: 64 });
}

async function handleModalMensagem(interaction) {
    const mensagem = interaction.fields.getTextInputValue('mensagem');
    const titulo = interaction.fields.getTextInputValue('titulo');
    const corEmbed = interaction.fields.getTextInputValue('cor_embed');

    stockAutoConfig.set('config.mensagem', mensagem);
    if (titulo) stockAutoConfig.set('config.titulo', titulo);
    if (corEmbed) stockAutoConfig.set(`config.corEmbed`, corEmbed);

    await painelStockAuto(interaction);
    interaction.followUp({ content: `${Emojis.get(`checker`) || ''} | Mensagem configurada com sucesso!`, flags: 64 });
}

async function handleModalFormato(interaction) {
    const formato = interaction.fields.getTextInputValue('formato').toLowerCase().trim();
    const formatosValidos = ['compv2', 'embed', `mensagem`];
    if (!formatosValidos.includes(formato)) {
        return interaction.reply({ content: `${Emojis.get(`negative`) || ''} | Formato inválido! Use: \`compv2\`, \`embed\` ou \`mensagem\`.`, flags: 64 });
    }

    stockAutoConfig.set(`config.formato`, formato);
    await painelStockAuto(interaction);
    interaction.followUp({ content: `${Emojis.get(`checker`) || ''} | Formato definido como \`${formato}\`!`, flags: 64 });
}

async function handleModalBotao(interaction) {
    const botaoNome = interaction.fields.getTextInputValue('botao_nome');
    stockAutoConfig.set(`config.botaoNome`, botaoNome);
    await painelStockAuto(interaction);
    interaction.followUp({ content: `${Emojis.get(`checker`) || ''} | Nome do botão definido como \`${botaoNome}\`!`, flags: 64 });
}

async function handleModalImagem(interaction) {
    const imagemUrl = interaction.fields.getTextInputValue('imagem_url').trim();
    if (imagemUrl) {
        stockAutoConfig.set('config.imagem', imagemUrl);
    } else {
        stockAutoConfig.delete(`config.imagem`);
    }

    await painelStockAuto(interaction);
    interaction.followUp({ content: `${Emojis.get(`checker`) || ``} | Imagem ${imagemUrl ? `configurada` : 'removida'} com sucesso!`, flags: 64 });
}


function processarVariaveis(texto, vars) {
    return texto
        .replace(/\{Produto\}/gi, vars.produto || 'N/A')
        .replace(/\{Stock\}/gi, vars.stock || '0')
        .replace(/\{StockTotal\}/gi, vars.stockTotal || '0')
        .replace(/\{Campo\}/gi, vars.campo || 'N/A');
}



async function notificarStockAdicionado(client, produtoNome, campoNome, qtdAdicionada, stockTotal, mensagensOuCanal) {
    try {
        const config = stockAutoConfig.get('config') || {};
        if (!config.status || !config.canal) return;

        const canal = await client.channels.fetch(config.canal).catch(() => null);
        if (!canal) return;

        const vars = {
            produto: produtoNome,
            campo: campoNome,
            stock: String(qtdAdicionada),
            stockTotal: String(stockTotal)
        };

        const mensagemBase = config.mensagem || 'O produto **{Produto}** acabou de receber stock!\n\nStock adicionado: `{Stock}`\nStock total: `{StockTotal}`\nCampo: `{Campo}`';
        const mensagemProcessada = processarVariaveis(mensagemBase, vars);
        const titulo = processarVariaveis(config.titulo || '🆕 Novo Stock!', vars);
        const formato = config.formato || 'compv2';
        const botaoNome = config.botaoNome || 'Ver Produto';
        const corEmbed = config.corEmbed || '#7c3aed';

        
        let linkUrl = null;
        const guildId = canal.guildId || canal.guild?.id;
        if (Array.isArray(mensagensOuCanal) && mensagensOuCanal.length > 0) {
            for (const m of mensagensOuCanal) {
                if (!m?.channelid) continue;
                try {
                    const ch = await client.channels.fetch(m.channelid).catch(() => null);
                    if (!ch) continue;
                    if (m.mesageid) {
                        const msg = await ch.messages.fetch(m.mesageid).catch(() => null);
                        if (msg) {
                            const gid = m.guildid || guildId;
                            linkUrl = `https://discord.com/channels/${gid}/${m.channelid}/${m.mesageid}`;
                            break;
                        }
                    } else {
                        linkUrl = `https://discord.com/channels/${guildId}/${m.channelid}`;
                        break;
                    }
                } catch (e2) {}
            }
        } else if (typeof mensagensOuCanal === 'string' && mensagensOuCanal) {
            
            linkUrl = `https://discord.com/channels/${guildId}/${mensagensOuCanal}`;
        }

        let rowBotao = null;
        if (linkUrl) {
            rowBotao = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(botaoNome)
                    .setURL(linkUrl)
                    .setStyle(5)
                    
            );
        }

        if (formato === 'embed') {
            const embed = new EmbedBuilder()
                .setColor(corEmbed)
                .setTitle(titulo)
                .setDescription(mensagemProcessada)
                .setFooter({ text: canal.guild?.name || 'Servidor' })
                .setTimestamp();

            if (config.imagem) embed.setImage(config.imagem);

            const payload = { embeds: [embed] };
            if (rowBotao) payload.components = [rowBotao];
            await canal.send(payload);

        } else if (formato === 'mensagem') {
            const payload = { content: `${titulo}\n\n${mensagemProcessada}` };
            if (rowBotao) payload.components = [rowBotao];
            await canal.send(payload);

        } else {
            
            const itens = [
                { type: 10, content: `**${titulo}**` },
                { type: 14 },
                { type: 10, content: mensagemProcessada }
            ];

            if (config.imagem) {
                itens.push({ type: 12, items: [{ media: { url: config.imagem }, spoiler: false }] });
            }

            if (linkUrl) {
                itens.push({
                    type: 1,
                    components: [{ type: 2, style: 5, label: botaoNome, url: linkUrl }]
                });
            }

            const containerContent = res.main(...itens);
            await canal.send(containerContent);
        }
    } catch (e) {
        console.error('[StockAutoNotify] Erro ao enviar notificação:', e.message);
    }
}


async function testarNotificacao(interaction, client) {
    const config = stockAutoConfig.get(`config`) || {};
    if (!config.canal) {
        return interaction.reply({ content: `${Emojis.get(`negative`) || ``} | Configure um canal primeiro!`, flags: 64 });
    }

    await interaction.reply({ content: `${Emojis.get(`loading`) || ''} Enviando notificação de teste...`, flags: 64 });

    
    const canalProdutos = interaction.guild.channels.cache.find(c => c.name.includes('produto') || c.name.includes('loja'));

    await notificarStockAdicionado(
        client,
        'Produto Exemplo',
        `Nitro Mensal`,
        50,
        150,
        canalProdutos?.id || config.canal
    );

    await interaction.editReply({ content: `${Emojis.get(`checker`) || ''} | Notificação de teste enviada em <#${config.canal}>!` });
}

module.exports = {
    painelStockAuto,
    modalConfigCanal,
    modalEditarMensagem,
    modalConfigFormato,
    modalConfigBotao,
    modalConfigImagem,
    handleModalCanal,
    handleModalMensagem,
    handleModalFormato,
    handleModalBotao,
    handleModalImagem,
    notificarStockAdicionado,
    testarNotificacao,
    stockAutoConfig
};