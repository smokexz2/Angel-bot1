const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType } = require("discord.js")
const { Emojis } = require("../database")
const { res } = require("../res")
const { JsonDatabase } = require("../database/jsondb");

function resolveEmoji(emojiStr) {
    if (!emojiStr || emojiStr === '') return undefined;
    if (/^\d+$/.test(emojiStr)) return { id: emojiStr };
    const match = emojiStr.match(/<a?:\w+:(\d+)>/);
    if (match) return { id: match[1] };
    return undefined;
}

const robuxConfig = new JsonDatabase({
    databasePath: "./database/configuracaorobux.json"
});

const mensagemRobux = new JsonDatabase({
    databasePath: "./database/mensagemrobux.json"
});


const MENSAGEM_PADRAO = {
    titulo: "Área de pedidos | Bot Robux",
    descricao: "> Olá! Seja bem-vindo(a) ao **Painel Oficial de Compras**, onde você pode adquirir **Robux** e **Gamepasses** com segurança, agilidade e atendimento profissional.",
    orientacoes: "• Revise todas as informações antes de abrir um ticket.\n• Certifique-se de estar com os dados corretos de sua conta.\n• Para **Gamepasses**: desative preços regionais antes da compra.\n• Compras feitas com valores regionais incorretos **não possuem reembolso**.",
    rodape: "Escolha uma opção para solicitar o seu pedido",
    horario: "08:00 - 23:00",
    suporte: null
};

async function painelRobux(interaction) {
    const statusRobux = robuxConfig.get(`config.status`) || false;
    const statusGamepass = robuxConfig.get(`config.statusGamepass`) || false;
    
    const valorRobux = robuxConfig.get(`config.valores.robux`) || "Não definido";
    const valorGamepass = robuxConfig.get(`config.valores.gamepass`) || "Não definido";
    
    const limiteRobux = robuxConfig.get(`config.limites.robux`) || "Não definido";
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || "Não definido";
    const minimoRobux = robuxConfig.get(`config.limites.minimoRobux`) || "Não definido";
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || "Não definido";

    const canalIniciadas = robuxConfig.get(`config.canais.iniciadas`);
    const canalCanceladas = robuxConfig.get(`config.canais.canceladas`);
    const canalAprovadas = robuxConfig.get(`config.canais.aprovadas`);
    const canalPublicas = robuxConfig.get(`config.canais.publicas`);
    const categoriaCarrinhos = robuxConfig.get(`config.canais.categoriaCarrinhos`);

    const statusRobuxText = statusRobux 
        ? `${Emojis.get('checker') ||''} **Robux:** Ativado` 
        : `${Emojis.get('negative') ||''} **Robux:** Desativado`;

    const statusGamepassText = statusGamepass 
        ? `${Emojis.get('checker') ||''} **Gamepass:** Ativado` 
        : `${Emojis.get('negative') || ''} **Gamepass:** Desativado`;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar00")
            .setLabel(`Voltar`)
            .setEmoji(Emojis.get('_back_emoji') || '1178068047202893869')
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema NobSupply Bux` },
        { type: 14 },
        { type: 10, content: `**Painel de Configuração do Bot**\nUse o menu abaixo para gerenciar as configurações do seu bot.` },
        { type: 14 },
        { type: 10, content: `**Status da Loja**\n\n> ${statusRobuxText}\n> ${statusGamepassText}` },
        { type: 14 },
        { type: 10, content: `**Valores Configurados (a cada 1000 Robux)**\n\n>  **Valor Robux:** \`R$ ${valorRobux}\`\n>  **Valor Gamepass:** \`R$ ${valorGamepass}\`` },
        { type: 14 },
        { type: 10, content: `**Limites Configurados**\n\n>  **Limite Robux:** \`${limiteRobux}\`\n>  **Limite Gamepass:** \`${limiteGamepass}\`\n>  **Mínimo Robux:** \`${minimoRobux}\`\n>  **Mínimo Gamepass:** \`${minimoGamepass}\`` },
        { type: 14 },
        { type: 10, content: `**Canais Configurados**\n\n>  **Compras Iniciadas:** ${canalIniciadas ? `<#${canalIniciadas}>` : `\`Não definido\``}\n>  **Compras Canceladas:** ${canalCanceladas ? `<#${canalCanceladas}>` : `\`Não definido\``}\n>  **Compras Aprovadas:** ${canalAprovadas ? `<#${canalAprovadas}>` : `\`Não definido\``}\n>  **Compras Públicas:** ${canalPublicas ? `<#${canalPublicas}>` : `\`Não definido\``}\n>  **Categoria Carrinhos:** ${categoriaCarrinhos ? `<#${categoriaCarrinhos}>` : `\`Não definido\``}` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "robux_status_select",
                placeholder: "Selecione o status da loja",
                options: [
                    { label: "Ativar Robux", description: "Ativa o sistema de Robux", value: "ativar_robux", emoji: { id: "1387981762050920548" } },
                    { label: "Desativar Robux", description: "Desativa o sistema de Robux", value: "desativar_robux", emoji: { id: "1387981760649756782" } },
                    { label: "Ativar Gamepass", description: "Ativa o sistema de Gamepass", value: "ativar_gamepass", emoji: { id: "1387981762050920548" } },
                    { label: "Desativar Gamepass", description: "Desativa o sistema de Gamepass", value: "desativar_gamepass", emoji: { id: "1387981760649756782" } }
                ]
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Mensagem", emoji: { id: "1178066208835252266" }, custom_id: "robux_config_mensagem" },
                { type: 2, style: 2, label: "Configurar Valores", emoji: { id: "1178080366871973958" }, custom_id: "robux_config_valores" },
                { type: 2, style: 2, label: "Configurar Limites", emoji: { id: "1178080828933283960" }, custom_id: "robux_config_limites" }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Canais", emoji: { id: "1178086608004722689" }, custom_id: "robux_config_canais" },
                { type: 2, style: 2, label: "Personalizar Bot", emoji: { id: "1178080828933283960" }, custom_id: "robux_personalizar" }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: "Produtos por Jogo Roblox", emoji: { id: "1459388854715940968" }, custom_id: "gpj_painel_main" },
                { type: 2, style: 1, label: "Calculadora Robux", emoji: { id: "1178077123882262628" }, custom_id: "painel_calculadora" }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Gerenciar Cupons", ...(resolveEmoji(Emojis.get('_camp_emoji')) ? { emoji: resolveEmoji(Emojis.get('_camp_emoji')) } : {}), custom_id: "robux_gerenciar_cupons" },
                { type: 2, style: 2, label: "Configurar Termos", ...(resolveEmoji(Emojis.get('codigocopia')) ? { emoji: resolveEmoji(Emojis.get('codigocopia')) } : {}), custom_id: "robux_config_termos" }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.update(containerContent);
        } else {
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        console.error('[PainelRobux] Erro ao responder:', e.message);
    }
}

