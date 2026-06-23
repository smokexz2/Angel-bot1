const { ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { tickets } = require("../database")
const { res } = require("../res")
const emojis = require("../database/emojis.json")

const Emojis = {
    get: (name) => emojis[name] || ""
};


async function painelTicket(interaction) {
    const paineis = tickets.get(`tickets.paineis`) || {};
    const paineisArray = Object.keys(paineis);
    const totalPaineis = paineisArray.length;

    let totalPostados = 0;
    for (const painelId of paineisArray) {
        const mensagens = paineis[painelId]?.mensagens || [];
        totalPostados += mensagens.length;
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("voltar00").setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const selectOptions = paineisArray.length > 0 
        ? paineisArray.slice(0, 25).map(painelId => {
            const painel = paineis[painelId];
            return {
                label: painel.titulo || "Sem titulo",
                description: `Categorias: ${Object.keys(painel.funcoes || {}).length}`,
                value: painelId,
                emoji: { id: "1461201396090278072" }
            };
        })
        : [{ label: "Nenhum painel criado", value: "none", emoji: { id: "1178076767567757312" } }];

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket` },
        { type: 14 },
        { type: 10, content: `## Gerenciar Tickets` },
        { type: 14 },
        { type: 10, content: `> Utilize este painel para gerenciar o sistema de Ticket no seu servidor.` },
        { type: 14 },
        { type: 10, content: `### Detalhes` },
        { type: 10, content: `**Informacoes**\n> \`|\` Total Paineis Criados: **${totalPaineis}**\n> \`|\` Total de Paineis Postados no Servidor: **${totalPostados}**` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "ticket_selecionar_painel", placeholder: "Selecione um Ticket para gerenciar", options: selectOptions, disabled: paineisArray.length === 0 }] },
        { type: 1, components: [{ type: 2, style: 3, label: 'Criar Ticket', custom_id: 'ticket_criar_painel', emoji: { id: '1178067873894236311' } }] }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        if (interaction.message == undefined) {
            await interaction.reply(containerContent);
        } else {
            if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
            await interaction.editReply(containerContent);
        }
    } catch (e) {
        try { await interaction.followUp({ content: '❌ Erro ao abrir painel de tickets.', flags: 64 }); } catch {}
    }
}



async function ModalCriarPainelTicket(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_criar_painel_ticket')
        .setTitle('Criar Ticket')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_titulo').setLabel('Titulo')
                    .setPlaceholder('Digite o titulo do painel').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_descricao').setLabel('Descricao')
                    .setPlaceholder('Digite a descricao do painel').setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('ticket_banner').setLabel('Banner (opcional)')
                    .setPlaceholder('Coloque a URL do banner').setStyle(TextInputStyle.Short).setRequired(false)
            )
        );
    await interaction.showModal(modal);
}


async function HandleCriarPainelTicket(interaction) {
    const titulo = interaction.fields.getTextInputValue('ticket_titulo');
    const descricao = interaction.fields.getTextInputValue('ticket_descricao');
    const banner = interaction.fields.getTextInputValue(`ticket_banner`);

    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    
    if (banner && !urlRegex.test(banner)) {
        return interaction.reply({ content: `${Emojis.get(`negative`)} | URL do banner invalida!`, flags: 64 });
    }

    const painelId = `ticket_${Date.now()}`;
    const painelData = {
        id: painelId, titulo, descricao,
        cor: "#5865F2", funcoes: {}, mensagens: [], modoExibicao: "embed",
        criadoEm: Date.now(), criadoPor: interaction.user.id
    };
    
    
    if (banner) {
        painelData.banner = banner;
    }
    
    tickets.set(`tickets.paineis.${painelId}`, painelData);

    await painelTicket(interaction);
    await interaction.followUp({ content: `${Emojis.get(`checker`)} | Painel **${titulo}** criado com sucesso!`, flags: 64 });
}



async function PaginaGerenciarPainel(interaction, painelId) {
    const painel = tickets.get(`tickets.paineis.${painelId}`);
    if (!painel) {
        return interaction.reply({ content: `${Emojis.get(`negative`)} | Painel nao encontrado!`, flags: 64 });
    }

    const funcoes = painel.funcoes || {};
    const funcoesArray = Object.keys(funcoes);
    const modoExibicao = painel.modoExibicao || "embed";
    const mensagensPostadas = painel.mensagens?.length || 0;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_voltar_lista").setLabel('Voltar').setEmoji(`1178068047202893869`).setStyle(2)
    );

    const selectOptions = [
        { label: "Editar", value: `editar_${painelId}`, emoji: { id: "1178066208835252266" }, description: "Editar titulo, descricao, banner e icone" },
        { label: "Categorias", value: `categorias_${painelId}`, emoji: { id: "1178163524443316285" }, description: "Gerenciar funcoes do ticket" },
        { label: "Alterar modo de exibicao", value: `exibicao_${painelId}`, emoji: { id: "1178077123882262628" }, description: `Atual: ${modoExibicao === "embed" ? "Embed" : "Component V2"}` },
        { label: "Apagar", value: `apagar_${painelId}`, emoji: { id: "1178076767567757312" }, description: "Deletar este painel" },
        { label: "Enviar", value: `enviar_${painelId}`, emoji: { id: "1178076954029731930" }, description: "Postar ticket em um canal" },
        { label: "Sincronizar", value: `sincronizar_${painelId}`, emoji: { id: "1178077123882262628" }, description: "Atualizar mensagens postadas" }
    ];

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Ticket > ${painel.titulo}` },
        { type: 14 },
        { type: 10, content: `## Gerenciar: ${painel.titulo}` },
        { type: 14 },
        { type: 10, content: `### Informacoes Gerais` },
        { type: 10, content: `> **Categorias Criadas:** \`${funcoesArray.length}\`\n> **Modo de Exibicao:** \`${modoExibicao === "embed" ? "Embed" : "Component V2"}\`\n> **Mensagens Postadas:** \`${mensagensPostadas}\`` },
        { type: 14 },
        { type: 1, components: [{ type: 3, custom_id: "ticket_acoes_select", placeholder: "Selecione uma opcao...", options: selectOptions }] },
        { type: 1, components: [{ type: 2, style: 2, label: `Ver Preview`, custom_id: `ticket_preview_${painelId}`, emoji: { id: `1178066208835252266` } }] }
    ).with({ components: [rowVoltar], flags: [64] });

    try {
        await interaction.update(containerContent);
    } catch {
        try { await interaction.editReply(containerContent); } catch { await interaction.reply(containerContent); }
    }
}


module.exports = { painelTicket, ModalCriarPainelTicket, HandleCriarPainelTicket, PaginaGerenciarPainel };