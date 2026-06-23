const { ActionRowBuilder, ButtonBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const { produtos, EmojisHelper } = require("../database");
const { res } = require("../res");
const fs = require("fs");
const path = require("path");
const startTime = Date.now();

const Emojis = EmojisHelper;

function safeEmoji(name) {
    const e = EmojisHelper.get(name);
    return (e && e.trim().length > 0) ? e : null;
}

function applyEmoji(btn, name, fallback) {
    const e = safeEmoji(name);
    const f = e || fallback;
    if (f && f.trim().length > 0) btn.setEmoji(f);
    return btn;
}

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();
    if (hora < 12) return 'Bom dia';
    else if (hora < 18) return 'Boa tarde';
    else return 'Boa noite';
}

function emojiObj(name, fallback) {
    const fallbackMap = {
        bag: '🏪',
        ticket: '🎫',
        chart: '📊',
        colors: '🎨',
        settings: '⚙️',
        shield: '🛡️',
        cloud: '☁️',
        config: '🔧',
        gift: '🎁',
        announcement: '📢',
        diamond: '💎',
        commands: '📜',
        controller: '🎮',
        folder: '📁',
        members: '👥',
        embed: '🖼️',
        card: '💳',
        cardbox: '🔳',
        coin: '🪙',
        alert: '⚠️',
        robot: '🤖',
        bulb: '💡',
        back: '↩️'
    };
    const value = safeEmoji(name);
    if (value && /^<a?:\w+:\d+>$/.test(value)) {
        const parts = value.match(/^<(a?):(\w+):(\d+)>$/);
        return { name: parts[2], id: parts[3], animated: parts[1] === 'a' };
    }
    if (value && /^\p{Extended_Pictographic}/u.test(value)) return { name: value };
    const fb = fallbackMap[fallback] || fallbackMap[name] || '▪️';
    return { name: fb };
}

function btn(id, label, emojiName, fallback, style = 2) {
    return { type: 2, style, custom_id: id, label, emoji: emojiObj(emojiName, fallback) };
}

function option(label, description, value, emojiName, fallback) {
    return { label, description, value, emoji: emojiObj(emojiName, fallback) };
}

function selectMenu(id, placeholder, options) {
    return { type: 1, components: [{ type: 3, custom_id: id, placeholder, min_values: 1, max_values: 1, options }] };
}

function backRow() {
    return { type: 1, components: [btn('voltar00', 'Voltar ao painel', '_back_emoji', '↩️')] };
}

function getBannerAttachment() {
    const bannerPath = path.join(__dirname, '../Assets/painel_banner.jpg');
    try {
        if (fs.existsSync(bannerPath)) return new AttachmentBuilder(fs.readFileSync(bannerPath), { name: 'painel_banner.jpg' });
    } catch (e) {}
    return null;
}

function basePanelHeader(client, interaction, bannerAttachment) {
    const epro = Emojis.get('epro') || Emojis.get('_settings_emoji') || '';
    const antena = Emojis.get('antena') || '';
    const relogio = Emojis.get('relogio') || '';
    return [
        ...(bannerAttachment ? [{ type: 12, items: [{ media: { url: 'attachment://painel_banner.jpg' }, spoiler: false }] }, { type: 14 }] : []),
        { type: 10, content: `-# WinnBuxx - Painel Principal` },
        { type: 14 },
        { type: 10, content: `# ${epro} Painel de Configuração\nOlá ${interaction.user}, **${getSaudacao().toLowerCase()}**!\n> Configure sua loja, tickets, proteção, pagamentos e adicionais em páginas separadas.\n> ${antena} **Ping:** \`${client.ws.ping} ms\`\n> ${relogio} **Online:** <t:${Math.ceil(startTime / 1000)}:R>` },
        { type: 14 }
    ];
}

function panelButton(id, label, emojiName, fallbackName, style = 2) {
    return btn(id, label, emojiName, fallbackName, style);
}

async function Painel(interaction, client) {
    const bannerAttachment = getBannerAttachment();
    const containerContent = res.main(
        ...basePanelHeader(client, interaction, bannerAttachment),
        { type: 10, content: `## Categorias\n> Clique em uma categoria para abrir as opções específicas. Os selects aparecem somente dentro da página escolhida.` },
        { type: 1, components: [
            panelButton('panel_cat_loja', 'Loja', 'sacola', 'bag'),
            panelButton('panel_cat_ticket', 'Tickets', 'ticketpanel', 'ticket'),
            panelButton('rendimento', 'Rendimentos', 'financepanel', 'chart')
        ] },
        { type: 1, components: [
            panelButton('panel_cat_personalizacao', 'Personalização', 'panelpersonalizado', 'colors'),
            panelButton('panel_cat_configuracoes', 'Configurações', '_settings_emoji', 'settings'),
            panelButton('panel_cat_protecao', 'Proteção', 'sucesso', 'shield')
        ] },
        { type: 1, components: [
            panelButton('panel_cat_autorizacoes', 'Autorizações', 'ecloud', 'cloud'),
            panelButton('panel_cat_adicionais', 'Adicionais', 'configpanel', 'config')
        ] }
    ).with({ flags: [MessageFlags.Ephemeral], ...(bannerAttachment ? { files: [bannerAttachment] } : {}) });

    try {
        if (interaction.isButton?.() || interaction.isStringSelectMenu?.()) return interaction.update(containerContent).catch(() => interaction.editReply(containerContent));
        if (!interaction.replied && !interaction.deferred) return interaction.reply(containerContent);
        return interaction.editReply(containerContent);
    } catch (err) {
        console.error('[Painel] Erro ao responder:', err.message);
    }
}