async function painelConfigMensagem(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const statusMensagem = mensagemCustom ? "Mensagem Personalizada" : "Usando Mensagem Padrão";

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_robux_painel")
            .setLabel(`Voltar`)
            
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Nob Bux > Configurar Mensagem` },
        { type: 14 },
        { type: 10, content: `> **Personalização da Mensagem de Compra**` },
        { type: 10, content: `**Status:**\n> ${mensagemCustom ? `${Emojis.get('checker') ||''}` : `${Emojis.get('info') || `ℹ️`}`} ${statusMensagem}` },
        { type: 10, content: `**Informações:**\n> Caso a mensagem não esteja configurada, iremos usar a **mensagem padrão** do sistema.` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: "Enviar Mensagem", emoji: { id: "1178076954029731930" }, custom_id: "robux_enviar_mensagem" },
                { type: 2, style: 2, label: "Configurar Painel", emoji: { id: "1178077123882262628" }, custom_id: "robux_configurar_container" },
                { type: 2, style: 2, label: "Visualizar", emoji: { id: "1178066208835252266" }, custom_id: "robux_visualizar_mensagem" }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Configurar Textos do Carrinho", emoji: { id: "1178080366871973958" }, custom_id: "robux_config_painel" }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.update(containerContent);
        } else {
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        console.error('[PainelRobux] Erro ao responder:', e.message);
    }
}

async function enviarMensagemRobux(interaction, channelId, client) {
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return false;
    }

    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const blocoImagem = msg.imagem ? [{ type: 14 }, { type: 12, items: [{ media: { url: msg.imagem }, spoiler: false }] }] : [];

    const horarioText = msg.horario ? `${Emojis.get('relogio')||''} **Horários de Entrega:** ${msg.horario}` : ``;
    const suporteText = msg.suporte ? `${Emojis.get('antena')||''} **Contatar Suporte:** <#${msg.suporte}>` : ``;
    const extraInfo = [horarioText, suporteText].filter(Boolean).join(`\n`);

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get('robux') || Emojis.get('controller') ||''} Menu de compras` },
        { type: 14 },
        ...blocoImagem,
        { type: 10, content: msg.descricao },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checkrobux') || Emojis.get('checker') || ''} **Orientações**\n${msg.orientacoes}` },
        ...(extraInfo ? [{ type: 14 }, { type: 10, content: extraInfo }] : []),
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: "Comprar Robux", emoji: { id: "1459388854715940968" }, custom_id: "robux_comprar_robux_btn" },
                { type: 2, style: 1, label: "Gamepasses e Itens", emoji: { id: "1387981737501393058" }, custom_id: "robux_comprar_gamepass_btn" }
            ]
        }
    ).with({
        components: []
    });

    try {
        await channel.send(containerContent);
        return true;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return false;
    }
}