async function PainelCategoria(interaction, client, categoria) {
    const titles = {
        loja: 'Loja',
        ticket: 'Tickets',
        personalizacao: 'Personalização',
        configuracoes: 'Configurações',
        protecao: 'Proteção',
        autorizacoes: 'Autorizações',
        adicionais: 'Adicionais'
    };
    const icons = {
        loja: Emojis.get('sacola') || Emojis.get('bag') || '',
        ticket: Emojis.get('ticketpanel') || Emojis.get('ticket') || '',
        personalizacao: Emojis.get('panelpersonalizado') || Emojis.get('colors') || '',
        configuracoes: Emojis.get('_settings_emoji') || Emojis.get('settings') || '',
        protecao: Emojis.get('sucesso') || Emojis.get('shield') || '',
        autorizacoes: Emojis.get('ecloud') || Emojis.get('cloud') || '',
        adicionais: Emojis.get('configpanel') || Emojis.get('config') || ''
    };
    const descriptions = {
        loja: 'Produtos, vendas, estoque, gift cards, Robux, scripts, ranking e filas de apostas.',
        ticket: 'Atendimento, painéis de tickets, categorias e formulário staff.',
        personalizacao: 'Boas-vindas, mensagens automáticas, GIFs e feedbacks.',
        configuracoes: 'Pagamentos, cargos, canais, QR Code, moeda, IMAP e integrações gerais.',
        protecao: 'Moderação, verificação, captcha, antifake, warns e segurança.',
        autorizacoes: 'Permissões do painel, autenticação, eCloud, WinnBuxx e cargos administrativos.',
        adicionais: 'Sorteios, IA, sugestões e utilidades extras.'
    };
    const menus = {
        loja: selectMenu('panel_select_loja', 'Selecione uma função da loja', [
            option('Sistema de Vendas', 'Produtos, estoque, saldo e afiliados', 'painelconfigvendas', 'sacola', 'bag'),
            option('Gift Cards', 'Criar e gerenciar gift cards', 'painelgiftcard', 'codigo', 'gift'),
            option('Aviso de Stock', 'Notificações automáticas de estoque', 'painelstockauto', 'antena', 'announcement'),
            option('Ranking Compradores', 'Ranking de clientes por compras', 'painelrankingcompras', 'chart', 'chart'),
            option('WinnBuxx Robux', 'Produtos e pagamentos Robux', 'painelconfigrobux', 'robux', 'diamond'),
            option('Scripts Roblox', 'Jogos, scripts e produtos digitais', 'painelconfigscripts', 'commands', 'commands'),
            option('Filas de Apostas', 'Canais e filas de apostas', 'painelconfigfilas', 'controller', 'controller')
        ]),
        ticket: selectMenu('panel_select_ticket', 'Selecione uma função de tickets', [
            option('Sistema Ticket', 'Criar e gerenciar painéis de atendimento', 'painelconfigticket', 'ticketpanel', 'ticket'),
            option('Formulário Staff', 'Sistema de formulário da equipe', 'painelformulario', '_settings_emoji', 'folder')
        ]),
        personalizacao: selectMenu('panel_select_personalizacao', 'Selecione uma função de personalização', [
            option('Boas Vindas', 'Mensagens de entrada no servidor', 'painelconfigbv', 'welcomepanel', 'members'),
            option('Ações Automáticas', 'Rotinas e repostagens automáticas', 'eaffaawwawa', 'comerciopanel', 'settings'),
            option('GIFs Automáticos', 'Disparos automáticos de GIFs', 'painelgifs', 'antena', 'announcement'),
            option('Monitor Feedbacks', 'Monitoramento de avaliações', 'painel_feedback_monitor', 'robotemoji', 'embed')
        ]),
        configuracoes: selectMenu('panel_select_configuracoes', 'Selecione uma configuração', [
            option('Configurações Gerais', 'Preferências gerais do bot', 'gerenciarconfigs', '_settings_emoji', 'settings'),
            option('Formas de Pagamento', 'Pix, Efi, Mercado Pago e outros métodos', 'formasdepagamentos', 'dinheiro', 'card'),
            option('Cargos e Permissões', 'Configurar cargos usados pelos sistemas', 'configcargos', 'configpanel', 'config'),
            option('QR Code', 'Configurar QR Code e mensagens', 'configqrcode', 'codigo', 'cardbox'),
            option('Moeda', 'Configurar moeda e valores', 'moedaconfig', 'dinheiro', 'coin'),
            option('IMAP', 'Configurar leitura de e-mails', 'ecloud', 'cloud')
        ]),
        protecao: selectMenu('panel_select_protecao', 'Selecione uma função de proteção', [
            option('Moderação', 'Logs, reports, cargos e proteção', 'sistemamoderacao', 'negative', 'shield'),
            option('Verificação Captcha', 'Proteção de entrada por captcha', 'painelverificacao', 'sucesso', 'shield'),
            option('Anti Fake', 'Proteções de entrada e boas-vindas', 'configantifake', 'alert', 'alert')
        ]),
        autorizacoes: selectMenu('panel_select_autorizacoes', 'Selecione uma autorização', [
            option('Permissões do Painel', 'Gerenciar usuários autorizados no painel', 'painelpermissions', 'ecloud', 'cloud'),
            option('WinnBuxx', 'Configurar integração e autenticação principal', 'sistemaauth', 'ecloud', 'cloud'),
            option('Configurar Auth', 'Credenciais e rotas de autenticação', 'configauth', 'sucesso', 'shield'),
            option('eCloud', 'Abrir configurações do eCloud', 'ecloud', 'ecloud', 'cloud')
        ]),
        adicionais: selectMenu('panel_select_adicionais', 'Selecione uma função adicional', [
            option('Sistema de Sorteios', 'Criar e administrar sorteios', 'sistemasorteios', 'configpanel', 'gift'),
            option('Sistema IA', 'Configurar recursos inteligentes', 'painelistema', 'robotemoji', 'robot'),
            option('Sugestões', 'Sistema de sugestões do servidor', 'sistemasugestoes', 'welcomepanel', 'bulb')
        ])
    };
    const containerContent = res.main(
        { type: 10, content: `# ${icons[categoria] || ''} ${titles[categoria] || 'Categoria'}\n> ${descriptions[categoria] || 'Selecione uma função abaixo para continuar.'}` },
        { type: 14 },
        menus[categoria] || menus.loja,
        { type: 14 },
        backRow()
    ).with({ flags: [MessageFlags.Ephemeral] });
    if (interaction.replied || interaction.deferred) return interaction.editReply(containerContent);
    if (interaction.isButton?.() || interaction.isStringSelectMenu?.()) return interaction.update(containerContent).catch(() => interaction.reply(containerContent));
    return interaction.reply(containerContent);
}