async function modalConfigurarContainer(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_configurar_container')
        .setTitle('Configurar Container');

    const inputTitulo = new TextInputBuilder()
        .setCustomId('container_titulo')
        .setLabel('Título')
        .setPlaceholder('Digite o título da mensagem')
        .setValue(msg.titulo || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const inputDescricao = new TextInputBuilder()
        .setCustomId('container_descricao')
        .setLabel('Descrição')
        .setPlaceholder('Digite a descrição da mensagem')
        .setValue(msg.descricao || '')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const inputOrientacoes = new TextInputBuilder()
        .setCustomId('container_orientacoes')
        .setLabel('Orientações (use • para cada item)')
        .setPlaceholder('• Orientação 1\n• Orientação 2')
        .setValue(msg.orientacoes || '')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const inputRodape = new TextInputBuilder()
        .setCustomId('container_rodape')
        .setLabel('Rodapé')
        .setPlaceholder('Digite o rodapé da mensagem')
        .setValue(msg.rodape || '')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(200);

    const inputImagem = new TextInputBuilder()
        .setCustomId('container_imagem')
        .setLabel('URL da Imagem (opcional)')
        .setPlaceholder('https://... (deixe vazio para remover)')
        .setValue((msg.imagem || ''))
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(500);

    const inputHorario = new TextInputBuilder()
        .setCustomId('container_horario')
        .setLabel('Horário de Entrega (ex: 08:00 - 23:00)')
        .setPlaceholder('08:00 - 23:00')
        .setValue((msg.horario || ''))
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(50);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputTitulo),
        new ActionRowBuilder().addComponents(inputDescricao),
        new ActionRowBuilder().addComponents(inputOrientacoes),
        new ActionRowBuilder().addComponents(inputHorario),
        new ActionRowBuilder().addComponents(inputImagem)
    );

    await interaction.showModal(modal);
}

async function handleModalConfigurarContainer(interaction) {
    const titulo = interaction.fields.getTextInputValue('container_titulo');
    const descricao = interaction.fields.getTextInputValue('container_descricao');
    const orientacoes = interaction.fields.getTextInputValue('container_orientacoes');
    const horario = interaction.fields.getTextInputValue('container_horario').trim();
    const imagem = interaction.fields.getTextInputValue(`container_imagem`).trim();

    const novaMsg = {
        titulo: titulo,
        descricao: descricao,
        orientacoes: orientacoes,
        rodape: "Escolha uma opção para solicitar o seu pedido",
        horario: horario || null,
        imagem: imagem || null
    };

    mensagemRobux.set(`mensagemCustom`, novaMsg);
    
    await painelConfigMensagem(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') ||''} | Container configurado com sucesso!`, flags: 64 });
}

async function visualizarMensagem(interaction) {
    const mensagemCustom = mensagemRobux.get(`mensagemCustom`);
    const msg = mensagemCustom || MENSAGEM_PADRAO;

    const blocoImagemViz = msg.imagem ? [{ type: 14 }, { type: 12, items: [{ media: { url: msg.imagem }, spoiler: false }] }] : [];

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get('robux')} Área de pedidos | Bot Robux` },
        { type: 14 },
        ...blocoImagemViz,
        { type: 10, content: msg.descricao },
        { type: 14 },
        { type: 10, content: `${Emojis.get('checkrobux')} **Orientações**\n${msg.orientacoes}` },
        { type: 14 },
        { type: 10, content: msg.rodape },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "robux_preview_select",
                placeholder: "Escolha uma opção para solicitar o seu pedido",
                options: [
                    { label: "Comprar Robux", description: "Solicitar compra de Robux", value: "comprar_robux", emoji: { id: "1459388854715940968" } },
                    { label: "Comprar Gamepass", description: "Solicitar compra de Gamepass", value: "comprar_gamepass", id: { name: "1387981737501393058" } }
                ]
            }]
        }
    ).with({
        components: [],
        flags: [64]
    });

    await interaction.reply(containerContent);
}

async function configCanaisRobux(interaction) {
    const canalIniciadas = robuxConfig.get(`config.canais.iniciadas`);
    const canalCanceladas = robuxConfig.get(`config.canais.canceladas`);
    const canalAprovadas = robuxConfig.get(`config.canais.aprovadas`);
    const canalPublicas = robuxConfig.get(`config.canais.publicas`);
    const categoriaCarrinhos = robuxConfig.get(`config.canais.categoriaCarrinhos`);
    const canalGamepass = robuxConfig.get(`config.canais.gamepass`);
    const canalLogRobux = robuxConfig.get(`config.canais.logRobux`);
    const canalLogCupons = robuxConfig.get(`config.canais.logCupons`);

    const row1 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`robux_select_canal`)
                .addOptions(
                    { value: `canal_iniciadas`, label: `Canal de Compras Iniciadas`, emoji: `1246953187529855037` },
                    { value: `canal_canceladas`, label: `Canal de Compras Canceladas`, emoji: `1246953442283618334` },
                    { value: `canal_aprovadas`, label: `Canal de Compras Aprovadas`, emoji: `1246955020050759740` },
                    { value: `canal_publicas`, label: `Canal de Compras de Robux`, emoji: `1246955006242983936` },
                    { value: `canal_gamepass`, label: `Canal de Produtos Gamepass`, emoji: `1459388854715940968` },
                    { value: `canal_log_robux`, label: `Canal de Logs de Vendas Robux`, emoji: `1246955020050759740` },
                    { value: `canal_log_cupons`, label: `Canal de Logs de Cupons`, emoji: `1246953187529855037` },
                    { value: `categoria_carrinhos`, label: `Categoria de Carrinhos`, emoji: `1246953149009367173` }
                )
                .setPlaceholder(`Clique aqui para redefinir algum canal`)
                .setMaxValues(1)
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar_robux_painel")
            .setLabel('Voltar')
            .setEmoji(`1238413255886639104`)
            .setStyle(2)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema Nob Bux > Configurar Canais` },
        { type: 14 },
        { type: 10, content: `**Configurar Canais do Sistema de Robux**` },
        { type: 14 },
        { type: 10, content: `> **Canal de Compras Iniciadas:** ${canalIniciadas ? `<#${canalIniciadas}>` : `Não definido`}\n> **Canal de Compras Canceladas:** ${canalCanceladas ? `<#${canalCanceladas}>` : `Não definido`}\n> **Canal de Compras Aprovadas:** ${canalAprovadas ? `<#${canalAprovadas}>` : `Não definido`}\n> **Canal de Robux (público):** ${canalPublicas ? `<#${canalPublicas}>` : `Não definido`}\n> **Canal de Gamepass (produtos por jogo):** ${canalGamepass ? `<#${canalGamepass}>` : `Não definido`}\n> **Logs de Vendas Robux (separado):** ${canalLogRobux ? `<#${canalLogRobux}>` : `Não definido`}\n> **Logs de Cupons Utilizados:** ${canalLogCupons ? `<#${canalLogCupons}>` : `Não definido`}\n> **Categoria de Carrinhos:** ${categoriaCarrinhos ? `<#${categoriaCarrinhos}>` : `Não definido`}` }
    ).with({
        components: [row1, row2],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.update(containerContent);
        } else {
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        console.error('[PainelRobux] Erro ao responder:', e.message);
    }
}

async function modalConfigValores(interaction) {
    const valorRobux = robuxConfig.get(`config.valores.robux`) || "";
    const valorGamepass = robuxConfig.get(`config.valores.gamepass`) || "";

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_valores')
        .setTitle('Configuração de Valores de Robux');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('valor_robux').setLabel('Valor Do Robux (1000x Robux)').setPlaceholder('Digite o valor do Robux').setValue(valorRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('valor_gamepass').setLabel('Valor Do Gamepass (1000x Robux)').setPlaceholder('Digite o valor do Gamepass').setValue(valorGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        )
    );

    await interaction.showModal(modal);
}

async function modalConfigLimites(interaction) {
    const limiteRobux = robuxConfig.get(`config.limites.robux`) || "";
    const limiteGamepass = robuxConfig.get(`config.limites.gamepass`) || "";
    const minimoRobux = robuxConfig.get(`config.limites.minimoRobux`) || "";
    const minimoGamepass = robuxConfig.get(`config.limites.minimoGamepass`) || "";

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_limites')
        .setTitle('Configuração de Limites de Compras');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('limite_robux').setLabel('Limite De Robux').setPlaceholder('Digite o limite de Robux').setValue(limiteRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('limite_gamepass').setLabel('Limite De Gamepass').setPlaceholder('Digite o limite de Gamepass').setValue(limiteGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('minimo_robux').setLabel('Valor Mínimo De Robux').setPlaceholder('Digite o valor mínimo de Robux').setValue(minimoRobux.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('minimo_gamepass').setLabel('Valor Mínimo De Gamepass').setPlaceholder('Digite o valor mínimo de Gamepass').setValue(minimoGamepass.toString()).setStyle(TextInputStyle.Short).setRequired(false)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalValores(interaction) {
    const valorRobux = interaction.fields.getTextInputValue('valor_robux');
    const valorGamepass = interaction.fields.getTextInputValue(`valor_gamepass`);

    if (valorRobux) {
        if (isNaN(valorRobux)) return interaction.reply({ content: `${Emojis.get('negative') ||''} | O valor do Robux deve ser um número!`, flags: 64 });
        robuxConfig.set(`config.valores.robux`, valorRobux);
    } else {
        robuxConfig.delete(`config.valores.robux`);
    }

    if (valorGamepass) {
        if (isNaN(valorGamepass)) return interaction.reply({ content: `${Emojis.get('negative') ||''} | O valor do Gamepass deve ser um número!`, flags: 64 });
        robuxConfig.set(`config.valores.gamepass`, valorGamepass);
    } else {
        robuxConfig.delete(`config.valores.gamepass`);
    }

    await painelRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || ''} | Valores configurados com sucesso!`, flags: 64 });
}

async function handleModalLimites(interaction) {
    const limiteRobux = interaction.fields.getTextInputValue('limite_robux');
    const limiteGamepass = interaction.fields.getTextInputValue('limite_gamepass');
    const minimoRobux = interaction.fields.getTextInputValue('minimo_robux');
    const minimoGamepass = interaction.fields.getTextInputValue('minimo_gamepass');

    const campos = [
        { valor: limiteRobux, key: 'config.limites.robux', nome: 'limite de Robux' },
        { valor: limiteGamepass, key: 'config.limites.gamepass', nome: 'limite de Gamepass' },
        { valor: minimoRobux, key: 'config.limites.minimoRobux', nome: 'valor mínimo de Robux' },
        { valor: minimoGamepass, key: 'config.limites.minimoGamepass', nome: `valor mínimo de Gamepass` }
    ];

    for (const campo of campos) {
        if (campo.valor) {
            if (isNaN(campo.valor)) return interaction.reply({ content: `${Emojis.get('negative') ||''} | O ${campo.nome} deve ser um número!`, flags: 64 });
            robuxConfig.set(campo.key, campo.valor);
        } else {
            robuxConfig.delete(campo.key);
        }
    }

    await painelRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || ''} | Limites configurados com sucesso!`, flags: 64 });
}

async function modalConfigurarPainel(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const msg = mensagemRobux.get('mensagemCustom') || MENSAGEM_PADRAO;

    const modal = new ModalBuilder()
        .setCustomId('robux_modal_configurar_painel')
        .setTitle('Configurar Textos do Carrinho');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('painel_bem_vindo')
                .setLabel('Título de Boas-Vindas do Carrinho')
                .setPlaceholder(`${Emojis.get('_cart_emoji')||''} Bem-vindo(a) ao atendimento!`)
                .setValue(cfgCarrinho.titulo || '')
                .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('painel_termos')
                .setLabel('Termos do Carrinho (use \n para nova linha)')
                .setPlaceholder(`${Emojis.get('_diamond_emoji')||''} Ao clicar em Iniciar Compra, você concorda...`)
                .setValue(cfgCarrinho.termos || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('painel_nick_descricao')
                .setLabel('Texto da Etapa de Usuário Roblox')
                .setPlaceholder('Olá! Para que você receba seus robux, precisamos...')
                .setValue(cfgCarrinho.nickDescricao || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(800)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('painel_gamepass_titulo')
                .setLabel('Título Carrinho Gamepass')
                .setPlaceholder(`${Emojis.get('thunder')||''} Olá! Seja bem-vindo(a) ao atendimento!`)
                .setValue(cfgCarrinho.gamepassTitulo || '')
                .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(200)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('painel_suporte_canal')
                .setLabel('Canal de Suporte (ID; vazio = remover)')
                .setPlaceholder('Ex: 1234567890')
                .setValue(msg.suporte ? String(msg.suporte) : '')
                .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(30)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalConfigurarPainel(interaction) {
    const bemVindo = interaction.fields.getTextInputValue('painel_bem_vindo').trim();
    const termos = interaction.fields.getTextInputValue('painel_termos').trim();
    const nickDescricao = interaction.fields.getTextInputValue('painel_nick_descricao').trim();
    const gamepassTitulo = interaction.fields.getTextInputValue('painel_gamepass_titulo').trim();
    const supCanal = interaction.fields.getTextInputValue('painel_suporte_canal').trim();

    const cfgCarrinho = {};
    if (bemVindo) cfgCarrinho.titulo = bemVindo;
    if (termos) cfgCarrinho.termos = termos;
    if (nickDescricao) cfgCarrinho.nickDescricao = nickDescricao;
    if (gamepassTitulo) cfgCarrinho.gamepassTitulo = gamepassTitulo;
    mensagemRobux.set('configCarrinho', cfgCarrinho);

    const msgAtual = mensagemRobux.get('mensagemCustom') || { ...MENSAGEM_PADRAO };
    if (supCanal) msgAtual.suporte = supCanal;
    else delete msgAtual.suporte;
    mensagemRobux.set(`mensagemCustom`, msgAtual);

    await painelConfigMensagem(interaction);
    interaction.followUp({ content: `${Emojis.get('checker') || ''} | Textos do carrinho configurados com sucesso!`, flags: 64 }).catch(() => {});
}


async function painelCuponsRobux(interaction) {
    const cupons = robuxConfig.get('config.cupons') || {};
    const lista = Object.entries(cupons);
    const agora = Date.now();

    let resumo = '_Nenhum cupom cadastrado._';
    if (lista.length > 0) {
        resumo = lista.slice(-10).map(([cod, c]) => {
            const expirado = c.validade && agora > c.validade;
            const status = !c.ativo ? `${Emojis.get('negative')||''} Inativo` : expirado ? `${Emojis.get('warn_emoji')||''} Expirado` : `${Emojis.get('checker')||''} Ativo`;
            const val = c.validade ? '<t:' + Math.floor(c.validade / 1000) + ':d>' : 'Sem prazo';
            return '`' + cod + '` — **' + c.desconto + '%** | Usos: ' + (c.usoTotal || 0) + (c.maxTotalUsos ? '/' + c.maxTotalUsos : '') + ' | Máx/pessoa: ' + (c.maxUsoPorUsuario || '∞') + ' | Val: ' + val + ' | ' + status;
        }).join('\n');
        if (lista.length > 10) resumo += '\n_...e mais ' + (lista.length - 10) + '_';
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId('voltar_robux_painel').setLabel('Voltar').setStyle(2); const e = resolveEmoji(Emojis.get('_back_emoji')); if (e) b.setEmoji(e); return b; })()
    );

    const containerContent = res.main(
        { type: 10, content: '-# Painel > Sistema Robux > Gerenciar Cupons' },
        { type: 14 },
        { type: 10, content: '**Cupons Cadastrados (' + lista.length + ')**\n' + resumo },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 3, label: 'Criar Cupom', custom_id: 'robux_cupom_criar', ...(resolveEmoji(Emojis.get('_add_emoji')) ? { emoji: resolveEmoji(Emojis.get('_add_emoji')) } : {}) },
                { type: 2, style: 4, label: 'Remover Cupom', custom_id: 'robux_cupom_remover', ...(resolveEmoji(Emojis.get('_trash_emoji')) ? { emoji: resolveEmoji(Emojis.get('_trash_emoji')) } : {}) },
                { type: 2, style: 2, label: 'Ativar/Desativar', custom_id: 'robux_cupom_toggle', ...(resolveEmoji(Emojis.get('reload')) ? { emoji: resolveEmoji(Emojis.get('reload')) } : {}) }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.update(containerContent);
        } else {
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        console.error('[PainelRobux] Erro ao responder:', e.message);
    }
}

async function modalCriarCupomRobux(interaction) {
    const modal = new ModalBuilder().setCustomId('robux_modal_criar_cupom').setTitle('Criar Cupom de Desconto');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_codigo').setLabel('Código (maiúsculas, sem espaço)')
                .setPlaceholder('Ex: DESCONTO10').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_desconto').setLabel('Percentual de Desconto (1-100)')
                .setPlaceholder('Ex: 10').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_validade').setLabel('Validade DD/MM/AAAA (vazio = sem prazo)')
                .setPlaceholder('Ex: 31/12/2026').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(10)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_max_usuario').setLabel('Máx. de usos por pessoa (0 = ilimitado)')
                .setPlaceholder('Ex: 1').setValue('1').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(5)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_max_total').setLabel('Máx. de usos totais (0 = ilimitado)')
                .setPlaceholder('Ex: 100').setValue('0').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(7)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalCriarCupomRobux(interaction) {
    const codigo = interaction.fields.getTextInputValue('cupom_codigo').trim().toUpperCase().replace(/\s/g, '');
    const descontoStr = interaction.fields.getTextInputValue('cupom_desconto').trim().replace(/[^0-9]/g, '');
    const validadeStr = interaction.fields.getTextInputValue('cupom_validade').trim();
    const maxUsuarioStr = interaction.fields.getTextInputValue('cupom_max_usuario').trim().replace(/[^0-9]/g, '');
    const maxTotalStr = interaction.fields.getTextInputValue('cupom_max_total').trim().replace(/[^0-9]/g, '');

    if (!codigo || codigo.length < 2)
        return interaction.reply({ content: `${Emojis.get('negative')||''} | Código inválido! Use ao menos 2 caracteres, sem espaços.`, flags: 64 });

    const desconto = parseInt(descontoStr);
    if (isNaN(desconto) || desconto < 1 || desconto > 100)
        return interaction.reply({ content: `${Emojis.get('negative')||''} | Percentual inválido! Use um valor entre 1 e 100.`, flags: 64 });

    let validade = null;
    if (validadeStr) {
        const partes = validadeStr.split('/');
        if (partes.length !== 3)
            return interaction.reply({ content: `${Emojis.get('negative')||''} | Formato de data inválido! Use DD/MM/AAAA.`, flags: 64 });
        const [dia, mes, ano] = partes.map(Number);
        const dataValidade = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
        if (isNaN(dataValidade.getTime()) || dataValidade < new Date())
            return interaction.reply({ content: `${Emojis.get('negative')||''} | Data inválida ou já expirada!`, flags: 64 });
        validade = dataValidade.getTime();
    }

    const maxUsoPorUsuario = parseInt(maxUsuarioStr) || 0;
    const maxTotalUsos = parseInt(maxTotalStr) || 0;

    const cupons = robuxConfig.get('config.cupons') || {};
    cupons[codigo] = {
        ativo: true,
        desconto,
        validade,
        maxUsoPorUsuario: maxUsoPorUsuario > 0 ? maxUsoPorUsuario : null,
        maxTotalUsos: maxTotalUsos > 0 ? maxTotalUsos : null,
        usoTotal: 0,
        usuarios: {}
    };
    robuxConfig.set('config.cupons', cupons);

    const valTxt = validade ? '<t:' + Math.floor(validade / 1000) + ':d>' : 'Sem prazo';
    await interaction.reply({
        content: `${Emojis.get('checker')||''} | Cupom ${codigo} criado!\n> ${Emojis.get('_camp_emoji')||''} Desconto: **${desconto}%**\n> ${Emojis.get('date_emoji')||''} Validade: ${valTxt}\n> ${Emojis.get('user')||''} Máx/pessoa: ${maxUsoPorUsuario > 0 ? maxUsoPorUsuario : 'Ilimitado'}\n> 🔢 Máx total: ${maxTotalUsos > 0 ? maxTotalUsos : 'Ilimitado'}`,
        flags: 64
    });
    await painelCuponsRobux(interaction);
}

async function modalRemoverCupomRobux(interaction) {
    const modal = new ModalBuilder().setCustomId('robux_modal_remover_cupom').setTitle('Remover Cupom');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_remover_codigo').setLabel('Código do Cupom para remover')
                .setPlaceholder('Ex: DESCONTO10').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalRemoverCupomRobux(interaction) {
    const codigo = interaction.fields.getTextInputValue('cupom_remover_codigo').trim().toUpperCase();
    const cupons = robuxConfig.get('config.cupons') || {};
    if (!cupons[codigo])
        return interaction.reply({ content: `${Emojis.get('negative')||''} | Cupom ${codigo} não encontrado!`, flags: 64 });
    delete cupons[codigo];
    robuxConfig.set('config.cupons', cupons);
    await interaction.reply({ content: `${Emojis.get('checker')||''} | Cupom ${codigo} removido com sucesso!`, flags: 64 });
    await painelCuponsRobux(interaction);
}

async function modalToggleCupomRobux(interaction) {
    const modal = new ModalBuilder().setCustomId('robux_modal_toggle_cupom').setTitle('Ativar / Desativar Cupom');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cupom_toggle_codigo').setLabel('Código do Cupom')
                .setPlaceholder('Ex: DESCONTO10').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
        )
    );
    await interaction.showModal(modal);
}

async function handleModalToggleCupomRobux(interaction) {
    const codigo = interaction.fields.getTextInputValue('cupom_toggle_codigo').trim().toUpperCase();
    const cupons = robuxConfig.get('config.cupons') || {};
    if (!cupons[codigo])
        return interaction.reply({ content: `${Emojis.get('negative')||''} | Cupom ${codigo} não encontrado!`, flags: 64 });
    cupons[codigo].ativo = !cupons[codigo].ativo;
    robuxConfig.set('config.cupons', cupons);
    const estado = cupons[codigo].ativo ? `${Emojis.get('checker')||''} Ativado` : `${Emojis.get('negative')||''} Desativado`;
    await interaction.reply({ content: `${Emojis.get('checker')||''} | Cupom ${codigo} agora está **${estado}**!`, flags: 64 });
    await painelCuponsRobux(interaction);
}

async function painelTermosRobux(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const t = cfgCarrinho.termosConfig || {};

    const todosCampos = [];
    for (let i = 1; i <= 10; i++) {
        if (t[`campo${i}`]) todosCampos.push(`**${i}.** ${t[`campo${i}`]}`);
    }
    const preview = todosCampos.length > 0 ? todosCampos.join('\n') : '_Nenhum termo configurado_';
    const seguranca = t.seguranca || '_Não configurado_';

    const rowVoltar = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId('voltar_robux_painel').setLabel('Voltar').setStyle(2); const e = resolveEmoji(Emojis.get('_back_emoji')); if (e) b.setEmoji(e); return b; })()
    );

    const containerContent = res.main(
        { type: 10, content: '-# Painel > WinnBuxx > Configurar Termos' },
        { type: 14 },
        { type: 10, content: `**Termos configurados:** \`${todosCampos.length}/10\`\n\n${preview}` },
        { type: 14 },
        { type: 10, content: `**Aviso de Segurança:**\n${seguranca}` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 1, label: 'Editar Termos 1–5', ...(resolveEmoji(Emojis.get('codigocopia')) ? { emoji: resolveEmoji(Emojis.get('codigocopia')) } : {}), custom_id: 'robux_modal_termos_1' },
                { type: 2, style: 2, label: 'Editar Termos 6–10', ...(resolveEmoji(Emojis.get('codigocopia')) ? { emoji: resolveEmoji(Emojis.get('codigocopia')) } : {}), custom_id: 'robux_modal_termos_3' },
                { type: 2, style: 4, label: 'Aviso de Segurança', ...(resolveEmoji(Emojis.get('negative')) ? { emoji: resolveEmoji(Emojis.get('negative')) } : {}), custom_id: 'robux_modal_termos_2' }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.update(containerContent);
        } else {
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        console.error('[PainelRobux] Erro ao responder termos:', e.message);
    }
}