async function Gerenciar2(interaction, client) {

    const ggg = produtos.valueArray();

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar00")
                .setLabel('Voltar')
                
                .setStyle(2)
        )

    const caixagrande = Emojis.get('caixagrande') || Emojis.get('caixagrande') || '';

    const containerContent = res.main(
        { type: 10, content: `## Sistema de Vendas\n> Configure produtos, cargos de ranking, estoque, saldo e afiliados em uma sessão privada.` },
        { type: 14 },
        { type: 10, content: `${getSaudacao()} Senhor(a) **${interaction.user.username}**, aqui você gerencia todos os produtos da loja.` },
        { type: 14 },
        { type: 10, content: `> ${caixagrande} **Produtos Criados:** \`${ggg.length}\`` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "gerenciar_produtos_menu",
                placeholder: "Selecione uma opção",
                options: [
                    { label: "Criar Produto", description: "Criar um novo produto na loja", value: "criarrrr", emoji: { id: "1178067873894236311" } },
                    { label: "Gerenciar Produtos", description: "Gerenciar produtos existentes", value: "gerenciarotemae", emoji: { id: "1178067945855910078" } },
                    { label: "Cargos Rank", description: "Configurar cargos de ranking", value: "gerenciarposicao", emoji: { id: "1178086608004722689" } },
                    { label: "Painel de Solicitar Stock", description: "Configurar painel de solicitação de estoque", value: "painel-solicitar-stock", emoji: { id: "1459316241490776197" } },
                    { label: "Sistema de Saldo", description: "Em desenvolvimento", value: "sistemasaldo", emoji: { id: "1459050684824682517" } },
                    { label: "Sistema de Afiliado", description: "Em desenvolvimento", value: "sistemaafiliado", emoji: { id: "1459050649244401745" } }
                ]
            }]
        },
        { type: 14 },
        rowVoltar
    ).with({
        flags: [MessageFlags.Ephemeral]
    });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.followUp({ content: `${Emojis.get('negative')||''} Erro ao abrir painel de vendas.`, flags: [64] }); } catch {}
    }
}

module.exports = { Painel, Gerenciar2, PainelCategoria }