async function modalConfigurarTermos1(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const t = cfgCarrinho.termosConfig || {};

    const modal = new ModalBuilder()
        .setCustomId('robux_handle_termos_1')
        .setTitle('Termos de Compra — Campos 1 a 5');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo1')
                .setLabel('Termo 1 (obrigatório)')
                .setPlaceholder('Ex: Ao clicar em Iniciar Compra, você concorda com os termos...')
                .setValue(t.campo1 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo2')
                .setLabel('Termo 2 (obrigatório)')
                .setPlaceholder('Ex: As informações fornecidas são de responsabilidade do comprador.')
                .setValue(t.campo2 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo3')
                .setLabel('Termo 3 (obrigatório)')
                .setPlaceholder('Ex: Nossa equipe está disponível apenas pelos canais oficiais.')
                .setValue(t.campo3 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo4')
                .setLabel('Termo 4 (opcional)')
                .setPlaceholder('Ex: Compras com valores regionais incorretos não possuem reembolso.')
                .setValue(t.campo4 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo5')
                .setLabel('Termo 5 (opcional)')
                .setPlaceholder('Ex: Não nos responsabilizamos por atrasos causados pelo cliente.')
                .setValue(t.campo5 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalTermos1(interaction) {
    const campo1 = interaction.fields.getTextInputValue('termo_campo1').trim();
    const campo2 = interaction.fields.getTextInputValue('termo_campo2').trim();
    const campo3 = interaction.fields.getTextInputValue('termo_campo3').trim();
    const campo4 = interaction.fields.getTextInputValue('termo_campo4').trim();
    const campo5 = interaction.fields.getTextInputValue('termo_campo5').trim();

    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    if (!cfgCarrinho.termosConfig) cfgCarrinho.termosConfig = {};
    cfgCarrinho.termosConfig.campo1 = campo1;
    cfgCarrinho.termosConfig.campo2 = campo2;
    cfgCarrinho.termosConfig.campo3 = campo3;
    if (campo4) cfgCarrinho.termosConfig.campo4 = campo4;
    if (campo5) cfgCarrinho.termosConfig.campo5 = campo5;
    mensagemRobux.set('configCarrinho', cfgCarrinho);

    await painelTermosRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Termos 1–5 salvos com sucesso!`, flags: 64 }).catch(() => {});
}

async function modalConfigurarTermos3(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const t = cfgCarrinho.termosConfig || {};

    const modal = new ModalBuilder()
        .setCustomId('robux_handle_termos_3')
        .setTitle('Termos de Compra — Campos 6 a 10');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo6')
                .setLabel('Termo 6 (opcional)')
                .setPlaceholder('Ex: Pedidos cancelados pelo comprador não terão reembolso.')
                .setValue(t.campo6 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo7')
                .setLabel('Termo 7 (opcional)')
                .setPlaceholder('Ex: O prazo de entrega pode variar conforme a demanda.')
                .setValue(t.campo7 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo8')
                .setLabel('Termo 8 (opcional)')
                .setPlaceholder('Ex: Valores promocionais são válidos apenas durante o período vigente.')
                .setValue(t.campo8 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo9')
                .setLabel('Termo 9 (opcional)')
                .setPlaceholder('Ex: Ao comprar, você confirma ter lido e aceito todos os termos acima.')
                .setValue(t.campo9 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_campo10')
                .setLabel('Termo 10 (opcional)')
                .setPlaceholder('Termo adicional...')
                .setValue(t.campo10 || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalTermos3(interaction) {
    const campos = {};
    for (let i = 6; i <= 10; i++) {
        const val = interaction.fields.getTextInputValue(`termo_campo${i}`).trim();
        if (val) campos[`campo${i}`] = val;
    }

    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    if (!cfgCarrinho.termosConfig) cfgCarrinho.termosConfig = {};
    Object.assign(cfgCarrinho.termosConfig, campos);
    mensagemRobux.set('configCarrinho', cfgCarrinho);

    await painelTermosRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Termos 6–10 salvos com sucesso!`, flags: 64 }).catch(() => {});
}

async function modalConfigurarTermos2(interaction) {
    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    const t = cfgCarrinho.termosConfig || {};

    const modal = new ModalBuilder()
        .setCustomId('robux_handle_termos_2')
        .setTitle('Configurar Aviso de Segurança');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('termo_seguranca')
                .setLabel('Aviso de Segurança')
                .setPlaceholder('Ex: Jamais oferecemos produtos por mensagens privadas.')
                .setValue(t.seguranca || '')
                .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)
        )
    );

    await interaction.showModal(modal);
}

async function handleModalTermos2(interaction) {
    const seguranca = interaction.fields.getTextInputValue('termo_seguranca').trim();

    const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
    if (!cfgCarrinho.termosConfig) cfgCarrinho.termosConfig = {};
    if (seguranca) cfgCarrinho.termosConfig.seguranca = seguranca;
    mensagemRobux.set('configCarrinho', cfgCarrinho);

    await painelTermosRobux(interaction);
    interaction.followUp({ content: `${Emojis.get('checker')||''} | Aviso de segurança configurado com sucesso!`, flags: 64 }).catch(() => {});
}

function buildTermosText(cfgCarrinho) {
    const t = (cfgCarrinho || {}).termosConfig || {};
    const campos = [];
    for (let i = 1; i <= 10; i++) {
        if (t[`campo${i}`]) campos.push(t[`campo${i}`]);
    }
    if (campos.length > 0) {
        return campos.map(c => `${Emojis.get('_diamond_emoji')||'◆'} ${c}`).join('\n');
    }
    return `${Emojis.get('_diamond_emoji')||'◆'} Ao clicar em **Iniciar Compra**, você concorda com os termos e diretrizes da loja.\n${Emojis.get('_diamond_emoji')||'◆'} As informações fornecidas são de responsabilidade do comprador.\n${Emojis.get('_diamond_emoji')||'◆'} Nossa equipe está disponível apenas pelos canais oficiais do servidor.`;
}

function buildSegurancaText(cfgCarrinho) {
    const t = (cfgCarrinho || {}).termosConfig || {};
    return t.seguranca || '• Jamais oferecemos produtos ou suporte por mensagens privadas.\n• Recebeu algo fora do bot ou do servidor? **Ignore. É golpe.**';
}

module.exports = {
    painelRobux,
    painelConfigMensagem,
    modalConfigurarPainel,
    handleModalConfigurarPainel,
    configCanaisRobux,
    modalConfigValores,
    modalConfigLimites,
    handleModalValores,
    handleModalLimites,
    modalConfigurarContainer,
    handleModalConfigurarContainer,
    visualizarMensagem,
    enviarMensagemRobux,
    robuxConfig,
    mensagemRobux,
    painelCuponsRobux,
    modalCriarCupomRobux,
    handleModalCriarCupomRobux,
    modalRemoverCupomRobux,
    handleModalRemoverCupomRobux,
    modalToggleCupomRobux,
    handleModalToggleCupomRobux,
    painelTermosRobux,
    modalConfigurarTermos1,
    handleModalTermos1,
    modalConfigurarTermos2,
    handleModalTermos2,
    modalConfigurarTermos3,
    handleModalTermos3,
    buildTermosText,
    buildSegurancaText
}