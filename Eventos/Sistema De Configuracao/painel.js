const Discord = require("discord.js")
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { Painel, Gerenciar2, PainelCategoria } = require("../../Functions/Painel");
const { PainelPermissions, ModalAdicionarPerm, ModalRemoverPerm, HandleAdicionarPerm, HandleRemoverPerm, HandleResetarPerms } = require("../../Functions/gerenciarpermsadm.js");
const { Gerenciar } = require("../../Functions/Gerenciar");
const { configqrcode } = require("../../Functions/QRCode.js");
const { infosauth } = require("../../Functions/infosauth");
const { gerenciarPerms } = require("../../Functions/modUsersPerms");
const { configauth } = require("../../Functions/eCloudConfigs");
const { automatico } = require("../../Functions/automaticos");
const { infoauth } = require("../../Functions/infoauth");
const { auth02api: ecloudAuthPanel } = require("../../Functions/eCloudConfig");      
const { ConfigRoles } = require("../../Functions/ConfigRoles");
const { EstatisticasStorm } = require("../../index.js");
const { profileuser } = require("../../Functions/profile");
const { misticConfigs } = require("../../Functions/misticpayconfig.js");
const { produtos, configuracao, tickets } = require("../../database");
const { Posicao1 } = require("../../Functions/PosicoesFunction.js");
const { painelTicket, ModalCriarPainelTicket, HandleCriarPainelTicket, PaginaGerenciarPainel } = require("../../Functions/PainelTickets.js");
const { PaginaCategorias, ModalAddFuncaoTicket, HandleAddFuncaoTicket, PaginaRemoverFuncao, HandleRemoverFuncao } = require("../../Functions/TicketCategorias.js");
const { PreviewTicket, AlternarExibicao, HandleDeletarPainel, ModalEditarPainel, HandleEditarPainel, PostarTicket, SincronizarTicket } = require("../../Functions/TicketAcoes.js");
const { SistemaSugestao } = require("../../Functions/sugestao.js");
const { msgbemvindo } = require("../../Functions/MensagemBemVindo");
const { AcoesRepostAutomatics } = require("../../Functions/ConfigRepostAuto.js");
const { CreateMessageTicket, Checkarmensagensticket } = require("../../Functions/CreateMensagemTicket.js");
const { CreateTicket } = require("../../Functions/CreateTicket.js");
const { GerenciarCampos2 } = require("../../Functions/GerenciarCampos.js");
const { moedaConfig } = require("../../Functions/moedaConfig.js");
const { FormasDePagamentos } = require("../../Functions/FormasDePagamentosConfig.js");
const { MessageStock } = require("../../Functions/ConfigEstoque.js");
const { auth02api } = require("../../Functions/configurarauth02.js");
const { imapConfigs } = require("../../Functions/configinter.js")
const { painelRobux, painelConfigMensagem, modalConfigurarPainel, handleModalConfigurarPainel, configCanaisRobux, modalConfigValores, modalConfigLimites, handleModalValores, handleModalLimites, modalConfigurarContainer, handleModalConfigurarContainer, visualizarMensagem, enviarMensagemRobux, robuxConfig, mensagemRobux, painelCuponsRobux, modalCriarCupomRobux, handleModalCriarCupomRobux, modalRemoverCupomRobux, handleModalRemoverCupomRobux, modalToggleCupomRobux, handleModalToggleCupomRobux, painelTermosRobux, modalConfigurarTermos1, handleModalTermos1, modalConfigurarTermos2, handleModalTermos2, modalConfigurarTermos3, handleModalTermos3, buildTermosText, buildSegurancaText } = require("../../Functions/PainelRobux.js")
const { criarCarrinhoRobux, modalNickRoblox, handleModalNickRoblox,
    mostrarStepNick, mostrarVerificacaoPerfil, confirmarPerfil,
    mostrarCarrinhoRobuxPrincipal, modalAlterarQuantidadeCarrinho, handleModalAlterarQuantidadeCarrinho,
    mostrarSelecaoJogosGamepass, mostrarCarrinhoGamepassJogo, cancelarCompra, atualizarGamepasses, carrinhosRobux, voltarParaGamepasses, mostrarCheckout, mostrarRevisaoPedido, modalQuantidadeRobux, handleModalQuantidadeRobux, buscarGamepassesParaMetodo, modalGamepassInfo, handleModalGamepassInfo } = require("../../Functions/CarrinhoRobux.js")
const { irParaPagamentoRobux, copiarPixRobux, mostrarModalNomeBancoImap } = require("../../Functions/PagamentoRobux.js")
const { confirmarEntregaRobux } = require("../../Functions/VerificarPagamentoRobux.js")
const { PainelSorteios, ModalCriarSorteio, PaginaSetarTempo, PaginaEscolherCanal, PaginaGerenciarCargos, EnviarMensagemSorteio, ModalTempoPersonalizado, parseTime, gerarIdSorteio, rerollSorteio, gerarListaParticipantes, atualizarEmbedSorteio, PaginaGerenciarSorteios, PaginaGerenciarSorteioEspecifico, PaginaConfirmarForcarFinalizacao, PaginaConfirmarDescontinuar, ModalAdicionarTempo, descontinuarSorteio, forcarFinalizacao } = require("../../Functions/PainelSorteios.js")
const { sorteios } = require("../../database")
const { res } = require("../../res")
const EventEmitter = require("events");
const emojis = require("../../database/emojis.json");


const Emojis = {
    get: (name) => emojis[name] || ""
};

function moedaBR(valor) {
    return `R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function rendimentoSvg(dados, titulo) {
    const valores = dados.map(x => Number(x.valor || 0));
    const max = Math.max(...valores, 1);
    const bars = dados.map((x, i) => {
        const h = Math.max(18, Math.round((Number(x.valor || 0) / max) * 190));
        const xPos = 85 + i * 155;
        const y = 260 - h;
        return `<rect x="${xPos}" y="${y}" width="92" height="${h}" rx="16" fill="#7c3aed"/><text x="${xPos + 46}" y="292" text-anchor="middle" fill="#e5e7eb" font-size="22" font-family="Arial">${x.label}</text><text x="${xPos + 46}" y="${y - 12}" text-anchor="middle" fill="#ffffff" font-size="18" font-family="Arial">${moedaBR(x.valor)}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="360" viewBox="0 0 760 360"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111827"/><stop offset="1" stop-color="#2e1065"/></linearGradient></defs><rect width="760" height="360" rx="34" fill="url(#bg)"/><rect x="28" y="26" width="704" height="308" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)"/><text x="50" y="72" fill="#ffffff" font-size="32" font-weight="700" font-family="Arial">${titulo}</text><text x="50" y="104" fill="#c4b5fd" font-size="18" font-family="Arial">Resumo financeiro automático da loja</text><line x1="58" y1="264" x2="704" y2="264" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>${bars}</svg>`;
}

async function enviarRendimentosVisual(interaction, periodo = 'totalrendimento') {
    const hoje = await EstatisticasStorm.SalesToday();
    const semana = await EstatisticasStorm.SalesWeek();
    const mes = await EstatisticasStorm.SalesMonth();
    const total = await EstatisticasStorm.SalesTotal();
    const labels = {
        todayyyy: ['Rendimento de hoje', 'Resumo das últimas 24 horas', hoje],
        '7daysss': ['Rendimento dos últimos 7 dias', 'Resumo semanal de vendas aprovadas', semana],
        '30dayss': ['Rendimento dos últimos 30 dias', 'Resumo mensal de vendas aprovadas', mes],
        totalrendimento: ['Rendimento total', 'Histórico completo de vendas aprovadas', total]
    };
    const atual = labels[periodo] || labels.totalrendimento;
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('todayyyy').setLabel('Hoje').setStyle(periodo === 'todayyyy' ? 3 : 2),
        new ButtonBuilder().setCustomId('7daysss').setLabel('7 dias').setStyle(periodo === '7daysss' ? 3 : 2),
        new ButtonBuilder().setCustomId('30dayss').setLabel('30 dias').setStyle(periodo === '30dayss' ? 3 : 2),
        new ButtonBuilder().setCustomId('totalrendimento').setLabel('Total').setStyle(periodo === 'totalrendimento' ? 3 : 2),
        new ButtonBuilder().setCustomId('voltar00').setLabel('Voltar').setStyle(2).setEmoji({ id: '1500295082660593845' })
    );
    const dadosGrafico = [
        { label: 'Hoje', valor: hoje.rendimentoTotal },
        { label: '7 dias', valor: semana.rendimentoTotal },
        { label: '30 dias', valor: mes.rendimentoTotal },
        { label: 'Total', valor: total.rendimentoTotal }
    ];
    const svg = rendimentoSvg(dadosGrafico, atual[0]);
    const file = new Discord.AttachmentBuilder(Buffer.from(svg), { name: 'rendimentos.svg' });
    const ticketMedio = atual[2].quantidadeTotal > 0 ? atual[2].rendimentoTotal / atual[2].quantidadeTotal : 0;
    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get('financepanel') || Emojis.get('dinheiro') || ''} ${atual[0]}\n> ${atual[1]}. Use os botões para alternar o período.` },
        { type: 14 },
        { type: 12, items: [{ media: { url: 'attachment://rendimentos.svg' }, spoiler: false }] },
        { type: 14 },
        { type: 10, content: `## Indicadores\n> **Rendimento:** \`${moedaBR(atual[2].rendimentoTotal)}\`\n> **Pedidos aprovados:** \`${atual[2].quantidadeTotal}\`\n> **Produtos entregues:** \`${atual[2].produtosEntregue}\`\n> **Ticket médio:** \`${moedaBR(ticketMedio)}\`` },
        { type: 14 },
        row
    ).with({ flags: [64], files: [file] });
    if (interaction.replied || interaction.deferred) return interaction.editReply(containerContent);
    if (interaction.isButton?.() || interaction.isStringSelectMenu?.()) return interaction.update(containerContent).catch(() => interaction.reply(containerContent));
    return interaction.reply(containerContent);
}

async function PainelRendimentosDashboard(interaction) {
    return enviarRendimentosVisual(interaction, 'totalrendimento');
}


async function mostrarPaginaProdutos(interaction, page = 0) {
    const { res } = require("../../res");
    const ggg = produtos.fetchAll();
    const ITEMS_PER_PAGE = 25;
    const totalPages = Math.ceil(ggg.length / ITEMS_PER_PAGE);
    
    
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    if (totalPages === 0) page = 0;
    
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, ggg.length);
    const currentProducts = ggg.slice(startIndex, endIndex);
    
    const options = currentProducts.map(gggg => {
        let desc = gggg?.data?.Config?.desc;
        let aaaaaa;

        if (desc == undefined) {
            desc = "Não definido";
        }
        if (desc && desc.length > 0) {
            aaaaaa = desc.slice(0, 70);
        } else {
            aaaaaa = "Não definido";
        }

        let name = gggg?.data?.Config?.name;
        if (name == undefined) {
            name = "Não definido";
        }

        return {
            label: `${name}`,
            description: `${aaaaaa}`,
            value: gggg.ID,
            emoji: { id: "1178163524443316285" },
        };
    });

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voltar3")
            .setLabel("Voltar")
            .setEmoji(`1178068047202893869`)
            .setStyle(2)
    );

    if (ggg.length === 0) {
        const containerContent = res.main(
            { type: 10, content: `-# Painel > Sistema de Vendas > Gerenciar Produtos` },
            { type: 14 },
            { type: 10, content: `**Gerenciar Produtos**` },
            { type: 14 },
            { type: 10, content: `${Emojis.get('negative')} Nenhum produto cadastrado ainda.` }
        ).with({
            components: [rowVoltar],
            flags: [64]
        });
        await interaction.update(containerContent);
        return;
    }

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas > Gerenciar Produtos` },
        { type: 14 },
        { type: 10, content: `${interaction.user} Qual produto deseja gerenciar?` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "configproduto_page",
                placeholder: `Selecione um produto (Página ${page + 1}/${totalPages})`,
                options: options
            }]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 2, custom_id: `produtos_page_${page - 1}`, emoji: { id: `1460477624206889093` }, disabled: page === 0 },
                { type: 2, style: 2, custom_id: 'disabled_middle', emoji: { id: `1178163524443316285` }, disabled: true },
                { type: 2, style: 2, custom_id: `produtos_page_${page + 1}`, emoji: { id: `1460477653030146089` }, disabled: page >= totalPages - 1 }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });
    
    await interaction.update(containerContent);
}


module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.type == Discord.InteractionType.ModalSubmit) {

            
            if (interaction.customId === 'modal_renomear_ticket') {
                const novoNome = interaction.fields.getTextInputValue(`novo_nome_ticket`);
                
                try {
                    await interaction.channel.setName(novoNome);
                    await interaction.reply({ content: `${Emojis.get('checker')} | Ticket renomeado para **${novoNome}**!`, flags: 64 });
                } catch (error) {
                    await interaction.reply({ content: `${Emojis.get('negative')} | Erro ao renomear ticket.`, flags: 64 });
                }
                return;
            }

            
            if (interaction.customId === 'modal_adicionar_usuario_ticket') {
                const userId = interaction.fields.getTextInputValue(`usuario_id_adicionar`);
                
                try {
                    const user = await interaction.guild.members.fetch(userId);
                    await interaction.channel.members.add(user.id);
                    await interaction.reply({ content: `${Emojis.get('checker')} | ${user} foi adicionado ao ticket!`, flags: 64 });
                    await interaction.channel.send({ content: `${Emojis.get('checker')} | ${user} foi adicionado ao ticket por ${interaction.user}.` });
                } catch (error) {
                    await interaction.reply({ content: `${Emojis.get('negative')} | Usuário não encontrado ou erro ao adicionar.`, flags: 64 });
                }
                return;
            }

            
            if (interaction.customId === 'modal_remover_usuario_ticket') {
                const userId = interaction.fields.getTextInputValue(`usuario_id_remover`);
                
                try {
                    const user = await interaction.guild.members.fetch(userId);
                    await interaction.channel.members.remove(user.id);
                    await interaction.reply({ content: `${Emojis.get('checker')} | ${user} foi removido do ticket!`, flags: 64 });
                    await interaction.channel.send({ content: `${Emojis.get('negative')} | ${user} foi removido do ticket por ${interaction.user}.` });
                } catch (error) {
                    await interaction.reply({ content: `${Emojis.get('negative')} | Usuário não encontrado ou erro ao remover.`, flags: 64 });
                }
                return;
            }

            if (interaction.customId == 'sdaju11111231idsj1233js123dua123') {
                let NOME = interaction.fields.getTextInputValue('tokenMP');
                let PREDESC = interaction.fields.getTextInputValue('tokenMP2');
                let DESC = interaction.fields.getTextInputValue('tokenMP3');
                let BANNER = interaction.fields.getTextInputValue('tokenMP5');
                let EMOJI = interaction.fields.getTextInputValue('tokenMP6');

                NOME = NOME.replace('.', '');
                PREDESC = PREDESC.replace('.', ``);

                if (tickets.get(`tickets.funcoes.${NOME}`) !== null) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Já existe uma função com esse nome!`, flags: 64 });
                }

                if (NOME.length > 32) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | O nome não pode ter mais de 32 caracteres!`, flags: 64 });
                } else {
                    tickets.set(`tickets.funcoes.${NOME}.nome`, NOME)
                }

                if (PREDESC.length > 64) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | A pré descrição não pode ter mais de 64 caracteres!`, flags: 64 });
                } else {
                    tickets.set(`tickets.funcoes.${NOME}.predescricao`, PREDESC)
                }

                if (DESC !== ``) {
                    if (DESC.length > 1024) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | A descrição não pode ter mais de 1024 caracteres!`, flags: 64 });
                    } else {
                        tickets.set(`tickets.funcoes.${NOME}.descricao`, DESC)
                    }
                }

                if (BANNER !== ``) {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(BANNER)) {
                        tickets.set(`tickets.funcoes.${NOME}.banner`, BANNER)
                        return interaction.reply({ message: dd, content: `${Emojis.get('negative')} | Você escolheu incorretamente a URL do banner!`, flags: 64 });
                    } else {
                        tickets.set(`tickets.funcoes.${NOME}.banner`, BANNER)
                    }
                }

                if (EMOJI !== ``) {
                    const emojiRegex = /^<:.+:\d+>$|^<a:.+:\d+>$|^\p{Emoji}$/u;
                    if (!emojiRegex.test(EMOJI)) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o emoji!`, flags: 64 });
                    } else {
                        tickets.set(`tickets.funcoes.${NOME}.emoji`, EMOJI)
                    }
                }

                await painelTicket(interaction)

                interaction.followUp({ content: `${Emojis.get('checker')} | Função adicionada com sucesso!`, flags: 64 });




            }

            if (interaction.customId == '0-89du0awd8awdaw8daw') {

                let TITULO = interaction.fields.getTextInputValue('tokenMP');
                let DESC = interaction.fields.getTextInputValue('tokenMP2');
                let BANNER = interaction.fields.getTextInputValue('tokenMP3');
                let COREMBED = interaction.fields.getTextInputValue(`tokenMP5`);

                if (TITULO.length > 256) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | O título não pode ter mais de 256 caracteres!`, flags: 64 });
                }
                if (DESC.length > 1024) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | A descrição não pode ter mais de 1024 caracteres!`, flags: 64 });
                }

                if (COREMBED !== ``) {
                    const hexColorRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
                    if (!hexColorRegex.test(COREMBED)) {
                        
                        return interaction.reply({ content: `${Emojis.get('negative')} Código Hex Color \`${COREMBED}\` inváldo, tente pegar [nesse site.](https://www.google.com/search?q=color+picker&oq=color+picker) `, flags: 64 });
                    }else{
                        tickets.set(`tickets.aparencia.color`, COREMBED)
                    }
                }



                if (BANNER !== ``) {
                    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
                    if (!urlRegex.test(BANNER)) {
                     
                        return interaction.reply({ message: dd, content: `${Emojis.get('negative')} | Você escolheu incorretamente a URL do banner!`, flags: 64 });
                    }else{
                        tickets.set(`tickets.aparencia.banner`, BANNER)
                    }
                }

                if (TITULO !== '') {
                    tickets.set(`tickets.aparencia.title`, TITULO)
                } else {
                    tickets.delete(`tickets.aparencia.title`)
                }

                if (DESC !== '') {
                    tickets.set(`tickets.aparencia.description`, DESC)
                } else {
                    tickets.delete(`tickets.aparencia.description`)
                }

                await painelTicket(interaction)


            }

      


            if (interaction.customId === 'aslfdjauydvaw769dg7waajnwndjo') {

                let VALOR = interaction.fields.getTextInputValue('tokenMP');
                let CARGO = interaction.fields.getTextInputValue('tokenMP2');


                if (CARGO !== '' && VALOR !== ``) {
                    const role = await interaction.guild.roles.fetch(CARGO);

                    if (role === null) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o ID do cargo!`, flags: 64 });
                    }

                    if (isNaN(VALOR)) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o valor!`, flags: 64 });
                    }

                    configuracao.set(`posicoes.pos1.role`, CARGO);
                    configuracao.set(`posicoes.pos1.valor`, VALOR);
                } else {
                    configuracao.delete(`posicoes.pos1`);
                }

                await Posicao1(interaction, client)
                

            }

            if (interaction.customId === 'awiohdbawudwdwhduawdnuaw') {

                let VALOR = interaction.fields.getTextInputValue('tokenMP');
                let CARGO = interaction.fields.getTextInputValue('tokenMP2');


                if (CARGO !== '' && VALOR !== ``) {
                    const role = await interaction.guild.roles.fetch(CARGO);

                    if (role === null) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o ID do cargo!`, flags: 64 });
                    }

                    if (isNaN(VALOR)) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o valor!`, flags: 64 });
                    }

                    configuracao.set(`posicoes.pos2.role`, CARGO);
                    configuracao.set(`posicoes.pos2.valor`, VALOR);
                } else {
                    configuracao.delete(`posicoes.pos2`);
                }

                await Posicao1(interaction, client)
                
            }

            if (interaction.customId === 'uy82819171h172') {

                let VALOR = interaction.fields.getTextInputValue('tokenMP');
                let CARGO = interaction.fields.getTextInputValue('tokenMP2');

                if (CARGO !== '' && VALOR !== ``) {
                    const role = await interaction.guild.roles.fetch(CARGO);

                    if (role === null) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o ID do cargo!`, flags: 64 });
                    }

                    if (isNaN(VALOR)) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Você escolheu incorretamente o valor!`, flags: 64 });
                    }

                    configuracao.set(`posicoes.pos3.role`, CARGO);
                    configuracao.set(`posicoes.pos3.valor`, VALOR);
                } else {
                    configuracao.delete(`posicoes.pos3`);
                }

                await Posicao1(interaction, client)
                
            }

            
            if (interaction.customId === 'robux_modal_valores') {
                await handleModalValores(interaction);
            }

            if (interaction.customId === 'robux_modal_limites') {
                await handleModalLimites(interaction);
            }

            
            if (interaction.customId === 'robux_modal_configurar_container') {
                await handleModalConfigurarContainer(interaction);
            }

            
            if (interaction.customId === 'robux_modal_configurar_painel') {
                await handleModalConfigurarPainel(interaction);
            }

            
            if (interaction.customId === 'robux_modal_alterar_qtd') {
                await handleModalAlterarQuantidadeCarrinho(interaction);
            }

            
            if (interaction.customId === 'robux_modal_criar_cupom') { await handleModalCriarCupomRobux(interaction); }
            if (interaction.customId === 'robux_modal_remover_cupom') { await handleModalRemoverCupomRobux(interaction); }
            if (interaction.customId === 'robux_modal_toggle_cupom') { await handleModalToggleCupomRobux(interaction); }

            
            if (interaction.customId === 'robux_handle_termos_1') { await handleModalTermos1(interaction); }
            if (interaction.customId === 'robux_handle_termos_2') { await handleModalTermos2(interaction); }
            if (interaction.customId === 'robux_handle_termos_3') { await handleModalTermos3(interaction); }

            
            if (interaction.customId === 'robux_handle_nome_banco') {
                const nomeBanco = interaction.fields.getTextInputValue('nome_banco_input').trim();
                if (!nomeBanco || nomeBanco.length < 3) {
                    return interaction.reply({ content: `${Emojis.get('negative')||''} | Nome inválido. Por favor, informe seu nome completo como está no banco.`, flags: 64 });
                }
                
                const carrinhoAtual = carrinhosRobux.get(`${interaction.user.id}`);
                if (!carrinhoAtual) {
                    return interaction.reply({ content: `${Emojis.get('negative')||''} | Carrinho não encontrado!`, flags: 64 });
                }
                carrinhoAtual.nomeBancoPagador = nomeBanco;
                carrinhosRobux.set(`${interaction.user.id}`, carrinhoAtual);
                
                await irParaPagamentoRobux(interaction, client);
            }

            
            if (interaction.customId === 'robux_modal_cupom') {
                const codigo = interaction.fields.getTextInputValue('cupom_codigo').trim().toUpperCase();
                const { carrinhosRobux: cRobux } = require('../../Functions/CarrinhoRobux');
                const carrinho = cRobux.get(`${interaction.user.id}`);
                if (carrinho) {
                    if (carrinho.cupomRobux) {
                        return interaction.reply({ content: `${Emojis.get('negative') || ''} | Você já possui o cupom \`${carrinho.cupomRobux}\` aplicado!`, flags: 64 });
                    }
                    const cupons = robuxConfig.get(`config.cupons`) || {};
                    const cupomData = cupons[codigo];
                    const agora = Date.now();
                    if (!cupomData || !cupomData.ativo) {
                        return interaction.reply({ content: `${Emojis.get('negative') || ``} | Cupom **${codigo}** inválido ou inativo!`, flags: 64 });
                    }
                    if (cupomData.validade && agora > cupomData.validade) {
                        return interaction.reply({ content: `${Emojis.get('negative') || ``} | Cupom **${codigo}** expirado!`, flags: 64 });
                    }
                    if (cupomData.maxTotalUsos && (cupomData.usoTotal || 0) >= cupomData.maxTotalUsos) {
                        return interaction.reply({ content: `${Emojis.get('negative') || ``} | Cupom **${codigo}** atingiu o limite máximo de usos!`, flags: 64 });
                    }
                    if (cupomData.maxUsoPorUsuario) {
                        const usosUsuario = (cupomData.usuarios || {})[interaction.user.id] || 0;
                        if (usosUsuario >= cupomData.maxUsoPorUsuario) {
                            return interaction.reply({ content: `${Emojis.get('negative') || ''} | Você já utilizou este cupom o máximo de vezes permitidas (**${cupomData.maxUsoPorUsuario}**).`, flags: 64 });
                        }
                    }
                    
                    carrinho.cupomRobux = codigo;
                    carrinho.cupomDesconto = cupomData.desconto || 0;
                    cRobux.set(`${interaction.user.id}`, carrinho);
                    
                    cupomData.usoTotal = (cupomData.usoTotal || 0) + 1;
                    if (!cupomData.usuarios) cupomData.usuarios = {};
                    cupomData.usuarios[interaction.user.id] = (cupomData.usuarios[interaction.user.id] || 0) + 1;
                    cupons[codigo] = cupomData;
                    robuxConfig.set('config.cupons', cupons);
                    
                    try {
                        const canalLogCupons = robuxConfig.get('config.canais.logCupons');
                        if (canalLogCupons) {
                            const logCh = await client.channels.fetch(canalLogCupons).catch(() => null);
                            if (logCh) {
                                const usosRestantes = cupomData.maxTotalUsos ? (cupomData.maxTotalUsos - cupomData.usoTotal) : null;
                                const validadeStr = cupomData.validade ? new Date(cupomData.validade).toLocaleDateString('pt-BR') : 'Sem prazo';
                                const { res: resLog } = require('../../res');
                                const logMsg = resLog.main(
                                    { type: 10, content: `${Emojis.get('_camp_emoji')||''} **Log de Cupom Utilizado**` }, { type: 14 },
                                    { type: 10, content: `> **Usuário:** <@${interaction.user.id}> (\`${interaction.user.username}\` — \`${interaction.user.id}\`)\n> **Cupom:** \`${codigo}\`\n> **Desconto:** ${cupomData.desconto}%\n> **Usos totais:** ${cupomData.usoTotal}${cupomData.maxTotalUsos ? ` / ${cupomData.maxTotalUsos}` : ``}\n> **Usos restantes:** ${usosRestantes !== null ? usosRestantes : `Ilimitado`}\n> **Validade:** ${validadeStr}\n> **Canal:** <#${interaction.channel?.id || `?`}>`}
                                );
                                await logCh.send(logMsg).catch(() => {});
                            }
                        }
                    } catch(logErr) {}
                    await interaction.reply({ content: `${Emojis.get('checker') || ''} | Cupom **${codigo}** aplicado! Desconto de **${cupomData.desconto}%**`, flags: 64 });
                    await mostrarCarrinhoRobuxPrincipal(interaction);
                }
            }

            
            if (interaction.customId.startsWith('robux_modal_nick_')) {
                const tipo = interaction.customId.replace('robux_modal_nick_', '');
                await handleModalNickRoblox(interaction, tipo);
            }

            
            if (interaction.customId.startsWith('robux_modal_gp_info_')) {
                const tipoTaxa = interaction.customId.replace('robux_modal_gp_info_', '');
                const resultado = await handleModalGamepassInfo(interaction, tipoTaxa);
                if (resultado === 'ir_pagamento') {
                    await irParaPagamentoRobux(interaction, client);
                }
            }

            
            if (interaction.customId.startsWith('robux_modal_qtd_')) {
                
                const rest = interaction.customId.replace('robux_modal_qtd_', '');
                
                
                let tipoTaxa, tipo;
                if (rest.startsWith('sem_taxa_')) {
                    tipoTaxa = 'sem_taxa';
                    tipo = rest.replace('sem_taxa_', '');
                } else if (rest.startsWith('com_taxa_')) {
                    tipoTaxa = 'com_taxa';
                    tipo = rest.replace('com_taxa_', '');
                } else if (rest.startsWith('via_grupo_')) {
                    tipoTaxa = 'via_grupo';
                    tipo = rest.replace('via_grupo_', '');
                } else {
                    return;
                }
                await handleModalQuantidadeRobux(interaction, tipoTaxa, tipo);
            }

            
            if (interaction.customId === 'modal_adicionar_perm') {
                await HandleAdicionarPerm(interaction, client);
            }

            
            if (interaction.customId === 'modal_remover_perm') {
                await HandleRemoverPerm(interaction, client);
            }

            
            if (interaction.customId === 'modal_criar_painel_ticket') {
                await HandleCriarPainelTicket(interaction);
            }

            
            if (interaction.customId.startsWith('modal_addfuncao_')) {
                const painelId = interaction.customId.replace('modal_addfuncao_', '');
                await HandleAddFuncaoTicket(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('modal_editar_')) {
                const painelId = interaction.customId.replace('modal_editar_', '');
                await HandleEditarPainel(interaction, painelId);
                return;
            }

            
            if (interaction.customId === 'modal_criar_sorteio') {
                const titulo = interaction.fields.getTextInputValue('sorteio_titulo');
                const descricao = interaction.fields.getTextInputValue('sorteio_descricao');
                const vencedores = interaction.fields.getTextInputValue(`sorteio_vencedores`);

                if (isNaN(vencedores) || parseInt(vencedores) < 1) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | O número de vencedores deve ser um número válido maior que 0!`, flags: 64 });
                }

                const sorteioId = gerarIdSorteio();
                
                sorteios.set(sorteioId, {
                    id: sorteioId,
                    titulo: titulo,
                    descricao: descricao,
                    vencedores: parseInt(vencedores),
                    criador: interaction.user.id,
                    criadoEm: Date.now(),
                    status: "configurando",
                    participantes: []
                });

                await PaginaSetarTempo(interaction, sorteioId);
            }

            
            if (interaction.customId.startsWith('modal_tempo_personalizado_')) {
                const sorteioId = interaction.customId.replace('modal_tempo_personalizado_', '');
                const tempoStr = interaction.fields.getTextInputValue(`tempo_personalizado`);
                
                const tempoMs = parseTime(tempoStr);
                
                if (tempoMs <= 0) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Formato de tempo inválido! Use: m = minutos, h = horas, d = dias\nExemplos: 30m, 2h, 1d, 1d 2h 30m`, flags: 64 });
                }

                const maxTempo = 30 * 24 * 60 * 60 * 1000; 
                if (tempoMs > maxTempo) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | O tempo máximo é de 30 dias!`, flags: 64 });
                }

                sorteios.set(`${sorteioId}.duracao`, tempoMs);

                await PaginaEscolherCanal(interaction, sorteioId);
            }

            
            if (interaction.customId.startsWith('modal_addtempo_')) {
                const sorteioId = interaction.customId.replace('modal_addtempo_', '');
                const tempoStr = interaction.fields.getTextInputValue(`tempo_adicionar`);
                
                const tempoMs = parseTime(tempoStr);
                
                if (tempoMs <= 0) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Formato de tempo inválido! Use: m = minutos, h = horas, d = dias\nExemplos: 30m, 2h, 1d`, flags: 64 });
                }

                const sorteioData = sorteios.get(sorteioId);
                if (!sorteioData) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Sorteio não encontrado!`, flags: 64 });
                }

                const novoFinalizaEm = sorteioData.finalizaEm + tempoMs;
                sorteios.set(`${sorteioId}.finalizaEm`, novoFinalizaEm);
                sorteios.set(`${sorteioId}.duracao`, sorteioData.duracao + tempoMs);

                await interaction.reply({ content: `${Emojis.get('checker')} | Tempo adicionado! Nova finalização: <t:${Math.floor(novoFinalizaEm / 1000)}:R>`, flags: 64 });
            }

            
            if (interaction.customId === 'modal_stock_titulo') {
                const valor = interaction.fields.getTextInputValue('valor');
                const embedConfig = configuracao.get('solicitarStock.embed') || {};
                embedConfig.titulo = valor;
                configuracao.set('solicitarStock.embed', embedConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_descricao') {
                const valor = interaction.fields.getTextInputValue('valor');
                const embedConfig = configuracao.get('solicitarStock.embed') || {};
                embedConfig.descricao = valor;
                configuracao.set('solicitarStock.embed', embedConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_cor') {
                const valor = interaction.fields.getTextInputValue(`valor`);
                if (!/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(valor)) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Cor inválida! Use formato hex (ex: #5865F2)`, flags: 64 });
                }
                const embedConfig = configuracao.get('solicitarStock.embed') || {};
                embedConfig.cor = valor.startsWith('#') ? valor : `#${valor}`;
                configuracao.set('solicitarStock.embed', embedConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_imagem') {
                const valor = interaction.fields.getTextInputValue('valor');
                const embedConfig = configuracao.get('solicitarStock.embed') || {};
                embedConfig.imagem = valor || null;
                configuracao.set('solicitarStock.embed', embedConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_thumbnail') {
                const valor = interaction.fields.getTextInputValue('valor');
                const embedConfig = configuracao.get('solicitarStock.embed') || {};
                embedConfig.thumbnail = valor || null;
                configuracao.set('solicitarStock.embed', embedConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            
            if (interaction.customId === 'modal_stock_botao_msg') {
                const valor = interaction.fields.getTextInputValue('valor');
                const botaoConfig = configuracao.get('solicitarStock.botao') || {};
                botaoConfig.mensagem = valor;
                configuracao.set('solicitarStock.botao', botaoConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_botao_emoji') {
                const valor = interaction.fields.getTextInputValue('valor');
                const botaoConfig = configuracao.get('solicitarStock.botao') || {};
                botaoConfig.emoji = valor || null;
                configuracao.set('solicitarStock.botao', botaoConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'modal_stock_botao_cor') {
                const valor = interaction.fields.getTextInputValue('valor');
                if (!['1', '2', '3', `4`].includes(valor)) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Cor inválida! Use 1=Azul, 2=Cinza, 3=Verde, 4=Vermelho`, flags: 64 });
                }
                const botaoConfig = configuracao.get('solicitarStock.botao') || {};
                botaoConfig.cor = parseInt(valor);
                configuracao.set('solicitarStock.botao', botaoConfig);
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                await PaginaConfigurarEmbed(interaction, client);
            }

            
            if (interaction.customId === 'modal_solicitar_estoque') {
                const { EnviarLogSolicitacao } = require("../../Functions/PainelSolicitarStock.js");
                await EnviarLogSolicitacao(interaction, client);
            }

        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName === `manage_item`) {
                const nomeDigitado = interaction.options.getFocused().toLowerCase();
                const produtosFiltrados = produtos.filter(produto => produto.ID.toLowerCase().includes(nomeDigitado));
                const produtosSelecionados = produtosFiltrados.slice(0, 25);
        
                const config = produtosSelecionados.flatMap(produto => {
                    
                    if (produto.data && produto.data.Campos) {
                        const matchingFields = produto.data.Campos.filter(campo =>
                            campo.Nome.toLowerCase().includes(nomeDigitado)
                        );
        
                        return matchingFields.map(campo => ({
                            name: `${Emojis.get('speech')||''} ${campo.Nome}`,
                            value: `${produto.ID}_${campo.Nome}`,
                        }));
                    } else {
                        
                        return [];
                    }
                });
        
                
                const response = config.length > 25 ? config.slice(0, 25) : config;
        
                interaction.respond(response);
            }        

            if (interaction.commandName === `manage_stock`) {
                const nomeDigitado = interaction.options.getFocused().toLowerCase();
                const produtosFiltrados = produtos.filter(produto => produto.ID.toLowerCase().includes(nomeDigitado));
                const produtosSelecionados = produtosFiltrados.slice(0, 25);
            
                const response = produtosSelecionados.map(produto => {
                const name = produto.data.Config ? produto.data.Config.name : "Nome Não Disponível";
            
                    
                    const option = {
                        name: `${Emojis.get('speech')||''} ${name}`,
                        value: produto.ID
                    };
            
                    
                    if (JSON.stringify(option).length > 100) {
                        
                        option.name = option.name.substring(0, 90) + '...'; 
                        option.value = option.value.substring(0, 90) + '...'; 
                    }
            
                    return option;
                });
                
                
                interaction.respond(response.length > 0 ? response : [{ name: 'Nenhum produto registrado foi encontrado', value: 'nada' }]);
            }
            


            if (interaction.commandName == `manage_product`) {
                var nomeDigitado = interaction.options.getFocused().toLowerCase();
                var produtosFiltrados = produtos.filter(x => x.ID.toLowerCase().includes(nomeDigitado));
                var produtosSelecionados = produtosFiltrados.slice(0, 25);

                const config = produtosSelecionados.map(x => {
                    const name = x.data.Config ? x.data.Config.name : "Nome Não Disponível";
                    return {
                        name: `${Emojis.get('speech')||''} ${name}`,
                        value: `${x.ID}`
                    };
                });
                
                interaction.respond(!config.length ? [{ name: `${Emojis.get('negative')} Nenhum produto registrado foi encontrado`, value: `nada` }] : config);

            }
        }

        
        if (interaction.isButton() && interaction.customId.startsWith('gerar_transcript_')) {
            try {
                
                await interaction.deferUpdate();
                
                const transcriptId = interaction.customId.replace('gerar_transcript_', ``);
                const { transcript } = require("../../database");
                const transcriptData = transcript.get(transcriptId);

                if (!transcriptData) {
                    return interaction.followUp({ content: `${Emojis.get('negative')} | Transcript não encontrado.` });
                }

                
                let transcriptText = `═══════════════════════════════════════\n`;
                transcriptText += `       TRANSCRIPT - ${transcriptData.guildName}\n`;
                transcriptText += `═══════════════════════════════════════\n\n`;
                transcriptText += `Categoria: ${transcriptData.categoria}\n`;
                transcriptText += `Fechado por: ${transcriptData.fechadoPor}\n`;
                transcriptText += `Data: ${transcriptData.fechadoEm}\n`;
                transcriptText += `Total de mensagens: ${transcriptData.mensagens.length}\n\n`;
                transcriptText += `───────────────────────────────────────\n`;
                transcriptText += `                MENSAGENS\n`;
                transcriptText += `───────────────────────────────────────\n\n`;

                for (const msg of transcriptData.mensagens) {
                    transcriptText += `[${msg.timestamp}] ${msg.author}:\n${msg.content}\n\n`;
                }

                transcriptText += `═══════════════════════════════════════\n`;
                transcriptText += `           FIM DO TRANSCRIPT\n`;
                transcriptText += `═══════════════════════════════════════`;

                
                const buffer = Buffer.from(transcriptText, `utf-8`);

                
                await interaction.followUp({ 
                    content: `${Emojis.get('checker')} | Aqui está o transcript do seu atendimento:`,
                    files: [{ attachment: buffer, name: `transcript_${transcriptData.categoria}.txt` }]
                });

                
                transcript.delete(transcriptId);

                
                const disabledContainer = res.main(
                    { type: 10, content: `# ${Emojis.get('_trash_emoji')} Ticket Fechado` },
                    { type: 14 },
                    { type: 10, content: `> Seu ticket de **${transcriptData.categoria}** foi encerrado.` },
                    { type: 14 },
                    { type: 10, content: `**Fechado por**\n${transcriptData.fechadoPor}` },
                    { type: 10, content: `**Data**\n${transcriptData.fechadoEm}` },
                    { type: 14 },
                    { type: 10, content: `-# Transcript já foi gerado.` },
                    { type: 1, components: [{ type: 2, style: 2, label: 'Transcript Gerado', custom_id: 'transcript_usado', emoji: { id: '1384035207598051431' }, disabled: true }] }
                );

                await interaction.message.edit(disabledContainer);
            } catch (error) {
                console.error(`Erro ao gerar transcript:`, error);
                try {
                    await interaction.followUp({ content: `${Emojis.get('negative')} | Erro ao gerar transcript.` });
                } catch {}
            }
            return;
        }

        let valorticket
        if (interaction.isButton() && interaction.customId.startsWith('AbrirTicket::')) {
            
            const parts = interaction.customId.split('::');
            const painelId = parts[1];
            const funcaoId = parts[2];
            
            console.log(`[Ticket] Abrindo ticket - PainelId: ${painelId}, FuncaoId: ${funcaoId}`);
            await CreateTicket(interaction, painelId, funcaoId).catch(err => {
                console.error(`[Ticket] Erro ao criar ticket:`, err);
                interaction.reply({ content: `${Emojis.get('negative')||''} | Erro ao criar ticket: ${err.message}`, flags: 64 }).catch(() => {});
            });
        } else if (interaction.isButton() && interaction.customId.startsWith('AbrirTicket_')) {
            
            const fullId = interaction.customId.replace('AbrirTicket_', '');
            
            const lastUnderscoreIndex = fullId.lastIndexOf('_');
            const funcaoId = fullId.substring(lastUnderscoreIndex + 1);
            const painelId = fullId.substring(0, lastUnderscoreIndex);
            
            console.log(`[Ticket] Abrindo ticket (formato antigo) - PainelId: ${painelId}, FuncaoId: ${funcaoId}`);
            await CreateTicket(interaction, painelId, funcaoId).catch(err => {
                console.error(`[Ticket] Erro ao criar ticket:`, err);
                interaction.reply({ content: `${Emojis.get('negative')||''} | Erro ao criar ticket: ${err.message}`, flags: 64 }).catch(() => {});
            });
        } else if (interaction.isStringSelectMenu() && interaction.customId === 'abrirticket') {
            valorticket = interaction.values[0]
            
            await CreateTicket(interaction, null, valorticket).catch(err => {
                console.error(`[Ticket] Erro ao criar ticket:`, err);
                interaction.reply({ content: `${Emojis.get('negative')||''} | Erro ao criar ticket: ${err.message}`, flags: 64 }).catch(() => {});
            });
        } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ticket_abrir_select_')) {
            
            const selectedValue = interaction.values[0];
            
            if (selectedValue.includes('::')) {
                
                const parts = selectedValue.split('::');
                const painelId = parts[1];
                const funcaoId = parts[2];
                
                console.log(`[Ticket] Abrindo ticket via select - PainelId: ${painelId}, FuncaoId: ${funcaoId}`);
                await CreateTicket(interaction, painelId, funcaoId).catch(err => {
                    console.error(`[Ticket] Erro ao criar ticket:`, err);
                    interaction.reply({ content: `${Emojis.get('negative')||''} | Erro ao criar ticket: ${err.message}`, flags: 64 }).catch(() => {});
                });
            } else {
                
                const fullId = selectedValue.replace('abrirticket_', '');
                const lastUnderscoreIndex = fullId.lastIndexOf('_');
                const funcaoId = fullId.substring(lastUnderscoreIndex + 1);
                const painelId = fullId.substring(0, lastUnderscoreIndex);
                
                console.log(`[Ticket] Abrindo ticket via select (formato antigo) - PainelId: ${painelId}, FuncaoId: ${funcaoId}`);
                await CreateTicket(interaction, painelId, funcaoId).catch(err => {
                    console.error(`[Ticket] Erro ao criar ticket:`, err);
                    interaction.reply({ content: `${Emojis.get('negative')||''} | Erro ao criar ticket: ${err.message}`, flags: 64 }).catch(() => {});
                });
            }
        }


        if (interaction.isButton() && interaction.customId && interaction.customId.startsWith('panel_cat_')) {
            return PainelCategoria(interaction, client, interaction.customId.replace('panel_cat_', ''));
        }

        if (interaction.isButton() && interaction.customId === 'voltar00') {
            return Painel(interaction, client);
        }

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('panel_select_')) {
            const selected = interaction.values[0];
            if (selected === 'painelconfigvendas') return Gerenciar2(interaction, client);
            if (selected === 'painelconfigticket') return painelTicket(interaction);
            if (selected === 'sistemamoderacao') {
                const { PainelModeracao } = require("../../Functions/ModeracaoPanel");
                return PainelModeracao(interaction, client);
            }
            if (selected === 'gerenciarconfigs') return Gerenciar(interaction, client);
            if (selected === 'rendimento') {
                return PainelRendimentosDashboard(interaction);
            } else if (selected === 'sistemaauth') {
                return auth02api(interaction, client);
            } else if (selected === 'configauth') {
                return configauth(interaction, client);
            } else if (selected === 'ecloud') {
                return ecloudAuthPanel(interaction, client);
            } else if (selected === 'painelpermissions') {
                return PainelPermissions(interaction, client);
            } else if (selected === 'configcargos') {
                return ConfigRoles(interaction, client);
            } else if (selected === 'sistemasorteios') {
                return PainelSorteios(interaction, client);
            } else if (selected === 'painelconfigrobux') {
                return painelRobux(interaction);
            } else if (selected === 'painelconfigbv') {
                return msgbemvindo(interaction, client);
            } else if (selected === 'eaffaawwawa') {
                return automatico(interaction, client);
            } else if (selected === 'formasdepagamentos') {
                return FormasDePagamentos(interaction);
            } else if (selected === 'configqrcode') {
                return configqrcode(interaction, client);
            } else if (selected === 'moedaconfig') {
                return moedaConfig(interaction, client);
            } else if (selected === 'imapconfig') {
                return imapConfigs(interaction, client);
            } else if (selected === 'sistemasugestoes') {
                return SistemaSugestao(interaction, client);
            } else if (selected === 'configantifake') {
                return msgbemvindo(interaction, client);
            }
        }

        if (interaction.isStringSelectMenu()) {

            
            if (interaction.customId === 'staff_acoes_ticket') {
                const acao = interaction.values[0];

                if (acao === `assumir_ticket`) {
                    let ticketId = interaction.channel.id;
                    const { Temporario } = require("../../database");
                    
                    if (Temporario.get(`ticket_assumido_${ticketId}`)) {
                        const staffId = Temporario.get(`ticket_assumido_${ticketId}`);
                        return interaction.update({ content: `${Emojis.get('negative')} | Este ticket já foi assumido por <@${staffId}>.`, components: [] });
                    }

                    const staffMember = interaction.member;
                    
                    
                    let ownerId = Temporario.get(`ticket_owner_${ticketId}`);
                    if (!ownerId) {
                        const ultimoIndice = interaction.channel.name.lastIndexOf(`・`);
                        ownerId = interaction.channel.name.slice(ultimoIndice + 1);
                    }

                    
                    if (!ownerId || !/^\d+$/.test(ownerId)) {
                        return interaction.update({ content: `${Emojis.get('negative')} | Não foi possível identificar o dono do ticket.`, components: [] });
                    }

                    try {
                        const owner = await interaction.guild.members.fetch(ownerId);

                        Temporario.set(`ticket_assumido_${ticketId}`, staffMember.id);

                        const confirmationEmbed = new EmbedBuilder()
                            .setColor(`#2b2d31`)
                            .setDescription(`${Emojis.get('checker')} | Olá <@!${ownerId}>, Seu Ticket foi Assumido por ${staffMember}.`);

                        const buttonRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel(`Ir para o Ticket`)
                                .setStyle(5)
                                .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                        );

                        try {
                            await owner.send({ embeds: [confirmationEmbed], components: [buttonRow] });
                        } catch {}

                        await interaction.update({ content: `${Emojis.get('checker')} | Ticket assumido com sucesso!`, components: [] });
                        await interaction.channel.send({ content: `${Emojis.get('checker')} | Ticket assumido por ${staffMember}!` });
                    } catch (error) {
                        console.error("Erro ao assumir ticket:", error);
                        await interaction.update({ content: `${Emojis.get('negative')} | Erro ao assumir ticket.`, components: [] });
                    }
                    return;
                }

                if (acao === 'renomear_ticket') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_renomear_ticket')
                        .setTitle('Renomear Ticket')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('novo_nome_ticket')
                                    .setLabel('Novo nome do ticket')
                                    .setPlaceholder('Digite o novo nome...')
                                    .setStyle(TextInputStyle.Short)
                                    .setMaxLength(100)
                                    .setRequired(true)
                            )
                        );
                    await interaction.showModal(modal);
                    return;
                }

                if (acao === 'adicionar_usuario') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_adicionar_usuario_ticket')
                        .setTitle('Adicionar Usuário')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('usuario_id_adicionar')
                                    .setLabel('ID do usuário')
                                    .setPlaceholder('Digite o ID do usuário para adicionar...')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );
                    await interaction.showModal(modal);
                    return;
                }

                if (acao === 'remover_usuario') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_remover_usuario_ticket')
                        .setTitle('Remover Usuário')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('usuario_id_remover')
                                    .setLabel('ID do usuário')
                                    .setPlaceholder('Digite o ID do usuário para remover...')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );
                    await interaction.showModal(modal);
                    return;
                }
            }

            
            if (interaction.customId === 'ticket_selecionar_painel') {
                const painelId = interaction.values[0];
                if (painelId !== 'none') {
                    await PaginaGerenciarPainel(interaction, painelId);
                }
                return;
            }

            
            if (interaction.customId === 'ticket_acoes_select') {
                const selectedValue = interaction.values[0];
                const [acao, ...painelIdParts] = selectedValue.split('_');
                const painelId = painelIdParts.join('_');

                if (acao === 'editar') {
                    await ModalEditarPainel(interaction, painelId);
                } else if (acao === 'categorias') {
                    await PaginaCategorias(interaction, painelId);
                } else if (acao === 'exibicao') {
                    await AlternarExibicao(interaction, painelId);
                } else if (acao === 'apagar') {
                    await HandleDeletarPainel(interaction, painelId);
                } else if (acao === 'enviar') {
                    const selectChannel = new Discord.ChannelSelectMenuBuilder()
                        .setCustomId(`ticket_channel_postar_${painelId}`)
                        .setPlaceholder(`Selecione o canal para postar`)
                        .setChannelTypes(Discord.ChannelType.GuildText);
                    const row = new ActionRowBuilder().addComponents(selectChannel);
                    await interaction.reply({ content: `${Emojis.get('info')} | Selecione o canal:`, components: [row], flags: 64 });
                } else if (acao === 'sincronizar') {
                    await SincronizarTicket(interaction, painelId, client);
                }
                return;
            }

            
            if (interaction.customId === 'ticket_select_remfuncao') {
                const [painelId, funcaoId] = interaction.values[0].split(`_`).slice(-2);
                const fullPainelId = interaction.values[0].replace(`_${funcaoId}`, ``);
                await HandleRemoverFuncao(interaction, fullPainelId, funcaoId);
                return;
            }

            
            if (interaction.customId === 'configproduto_page') {
                const { GerenciarProduto } = require("../../Functions/CreateProduto");
                GerenciarProduto(interaction, 2, interaction.values[0]);
                return;
            }

            
            if (interaction.customId == 'gerenciar_produtos_menu') {
                const selectedValue = interaction.values[0];
                
                
                if (selectedValue === 'criarrrr') {
                    const modalaAA = new ModalBuilder()
                        .setCustomId('sdaju11111idsjjsdua')
                        .setTitle(`Criação`);

                    const newnameboteN = new TextInputBuilder()
                        .setCustomId('tokenMP')
                        .setLabel(`NOME`)
                        .setPlaceholder(`Insira o nome do seu produto`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)

                    const newnameboteN2 = new TextInputBuilder()
                        .setCustomId('tokenMP2')
                        .setLabel(`DESCRIÇÃO`)
                        .setPlaceholder(`Insira uma descrição para seu produto`)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(1024)

                    const newnameboteN4 = new TextInputBuilder()
                        .setCustomId('tokenMP3')
                        .setLabel(`ENTREGA AUTOMÁTICA?`)
                        .setPlaceholder(`Digite "sim" ou "não"`)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(3)
                        .setRequired(true)

                    const newnameboteN5 = new TextInputBuilder()
                        .setCustomId('tokenMP4')
                        .setLabel(`ICONE (OPCIONAL)`)
                        .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const newnameboteN6 = new TextInputBuilder()
                        .setCustomId('tokenMP5')
                        .setLabel(`BANNER (OPCIONAL)`)
                        .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                    const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                    const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                    const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                    const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);

                    modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                    await interaction.showModal(modalaAA);
                }
                
                if (selectedValue === 'gerenciarotemae') {
                    await mostrarPaginaProdutos(interaction, 0);
                }
                
                if (selectedValue === 'gerenciarposicao') {
                    Posicao1(interaction, client);
                }
                
                if (selectedValue === 'painel-solicitar-stock') {
                    const { PainelSolicitarStock } = require("../../Functions/PainelSolicitarStock.js");
                    PainelSolicitarStock(interaction, client);
                }
                
                if (selectedValue === `altMoeda`) {
                    await interaction.update({ content: `${Emojis.get('loading')} Carregando...`, embeds: [], components: [] });
                    moedaConfig(interaction, client);
                }
                
                if (selectedValue === `instruçoes081`) {
                    await interaction.reply({ content: `${Emojis.get('negative')} Esta função ainda está em desenvolvimento.`, flags: 64 });
                }

                if (selectedValue === `sistemasaldo`) {
                    await interaction.reply({ content: `${Emojis.get('negative')} Esta função ainda está em desenvolvimento.`, flags: 64 });
                }

                if (selectedValue === `sistemaafiliado`) {
                    await interaction.reply({ content: `${Emojis.get('negative')} Esta função ainda está em desenvolvimento.`, flags: 64 });
                }
            }

            if(interaction.customId == 'asdihadbhawhdwhdaw'){


                const campo = interaction.values[0].split('_')[0]
                const produto = interaction.values[0].split('_')[1]


                GerenciarCampos2(interaction, campo, produto, true)

            }

            if(interaction.customId == 'stockhasdhvsudasd'){

                const campo = interaction.values[0].split('_')[0]
                const produto = interaction.values[0].split('_')[1]

                MessageStock(interaction, 1, produto, campo, true)


            }

            if (interaction.customId == 'deletarticketsfunction') {
                const valordelete = interaction.values
                for (const iterator of valordelete) {
                    tickets.delete(`tickets.funcoes.${iterator}`)
                }
                painelTicket(interaction)
            }

            
            if (interaction.customId === 'robux_status_select') {
                const selectedValue = interaction.values[0];
                
                if (selectedValue === `ativar_robux`) {
                    robuxConfig.set(`config.status`, true);
                    await painelRobux(interaction);
                    interaction.followUp({ content: `${Emojis.get('checker')} | Sistema de Robux ativado com sucesso!`, flags: 64 });
                }
                
                if (selectedValue === `desativar_robux`) {
                    robuxConfig.set(`config.status`, false);
                    await painelRobux(interaction);
                    interaction.followUp({ content: `${Emojis.get('checker')} | Sistema de Robux desativado com sucesso!`, flags: 64 });
                }

                if (selectedValue === `ativar_gamepass`) {
                    robuxConfig.set(`config.statusGamepass`, true);
                    await painelRobux(interaction);
                    interaction.followUp({ content: `${Emojis.get('checker')} | Sistema de Gamepass ativado com sucesso!`, flags: 64 });
                }
                
                if (selectedValue === `desativar_gamepass`) {
                    robuxConfig.set(`config.statusGamepass`, false);
                    await painelRobux(interaction);
                    interaction.followUp({ content: `${Emojis.get('checker')} | Sistema de Gamepass desativado com sucesso!`, flags: 64 });
                }
            }

            
            if (interaction.customId === `robux_preview_select`) {
                await interaction.reply({ content: `${Emojis.get('info') || 'ℹ️'} | Você está no **modo preview**! Esta é apenas uma visualização da mensagem.`, flags: 64 });
            }

            
            if (interaction.customId === 'robux_comprar_select') {
                const selectedValue = interaction.values[0];
                
                try {
                    const originalMessage = interaction.message;
                    const originalComponents = originalMessage.components.map(row => {
                        const newRow = ActionRowBuilder.from(row);
                        newRow.components = row.components.map(comp => {
                            if (comp.type === 3 && comp.customId === 'robux_comprar_select') {
                                
                                return { ...comp.data, placeholder: "Escolha uma opção para solicitar o seu pedido" };
                            }
                            return comp;
                        });
                        return newRow;
                    });
                    await interaction.message.edit({ components: originalMessage.components }).catch(() => {});
                } catch (e) {}
                await criarCarrinhoRobux(interaction, selectedValue, client);
            }

            
            if (interaction.customId === 'robux_select_gamepass') {
                const [gamepassId, price] = interaction.values[0].split('_');
                await mostrarCheckout(interaction, gamepassId, parseInt(price));
            }

            
            if (interaction.customId === 'robux_opcoes_select') {
                const opcao = interaction.values[0];
                if (opcao === 'alterar_quantidade') {
                    await modalAlterarQuantidadeCarrinho(interaction);
                } else if (opcao === 'adicionar_cupom') {
                    const m = new ModalBuilder().setCustomId('robux_modal_cupom').setTitle('Adicionar Cupom');
                    m.addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('cupom_codigo').setLabel('Código do Cupom').setPlaceholder('Digite o código do cupom').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
                    ));
                    await interaction.showModal(m);
                }
            }

            
            if (interaction.customId === 'robux_selecao_jogo_gp') {
                const universeId = interaction.values[0];
                await mostrarCarrinhoGamepassJogo(interaction, universeId, null);
            }

            
            if (interaction.customId.startsWith('robux_gp_select_prod_')) {
                const universeId = interaction.customId.replace('robux_gp_select_prod_', '');
                const valor = interaction.values[0];
                const parts = valor.split('|||');
                const prodId = parts.length > 1 ? parts[1] : valor.replace('gpprod_', '');
                const { gamepassJogos } = require('../../database');
                const jogo = gamepassJogos.get(`jogo_${universeId}`);
                const produto = (jogo?.produtos || []).find(p => p.id === prodId);
                if (produto) {
                    const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
                    if (carrinho) {
                        if (!carrinho.itensCarrinho) carrinho.itensCarrinho = [];
                        const jaAdicionado = carrinho.itensCarrinho.find(i => i.id === prodId);
                        if (jaAdicionado) {
                            await interaction.reply({ content: `${Emojis.get('negative') || ``} | Este produto já está no seu carrinho!`, flags: 64 });
                        } else {
                            carrinho.itensCarrinho.push({ id: prodId, nome: produto.nome, preco: parseFloat(produto.preco) });
                            carrinhosRobux.set(`${interaction.user.id}`, carrinho);
                            await mostrarCarrinhoGamepassJogo(interaction, universeId, carrinho.catSelecionada);
                        }
                    } else {
                        await mostrarCarrinhoGamepassJogo(interaction, universeId, null);
                    }
                } else {
                    await interaction.reply({ content: `${Emojis.get('negative') || ''} | Produto não encontrado!`, flags: 64 });
                }
            }

            
            if (interaction.customId.startsWith('sorteio_select_tempo_')) {
                const sorteioId = interaction.customId.replace('sorteio_select_tempo_', '');
                const tempoSelecionado = interaction.values[0];
                
                const tempoMs = parseTime(tempoSelecionado);
                
                sorteios.set(`${sorteioId}.duracao`, tempoMs);

                await PaginaEscolherCanal(interaction, sorteioId);
            }

            
            if (interaction.customId === 'gerenciar_sorteio_select') {
                const sorteioId = interaction.values[0];
                await PaginaGerenciarSorteioEspecifico(interaction, sorteioId, client);
            }

            
            if (interaction.customId === 'stock_select_embed') {
                const valor = interaction.values[0];
                const { ModalTituloEmbed, ModalDescricaoEmbed, ModalCorEmbed, ModalImagemEmbed, ModalThumbnailEmbed } = require("../../Functions/PainelSolicitarStock.js");
                
                if (valor === 'titulo') await ModalTituloEmbed(interaction);
                else if (valor === 'descricao') await ModalDescricaoEmbed(interaction);
                else if (valor === 'cor') await ModalCorEmbed(interaction);
                else if (valor === 'imagem') await ModalImagemEmbed(interaction);
                else if (valor === 'thumbnail') await ModalThumbnailEmbed(interaction);
            }

            
            if (interaction.customId === 'stock_select_botao') {
                const valor = interaction.values[0];
                const { ModalMensagemBotao, ModalEmojiBotao, ModalCorBotao } = require("../../Functions/PainelSolicitarStock.js");
                
                if (valor === 'mensagem') await ModalMensagemBotao(interaction);
                else if (valor === 'emoji') await ModalEmojiBotao(interaction);
                else if (valor === 'cor') await ModalCorBotao(interaction);
            }

            
            if (interaction.customId === 'robux_select_canal') {
                const selectedValue = interaction.values[0];
                
                const Discord = require("discord.js");
                let channelType = Discord.ChannelType.GuildText;
                let placeholder = 'Selecione um canal';
                let configKey = '';

                if (selectedValue === 'canal_iniciadas') {
                    configKey = 'iniciadas';
                    placeholder = 'Selecione o canal de compras iniciadas';
                } else if (selectedValue === 'canal_canceladas') {
                    configKey = 'canceladas';
                    placeholder = 'Selecione o canal de compras canceladas';
                } else if (selectedValue === 'canal_aprovadas') {
                    configKey = 'aprovadas';
                    placeholder = 'Selecione o canal de compras aprovadas';
                } else if (selectedValue === 'canal_publicas') {
                    configKey = 'publicas';
                    placeholder = 'Selecione o canal de compras de Robux';
                } else if (selectedValue === 'canal_gamepass') {
                    configKey = 'gamepass';
                    placeholder = 'Selecione o canal de produtos Gamepass';
                } else if (selectedValue === 'canal_log_robux') {
                    configKey = 'logRobux';
                    placeholder = 'Selecione o canal exclusivo de logs de vendas Robux';
                } else if (selectedValue === 'canal_log_cupons') {
                    configKey = 'logCupons';
                    placeholder = 'Selecione o canal de logs de cupons utilizados';
                } else if (selectedValue === 'categoria_carrinhos') {
                    configKey = 'categoriaCarrinhos';
                    placeholder = `Selecione a categoria de carrinhos`;
                    channelType = Discord.ChannelType.GuildCategory;
                }

                const selectChannel = new Discord.ChannelSelectMenuBuilder()
                    .setCustomId(`robux_channel_select_${configKey}`)
                    .setPlaceholder(placeholder)
                    .setChannelTypes(channelType);

                const row = new ActionRowBuilder().addComponents(selectChannel);

                await interaction.reply({ 
                    content: `${Emojis.get('info')} | Selecione o canal desejado:`, 
                    components: [row], 
                    flags: 64 
                });
            }

            
            if (interaction.customId === 'select_acoes_automaticas') {
                const selectedValue = interaction.values[0];
                const { res } = require("../../res");
                
                
                if (selectedValue === 'configMensagensAuto') {
                    const { painelPrincipal } = require("../../Eventos/Sistemas Automaticos/mensagemconfig.js");
                    await painelPrincipal(interaction);
                    return;
                }
                
                
                if (selectedValue === `monitorfeedbacks`) {
                    await interaction.reply({ 
                        content: `${Emojis.get('negative')} A função **Monitorador de Feedbacks** está em desenvolvimento.`, 
                        flags: 64 
                    });
                    return;
                }

                
                if (selectedValue === 'sistemasugestoes') {
                    const { PainelSistemaSugestoes } = require("../../Functions/SistemaSugestoes.js");
                    PainelSistemaSugestoes(interaction, client);
                    return;
                }

                if (selectedValue === 'sistemaverificacao') {
                    const { PainelVerificacao } = require("../../Functions/VerificacaoSystem.js");
                    PainelVerificacao(interaction, client);
                    return;
                }

                if (selectedValue === 'sistemagifs') {
                    const { PainelGIFs } = require("../../Functions/GIFsSystem.js");
                    PainelGIFs(interaction, client);
                    return;
                }

                if (selectedValue === 'sistemaformulario') {
                    const { PainelFormulario } = require("../../Functions/FormularioSystem.js");
                    PainelFormulario(interaction, client);
                    return;
                }
                
                
                if (selectedValue === 'automaticRepostar') {
                    AcoesRepostAutomatics(interaction, client);
                    return;
                }
                
                
                if (selectedValue === 'configlock') {
                    const automaticosPath = require('path').resolve(__dirname, '../../database/autolock.json');
                    const fs = require('fs');
                    
                    let automaticos = {};
                    if (fs.existsSync(automaticosPath)) {
                        automaticos = JSON.parse(fs.readFileSync(automaticosPath));
                    }
                    
                    const guildId = interaction.guild.id;
                    const config = automaticos[guildId] || {};

                    let channelNames = config.channels
                        ? config.channels.map(id => `<#${id}>`).join(`, `)
                        : `*Não configurado*`;

                    const rowVoltar = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("voltarautomaticos")
                            .setEmoji(Emojis.get('_back_emoji') || '🔙')
                            .setLabel(`Voltar`)
                            .setStyle(2)
                    );

                    const containerContent = res.main(
                        { type: 10, content: `-# Painel > Ações Automáticas > Lock Automático` },
                        { type: 14 },
                        { type: 10, content: `**Configuração de Lock Automático**\n\n> Bloqueie e desbloqueie canais automaticamente em horários específicos.` },
                        { type: 14 },
                        { type: 10, content: `**Configurações Atuais:**\n> **Horário de Bloqueio:** \`${config.abrir || `Não configurado`}\`\n> **Horário de Desbloqueio:** \`${config.fechar || `Não configurado`}\`\n> **Canais:** ${channelNames}` },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 1,
                                    label: "Modificar",
                                    emoji: { id: "1236318155056349224" },
                                    custom_id: "modifyConfig"
                                },
                                {
                                    type: 2,
                                    style: 4,
                                    label: "Desativar",
                                    emoji: { id: "1178076767567757312" },
                                    custom_id: "disableConfig"
                                }
                            ]
                        }
                    ).with({
                        components: [rowVoltar],
                        flags: [64]
                    });

                    await interaction.update(containerContent);
                    return;
                }
            }



            





        }


        if (interaction.isChannelSelectMenu()) {

            if (interaction.customId == `canalpostarticket`) {
                await interaction.reply({ content: `${Emojis.get('loading')} | Aguarde estamos criando sua mensagem!`, flags: 64 });
                await CreateMessageTicket(interaction, interaction.values[0], client)
                interaction.editReply({ content: `${Emojis.get('checker')} | Mensagem criada com sucesso!`, flags: 64 });
            }

            
            if (interaction.customId.startsWith('robux_channel_select_')) {
                const configKey = interaction.customId.replace('robux_channel_select_', ``);
                const channelId = interaction.values[0];

                robuxConfig.set(`config.canais.${configKey}`, channelId);
                
                await interaction.update({ 
                    content: `${Emojis.get('checker')} | Canal configurado com sucesso!`, 
                    components: [] 
                });
            }

            
            if (interaction.customId === `robux_channel_enviar_mensagem`) {
                const channelId = interaction.values[0];
                await interaction.update({ content: `${Emojis.get('loading')} | Enviando mensagem...`, components: [] });
                
                const success = await enviarMensagemRobux(interaction, channelId, client);
                if (success) {
                    await interaction.editReply({ content: `${Emojis.get('checker')} | Mensagem enviada com sucesso no canal <#${channelId}>!` });
                } else {
                    await interaction.editReply({ content: `${Emojis.get('negative')} | Erro ao enviar a mensagem!` });
                }
            }

            
            if (interaction.customId.startsWith('ticket_channel_postar_')) {
                const painelId = interaction.customId.replace('ticket_channel_postar_', ``);
                const channelId = interaction.values[0];
                await interaction.update({ content: `${Emojis.get('loading')} | Postando ticket...`, components: [] });
                const channel = await client.channels.fetch(channelId);
                await PostarTicket(interaction, painelId, channel);
            }

        }

        
        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId.startsWith('sorteio_select_canal_')) {
                const sorteioId = interaction.customId.replace('sorteio_select_canal_', '');
                const canalId = interaction.values[0];
                
                sorteios.set(`${sorteioId}.canalId`, canalId);

                await PaginaGerenciarCargos(interaction, sorteioId);
            }

            
            if (interaction.customId === 'stock_select_canal_logs') {
                const canalId = interaction.values[0];
                configuracao.set('solicitarStock.canalLogs', canalId);
                
                const { PainelSolicitarStock } = require("../../Functions/PainelSolicitarStock.js");
                await PainelSolicitarStock(interaction, client);
            }

            
            if (interaction.customId === 'stock_select_canal_postar') {
                const canalId = interaction.values[0];
                const { PostarPainelStock } = require("../../Functions/PainelSolicitarStock.js");
                await PostarPainelStock(interaction, canalId, client);
            }

            
            if (interaction.customId === 'sugestao_select_canal') {
                const canalId = interaction.values[0];
                configuracao.set('sistemaSugestoes.canal', canalId);
                const { PainelSistemaSugestoes } = require("../../Functions/SistemaSugestoes.js");
                await PainelSistemaSugestoes(interaction, client);
            }
        }

        
        if (interaction.isRoleSelectMenu()) {
            if (interaction.customId.startsWith('sorteio_cargos_permitidos_')) {
                const sorteioId = interaction.customId.replace('sorteio_cargos_permitidos_', ``);
                const cargos = interaction.values;
                
                sorteios.set(`${sorteioId}.cargosPermitidos`, cargos);

                await interaction.reply({ content: `${Emojis.get('checker')} | Cargos permitidos atualizados!`, flags: 64 });
            }

            if (interaction.customId.startsWith('sorteio_cargos_bloqueados_')) {
                const sorteioId = interaction.customId.replace('sorteio_cargos_bloqueados_', ``);
                const cargos = interaction.values;
                
                sorteios.set(`${sorteioId}.cargosBloqueados`, cargos);

                await interaction.reply({ content: `${Emojis.get('checker')} | Cargos bloqueados atualizados!`, flags: 64 });
            }

            
            if (interaction.customId === 'sugestao_select_cargo') {
                const cargoId = interaction.values[0];
                configuracao.set('sistemaSugestoes.cargoAvaliador', cargoId);
                const { PainelSistemaSugestoes } = require("../../Functions/SistemaSugestoes.js");
                await PainelSistemaSugestoes(interaction, client);
            }
        }

        if (interaction.isButton()) {

            
            if (interaction.customId.startsWith('produtos_page_')) {
                const page = parseInt(interaction.customId.split('_')[2], 10);
                await mostrarPaginaProdutos(interaction, page);
                return;
            }

            if (interaction.customId == `sincronizarticket`) {
                await interaction.reply({ content: `${Emojis.get('loading')} | Aguarde estamos atualizando suas mensagem!`, flags: 64 });
                await Checkarmensagensticket(client)
                interaction.editReply({ content: `${Emojis.get('checker')} | Mensagens atualizada com sucesso!`, flags: 64 });
            }


            if (interaction.customId == 'arquivar') {

                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get(`ConfigRoles.cargosup`))) return interaction.reply({ content: `${Emojis.get('negative')} | Você não tem permissão para fazer isso!`, flags: 64 });

                try {
                    await interaction.channel.setArchived(true)
                } catch (error) { }
            }

            
            if (interaction.customId === 'painel_staff') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get(`ConfigRoles.cargosup`))) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Você não tem permissão para acessar o painel staff!`, flags: 64 });
                }

                const selectMenu = new Discord.StringSelectMenuBuilder()
                    .setCustomId('staff_acoes_ticket')
                    .setPlaceholder('Selecione uma ação...')
                    .addOptions([
                        { label: 'Assumir Ticket', description: 'Assumir o atendimento deste ticket', value: 'assumir_ticket', emoji: { id: '1178067873894236311' } },
                        { label: 'Renomear Ticket', description: 'Alterar o nome do tópico', value: 'renomear_ticket', emoji: { id: '1178066208835252266' } },
                        { label: 'Adicionar Usuário', description: 'Adicionar alguém ao ticket', value: 'adicionar_usuario', emoji: { id: '1178067873894236311' } },
                        { label: 'Remover Usuário', description: 'Remover alguém do ticket', value: 'remover_usuario', emoji: { id: `1178076767567757312` } }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({ content: `${Emojis.get('ticketpanel')} **Painel da Equipe Staff**\n> Selecione uma ação abaixo:`, components: [row], flags: 64 });
            }

              if (interaction.customId === 'deletar') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) &&
                    !interaction.member.roles.cache.has(configuracao.get(`ConfigRoles.cargosup`))) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Você não tem permissão para fazer isso!`, flags: 64 });
                }

                await interaction.deferUpdate().catch(() => {});

                try {
                    const ticketId = interaction.channel.id;
                    const { Temporario } = require("../../database");
                    const { createHtmlTranscript } = require("../../Functions/Transcript");

                    let threadOwnerId = Temporario.get(`ticket_owner_${ticketId}`);
                    let categoria = Temporario.get(`ticket_categoria_${ticketId}`);

                    if (!threadOwnerId || !categoria) {
                        const threadNameParts = interaction.channel.name.split('・');
                        if (!categoria) categoria = threadNameParts[0] || 'Ticket';
                        if (!threadOwnerId) threadOwnerId = threadNameParts[2];
                    }

                    const fechadoPorTag = interaction.user.tag;
                    const agora = Math.floor(Date.now() / 1000);

                    const { attachment, messageCount } = await createHtmlTranscript(
                        interaction.channel, categoria, fechadoPorTag
                    );

                    const logsChannelId = configuracao.get(`ConfigChannels.logsticket`);
                    const logsChannel = interaction.guild.channels.cache.get(logsChannelId);

                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle(`🔒 Ticket Fechado: ${categoria}`)
                        .setDescription(
                            `Fechado por ${interaction.user} \`(${interaction.user.id})\`\n` +
                            `**Usuário:** <@${threadOwnerId}>\n` +
                            `**Canal:** \`${interaction.channel.name}\`\n` +
                            `**Mensagens registradas:** ${messageCount}`
                        )
                        .setTimestamp();

                    if (logsChannel) {
                        await logsChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(e => {
                            console.error('[Ticket] Erro ao enviar transcript ao canal de logs:', e.message);
                        });
                    }

                    if (threadOwnerId) {
                        try {
                            const owner = await interaction.client.users.fetch(threadOwnerId);

                            const dmContainer = res.main(
                                { type: 10, content: `# ${Emojis.get('_trash_emoji') || '🗑️'} Ticket Fechado` },
                                { type: 14 },
                                { type: 10, content: `> Seu ticket de **${categoria}** foi encerrado.` },
                                { type: 14 },
                                { type: 10, content: `**Fechado por**\n${fechadoPorTag}` },
                                { type: 10, content: `**Data**\n<t:${agora}:f>` },
                                { type: 14 },
                                { type: 10, content: `-# O transcript completo do atendimento está anexado abaixo.` }
                            );

                            if (messageCount > 0) {
                                const attachCopy = new (require('discord.js').AttachmentBuilder)(
                                    attachment.attachment, { name: attachment.name || `transcript_${ticketId}.html` }
                                );
                                await owner.send({ ...dmContainer, files: [attachCopy] });
                            } else {
                                await owner.send(dmContainer);
                            }
                        } catch (dmError) {
                            console.error('[Ticket] Não foi possível enviar DM ao usuário:', dmError.message);
                        }
                    }

                    Temporario.delete(`ticket_owner_${ticketId}`);
                    Temporario.delete(`ticket_categoria_${ticketId}`);
                    Temporario.delete(`ticket_assumido_${ticketId}`);

                    await interaction.channel.delete().catch(e => {
                        console.error('[Ticket] Erro ao deletar canal:', e.message);
                    });
                } catch (error) {
                    console.error('[Ticket] Erro ao fechar ticket:', error);
                    interaction.followUp({ content: `${Emojis.get('negative') || '❌'} | Erro ao fechar o ticket: ${error.message}`, flags: 64 }).catch(() => {});
                }
            }

            if (interaction.customId === 'lembrar123') {
                if (!interaction.member.roles.cache.has(configuracao.get('ConfigRoles.cargoadm')) && !interaction.member.roles.cache.has(configuracao.get(`ConfigRoles.cargosup`))) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Você não tem permissão para fazer isso!`, flags: 64 });
                }
            
                try {
                    const ticketId = interaction.channel.id;
                    const { Temporario } = require("../../database");
                    
                    
                    let threadOwnerId = Temporario.get(`ticket_owner_${ticketId}`);
                    if (!threadOwnerId) {
                        const threadNameParts = interaction.channel.name.split(`・`);
                        threadOwnerId = threadNameParts[2];
                    }
                    
                    if (!threadOwnerId || !/^\d+$/.test(threadOwnerId)) {
                        return interaction.reply({ content: `${Emojis.get('negative')} | Não foi possível identificar o dono do ticket.`, flags: 64 });
                    }
                    
                    const user = await interaction.client.users.fetch(threadOwnerId);
            
                    
                    const brazilTime = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
                    const hour = new Date(brazilTime).getHours();
                    let saudacao;
            
                    if (hour >= 0 && hour < 12) {
                        saudacao = 'Bom dia';
                    } else if (hour >= 12 && hour < 18) {
                        saudacao = 'Boa tarde';
                    } else {
                        saudacao = 'Boa noite';
                    }
            
                    
                    const mensagem = `${saudacao} <@${threadOwnerId}>, você possui um ticket pendente de resposta; se não for respondido, poderá ser fechado.`;
            
                    const row = new ActionRowBuilder() .addComponents(
                        new ButtonBuilder()
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
                            .setLabel('Ir para o Ticket')
                            .setStyle(`5`)
                    );
        
                    await user.send({
                        content: mensagem,
                        components: [row]
                    });
            
                    await interaction.reply({ content: `${Emojis.get('checker')} | Mensagem enviada ao criador do ticket.`, flags: 64 });
            
                } catch (error) {
                    await interaction.reply({ content: `${Emojis.get('negative')} | Não foi possível enviar a mensagem, pois o usuário provavelmente bloqueou mensagens privadas.`, flags: 64 });
                }
            }            

            if (interaction.customId == `postarticket`) {
                const ggg = tickets.get(`tickets.funcoes`)
                const ggg2 = tickets.get(`tickets.aparencia`)


                if (ggg == null || Object.keys(ggg).length == 0 || ggg2 == null || Object.keys(ggg2).length == 0) {
                    return interaction.reply({ content: `${Emojis.get('negative')} Adicione uma função antes de postar a mensagem.`, flags: 64 });
                } else {
                    const selectaaa = new Discord.ChannelSelectMenuBuilder()
                        .setCustomId('canalpostarticket')
                        .setPlaceholder(`Clique aqui para selecionar`)
                        .setChannelTypes(Discord.ChannelType.GuildText)

                    const row1 = new ActionRowBuilder()
                        .addComponents(selectaaa);

                    interaction.reply({ components: [row1], content: `${Emojis.get('info')} Selecione o canal onde quer postar a mensagem.`, flags: 64, })

                }
            }



            if (interaction.customId == `remfuncaoticket`) {
                const ggg = tickets.get(`tickets.funcoes`)
                    
                if (ggg == null || Object.keys(ggg).length == 0) {
                    return interaction.reply({ content: `${Emojis.get('negative')} Não existe nenhuma função criada para remover.`, flags: 64 });
                } else {
                    const selectMenuBuilder = new Discord.StringSelectMenuBuilder()
                        .setCustomId('deletarticketsfunction')
                        .setPlaceholder('Clique aqui para selecionar')
                        .setMinValues(0)

                    for (const chave in ggg) {
                        const item = ggg[chave];
                        const option = {
                            label: `${item.nome}`,
                            description: `${item.predescricao}`,
                            value: item.nome
                        };
                        selectMenuBuilder.addOptions(option);
                    }

                    selectMenuBuilder.setMaxValues(Object.keys(ggg).length)

                    const style2row = new ActionRowBuilder().addComponents(selectMenuBuilder);
                    try {
                        await interaction.reply({ components: [style2row], content: `${interaction.user} Qual funções deseja remover?`, flags: 64 })
                    } catch (error) {
                    }
                }
            }


            if (interaction.customId == 'rendimento') {
                return enviarRendimentosVisual(interaction, 'totalrendimento');
            }


            if (interaction.customId == 'gerenciarposicao') {

                Posicao1(interaction, client)

            }



            if (interaction.customId == 'Editarprimeiraposição') {

                const aa = configuracao.get('posicoes')

                const modalaAA = new ModalBuilder()
                    .setCustomId('aslfdjauydvaw769dg7waajnwndjo')
                    .setTitle(`Definir primeira posição`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`VALOR`)
                    .setPlaceholder(`Insira uma quantia, ex: 100`)
                    .setValue(aa?.pos1?.valor == undefined ? '' : aa.pos1?.valor)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`CARGO`)
                    .setPlaceholder(`Insira um id de algum cargo`)
                    .setValue(aa?.pos1?.role == undefined ? '' : aa.pos1?.role)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);

                modalaAA.addComponents(firstActionRow3, firstActionRow4);

                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'Editarsegundaposição') {
                const aa = configuracao.get('posicoes')

                const modalaAA = new ModalBuilder()
                    .setCustomId('awiohdbawudwdwhduawdnuaw')
                    .setTitle(`Definir segunda posição`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`VALOR`)
                    .setPlaceholder(`Insira uma quantia, ex: 100`)
                    .setValue(aa?.pos2?.valor == undefined ? '' : aa.pos2?.valor)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`CARGO`)
                    .setPlaceholder(`Insira um id de algum cargo`)
                    .setValue(aa?.pos2?.role == undefined ? '' : aa.pos2?.role)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);

                modalaAA.addComponents(firstActionRow3, firstActionRow4);

                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'Editarterceiraposição') {
                const aa = configuracao.get('posicoes')
                const modalaAA = new ModalBuilder()
                    .setCustomId('uy82819171h172')
                    .setTitle(`Definir terceira posição`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`VALOR`)
                    .setPlaceholder(`Insira uma quantia, ex: 100`)
                    .setValue(aa?.pos3?.valor == undefined ? '' : aa.pos3?.valor)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`CARGO`)
                    .setPlaceholder(`Insira um id de algum cargo`)
                    .setValue(aa?.pos3?.role == undefined ? '' : aa.pos3?.role)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);

                modalaAA.addComponents(firstActionRow3, firstActionRow4);

                await interaction.showModal(modalaAA);
            }


            if (interaction.customId == 'todayyyy' || interaction.customId == '7daysss' || interaction.customId == '30dayss' || interaction.customId == 'totalrendimento') {
                return enviarRendimentosVisual(interaction, interaction.customId);
            }




            if (interaction.customId.startsWith('criarrrr')) {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111idsjjsdua')
                    .setTitle(`Criação`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME`)
                    .setPlaceholder(`Insira o nome do seu produto`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`DESCRIÇÃO`)
                    .setPlaceholder(`Insira uma descrição para seu produto`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(1024)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`ENTREGA AUTOMÁTICA?`)
                    .setPlaceholder(`Digite "sim" ou "não"`)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setRequired(true)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP4')
                    .setLabel(`ICONE (OPCIONAL)`)
                    .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN6 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`BANNER (OPCIONAL)`)
                    .setPlaceholder(`Insira uma URL de uma imagem ou gif`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);



                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);

            }

            if (interaction.customId.startsWith('infoauth')) {

                infoauth(interaction, client)

            }

            if (interaction.customId.startsWith('voltarconfigauth')) {

                configauth(interaction, client)

            }
             if (interaction.customId.startsWith('sistemaauth')) {

                auth02api(interaction, client)

            }

            if (interaction.customId.startsWith('infosauth')) {

                infosauth(interaction, client)

            } 
              if (interaction.customId.startsWith('configurarmistic')) {

                misticConfigs(interaction, client)

            }

            if (interaction.customId.startsWith('config_pagamentos_inter')) {

                imapConfigs(interaction, client)

            }
          
             if (interaction.customId == "altMoeda") {

                await interaction.update({ content: `${Emojis.get('loading')} Carregando...`, embeds: [], components: [] });

                moedaConfig(interaction, client);

            }
          
            if (interaction.customId.startsWith('voltarauth')) {

                ecloudAuthPanel(interaction, client)

            }

            if (interaction.customId.startsWith('voltar1')) {
                try {
                await Painel(interaction, client);
                  } catch (err) {
                 console.error('Erro ao executar Painel:', err);
                await interaction.reply({ content: `${Emojis.get('negative')||''} Ocorreu um erro.`, flags: 64 });
                }
              }



            if (interaction.customId.startsWith('addfuncaoticket')) {

                const dd = tickets.get(`tickets.funcoes`)
               
                
                if (dd && Object.keys(dd).length > 24) {
                    return interaction.reply({ content: `${Emojis.get('negative')} | Você não pode criar mais de 24 funções em seu TICKET!` });
                }
                  
                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111231idsj1233js123dua123')
                    .setTitle(`Adicionar função`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DA FUNÇÃO`)
                    .setPlaceholder(`Insira aqui um nome, como: Suporte`)
                    .setStyle(TextInputStyle.Short)

                    .setRequired(true)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`PRÉ DESCRIÇÃO`)
                    .setPlaceholder(`Insira aqui uma pré descrição, ex: "Preciso de suporte."`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(99)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`DESCRIÇÃO`)
                    .setPlaceholder(`Insira aqui a descrição da função.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setMaxLength(99)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`BANNER (OPCIONAL)`)
                    .setPlaceholder(`Insira aqui uma URL de uma imagem ou GIF`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN6 = new TextInputBuilder()
                    .setCustomId('tokenMP6')
                    .setLabel(`EMOJI DA FUNÇÃO`)
                    .setPlaceholder(`Insira um nome ou id de um emoji do servidor.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);


                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);

            }
            if (interaction.customId.startsWith('definiraparencia')) {



                const modalaAA = new ModalBuilder()
                    .setCustomId('0-89du0awd8awdaw8daw')
                    .setTitle(`Editar Ticket`);

                const dd = tickets.get(`tickets.aparencia`)

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`TITULO`)
                    .setPlaceholder(`Insira aqui um nome, como: Entrar em contato`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(dd?.title == undefined ? '' : dd.title)
                    .setRequired(true)


                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`DESCRIÇÃO`)
                    .setPlaceholder(`Insira aqui uma descrição.`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(dd?.description == undefined ? '' : dd.description)
                    .setMaxLength(500)
                    .setRequired(true)


                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`BANNER (OPCIONAL)`)
                    .setPlaceholder(`Insira aqui uma URL de uma imagem ou GIF`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(dd?.banner == undefined ? '' : dd.banner)
                    .setRequired(false)



                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`COR DO EMBED (OPCIONAL)`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: FFFFFF`)
                    .setStyle(TextInputStyle.Short)
                    .setValue(dd?.color == undefined ? '' : dd.color)
                    .setRequired(false)


                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);

                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6);
                await interaction.showModal(modalaAA);



            }

            if (interaction.customId.startsWith('painelconfigticket')) {
                painelTicket(interaction)
            }

            
            if (interaction.customId === 'ticket_criar_painel') {
                await ModalCriarPainelTicket(interaction);
            }

            
            if (interaction.customId === 'ticket_voltar_lista') {
                await painelTicket(interaction);
            }

            
            if (interaction.customId.startsWith('ticket_editar_')) {
                const painelId = interaction.customId.replace('ticket_editar_', '');
                await ModalEditarPainel(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('ticket_addfuncao_')) {
                const painelId = interaction.customId.replace('ticket_addfuncao_', '');
                await ModalAddFuncaoTicket(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('ticket_remfuncao_')) {
                const painelId = interaction.customId.replace('ticket_remfuncao_', '');
                await PaginaRemoverFuncao(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('ticket_gerenciar_')) {
                const painelId = interaction.customId.replace('ticket_gerenciar_', '');
                await PaginaGerenciarPainel(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('ticket_preview_')) {
                const painelId = interaction.customId.replace('ticket_preview_', '');
                await PreviewTicket(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('ticket_categorias_')) {
                const painelId = interaction.customId.replace('ticket_categorias_', '');
                await PaginaCategorias(interaction, painelId);
            }

            
            if (interaction.customId.startsWith('painelconfigrobux')) {
                painelRobux(interaction)
            }

            if (interaction.customId === 'painel_calculadora') {
                const { painelCalculadora } = require("../../Functions/CalculadoraRobux");
                return painelCalculadora(interaction);
            }

            
            if (interaction.customId === 'robux_config_canais') {
                await configCanaisRobux(interaction);
            }

            
            if (interaction.customId === 'robux_config_valores') {
                await modalConfigValores(interaction);
            }

            
            if (interaction.customId === 'robux_config_limites') {
                await modalConfigLimites(interaction);
            }

            
            if (interaction.customId === 'voltar_robux_painel') {
                await painelRobux(interaction);
            }

            
            if (interaction.customId === 'robux_config_mensagem') {
                await painelConfigMensagem(interaction);
            }

            
            if (interaction.customId === 'robux_enviar_mensagem') {
                const Discord = require("discord.js");
                const selectChannel = new Discord.ChannelSelectMenuBuilder()
                    .setCustomId(`robux_channel_enviar_mensagem`)
                    .setPlaceholder(`Selecione o canal para enviar a mensagem`)
                    .setChannelTypes(Discord.ChannelType.GuildText);

                const row = new ActionRowBuilder().addComponents(selectChannel);
                await interaction.reply({ 
                    content: `${Emojis.get('info')} | Selecione o canal onde deseja enviar a mensagem de compra:`, 
                    components: [row], 
                    flags: 64 
                });
            }

            
            if (interaction.customId === 'robux_configurar_container') {
                await modalConfigurarContainer(interaction);
            }

            
            if (interaction.customId === 'robux_visualizar_mensagem') {
                await visualizarMensagem(interaction);
            }

            
            if (interaction.customId === 'voltar_config_mensagem') {
                await painelConfigMensagem(interaction);
            }

            if (interaction.customId === `robux_personalizar`) {
                await interaction.reply({ content: `${Emojis.get('negative')} | Esta função ainda está em desenvolvimento.`, flags: 64 });
            }

            
            if (interaction.customId === 'robux_gerenciar_cupons') { await painelCuponsRobux(interaction); }
            if (interaction.customId === 'robux_cupom_criar') { await modalCriarCupomRobux(interaction); }
            if (interaction.customId === 'robux_cupom_remover') { await modalRemoverCupomRobux(interaction); }
            if (interaction.customId === 'robux_cupom_toggle') { await modalToggleCupomRobux(interaction); }

            
            if (interaction.customId === 'robux_iniciar_compra_robux') {
                await mostrarStepNick(interaction, 'robux');
            }

            
            if (interaction.customId === 'robux_iniciar_compra_gamepass') {
                await mostrarStepNick(interaction, 'gamepass');
            }

            
            if (interaction.customId === 'robux_preencher_gp_info') {
                await modalGamepassInfo(interaction, 'gamepass_produto');
            }

            
            if (interaction.customId.startsWith('robux_tipo_sem_taxa_')) {
                const tipo = interaction.customId.replace('robux_tipo_sem_taxa_', '');
                if (tipo === 'gamepass') {
                    
                    await modalGamepassInfo(interaction, 'sem_taxa');
                } else {
                    
                    await buscarGamepassesParaMetodo(interaction, 'sem_taxa');
                }
            }

            if (interaction.customId.startsWith('robux_tipo_com_taxa_')) {
                const tipo = interaction.customId.replace('robux_tipo_com_taxa_', '');
                if (tipo === 'gamepass') {
                    
                    await modalGamepassInfo(interaction, 'com_taxa');
                } else {
                    
                    await buscarGamepassesParaMetodo(interaction, 'com_taxa');
                }
            }

            if (interaction.customId.startsWith('robux_tipo_via_grupo_')) {
                const tipo = interaction.customId.replace('robux_tipo_via_grupo_', '');
                
                await modalQuantidadeRobux(interaction, 'via_grupo', tipo);
            }

            
            if (interaction.customId.startsWith('robux_comprar_sem_taxa_')) {
                const parts = interaction.customId.replace('robux_comprar_sem_taxa_', '').split('_');
                const gamepassId = parts[0];
                const robuxAmount = parseInt(parts[1]);
                await mostrarCheckout(interaction, gamepassId, robuxAmount);
            }

            if (interaction.customId.startsWith('robux_comprar_com_taxa_')) {
                const parts = interaction.customId.replace('robux_comprar_com_taxa_', '').split('_');
                const gamepassId = parts[0];
                const robuxAmount = parseInt(parts[1]);
                await mostrarCheckout(interaction, gamepassId, robuxAmount);
            }

            
            if (interaction.customId === 'robux_cancelar_compra') {
                await cancelarCompra(interaction, client);
            }

            
            if (interaction.customId === 'robux_comprar_robux_btn') {
                await criarCarrinhoRobux(interaction, 'comprar_robux', client);
            }
            if (interaction.customId === 'robux_comprar_gamepass_btn') {
                await criarCarrinhoRobux(interaction, 'comprar_gamepass', client);
            }

            
            if (interaction.customId === 'robux_ler_termos') {
                const cfgCarrinho = mensagemRobux.get('configCarrinho') || {};
                const termosText = buildTermosText(cfgCarrinho);
                const segurancaText = buildSegurancaText(cfgCarrinho);
                const { res: resT } = require('../../res');
                const { Emojis: EjT } = require('../../database');
                await interaction.reply(
                    resT.main(
                        { type: 10, content: `## ${EjT.get('information_emoji')||''} Termos de Compra` },
                        { type: 14 },
                        { type: 10, content: termosText },
                        { type: 14 },
                        { type: 10, content: `## ${EjT.get('negative')||''} Aviso de Segurança` },
                        { type: 14 },
                        { type: 10, content: segurancaText },
                        { type: 14 },
                        { type: 10, content: `-# Leia com atenção antes de prosseguir.` }
                    ).with({ flags: [64] })
                );
            }

            
            if (interaction.customId === 'robux_config_termos') { await painelTermosRobux(interaction); }
            if (interaction.customId === 'robux_modal_termos_1') { await modalConfigurarTermos1(interaction); }
            if (interaction.customId === 'robux_modal_termos_2') { await modalConfigurarTermos2(interaction); }
            if (interaction.customId === 'robux_modal_termos_3') { await modalConfigurarTermos3(interaction); }

            
            if (interaction.customId.startsWith('robux_inserir_usuario_')) {
                const tipo = interaction.customId.replace('robux_inserir_usuario_', '');
                await modalNickRoblox(interaction, tipo);
            }

            
            if (interaction.customId.startsWith('robux_confirmar_perfil_')) {
                const tipo = interaction.customId.replace('robux_confirmar_perfil_', '');
                await confirmarPerfil(interaction, tipo);
            }

            
            if (interaction.customId.startsWith('robux_nao_sou_eu_')) {
                const tipo = interaction.customId.replace('robux_nao_sou_eu_', '');
                await mostrarStepNick(interaction, tipo);
            }
            if (interaction.customId.startsWith('robux_editar_perfil_')) {
                const tipo = interaction.customId.replace('robux_editar_perfil_', '');
                await mostrarStepNick(interaction, tipo);
            }

            
            if (interaction.customId === 'robux_config_painel') {
                await modalConfigurarPainel(interaction);
            }

            
            if (interaction.customId.startsWith('robux_gp_cat_')) {
                const raw = interaction.customId.replace('robux_gp_cat_', '');
                const splitIdx = raw.lastIndexOf('|||');
                const universeId = splitIdx > -1 ? raw.slice(0, splitIdx) : raw;
                const catId = splitIdx > -1 ? raw.slice(splitIdx + 3) : null;
                const catFinal = (catId === 'sem_cat' || catId === null) ? null : catId;
                const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
                if (carrinho) { carrinho.catSelecionada = catFinal; carrinhosRobux.set(`${interaction.user.id}`, carrinho); }
                await mostrarCarrinhoGamepassJogo(interaction, universeId, catFinal);
            }

            
            if (interaction.customId.startsWith('robux_gp_ir_pagamento_')) {
                const universeId = interaction.customId.replace('robux_gp_ir_pagamento_', ``);
                const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
                if (!carrinho || !carrinho.itensCarrinho || carrinho.itensCarrinho.length === 0) {
                    return interaction.reply({ content: `${Emojis.get('negative') || ''} | Adicione pelo menos um produto ao carrinho!`, flags: 64 });
                }
                const total = carrinho.itensCarrinho.reduce((s, i) => s + parseFloat(i.preco), 0);
                carrinho.valorFinal = total.toFixed(2);
                carrinho.tipoCompra = 'gamepass_jogo';
                carrinho.status = 'checkout';
                carrinhosRobux.set(`${interaction.user.id}`, carrinho);
                await irParaPagamentoRobux(interaction, client);
            }

            
            if (interaction.customId === `robux_jogo_nao_encontrado`) {
                await interaction.reply({ content: `${Emojis.get('info') || 'ℹ️'} | Entre em contato com o suporte para ajuda a encontrar o jogo desejado!`, flags: 64 });
            }

            
            if (interaction.customId === 'robux_atualizar_gamepass') {
                await atualizarGamepasses(interaction);
            }

            
            if (interaction.customId === 'robux_voltar_gamepasses') {
                await voltarParaGamepasses(interaction);
            }

            
            if (interaction.customId === 'robux_ir_pagamento') {
                const { configuracao: _cfg } = require('../../database');
                const _imapAtivo = (_cfg.get('pagamentos.imap.status') === true) && !!_cfg.get('pagamentos.imap.chavepiximap');
                const _mpAtivo = !!_cfg.get('pagamentos.MpAPI');
                const _efiAtivo = !!(_cfg.get('pagamentos.sistema_efi') && _cfg.get('pagamentos.secret_id') && _cfg.get('pagamentos.secret_token'));
                const _misticAtivo = !!(_cfg.get('pagamentos.MisticSystem') && _cfg.get('pagamentos.mistclientid') && _cfg.get('pagamentos.misticsecret'));
                
                if (_imapAtivo && !_mpAtivo && !_efiAtivo && !_misticAtivo) {
                    await mostrarModalNomeBancoImap(interaction);
                } else {
                    await irParaPagamentoRobux(interaction, client);
                }
            }

            
            if (interaction.customId === 'robux_copiar_pix') {
                await copiarPixRobux(interaction);
            }

            
            if (interaction.customId === `robux_copiar_pix_semi`) {
                const { carrinhosRobux } = require("../../Functions/CarrinhoRobux");
                const carrinho = carrinhosRobux.get(`${interaction.user.id}`);
                
                if (carrinho && carrinho.pagamento?.pixCopiaCola) {
                    const pagamento = configuracao.get(`pagamentos.SemiAutomatico`);
                    await interaction.reply({ 
                        content: `Chave pix: ${pagamento?.pix || carrinho.pagamento.pixCopiaCola}`, 
                        flags: 64 
                    });
                } else {
                    await interaction.reply({ 
                        content: `${Emojis.get('negative') || ''} | Código PIX não encontrado!`, 
                        flags: 64 
                    });
                }
            }

            
            if (interaction.customId === 'robux_confirmar_pagamento_manual') {
                const { confirmarPagamentoManualRobux } = require("../../Functions/PagamentoRobux");
                await confirmarPagamentoManualRobux(interaction, client);
            }

            
            if (interaction.customId.startsWith('robux_entrega_concluida_')) {
                const pedidoId = interaction.customId.replace('robux_entrega_concluida_', '');
                await confirmarEntregaRobux(interaction, pedidoId, client);
            }

            
            if (interaction.customId.startsWith('robux_aprovar_imap_')) {
                if (!interaction.member.permissions.has('Administrator') && !interaction.member.permissions.has('ManageGuild')) {
                    return interaction.reply({ content: `${Emojis.get('negative')||''} | Apenas administradores podem aprovar manualmente!`, flags: 64 });
                }
                const channelIdAprov = interaction.customId.replace('robux_aprovar_imap_', '');
                const { pagamentosRobux: pRobuxDb } = require('../../Functions/PagamentoRobux');
                const payData = pRobuxDb.get(channelIdAprov);
                if (!payData) {
                    return interaction.reply({ content: `${Emojis.get('negative')||''} | Pagamento não encontrado ou já aprovado!`, flags: 64 });
                }
                const { aprovarPagamentoRobux } = require('../../Functions/VerificarPagamentoRobux');
                await interaction.deferUpdate();
                const paymentEntry = {
                    ID: channelIdAprov,
                    data: {
                        pagamento: { ...payData.pagamento, aprovadoPor: `Manual por ${interaction.user.tag}` },
                        carrinho: payData.carrinho,
                        oderId: payData.oderId
                    }
                };
                const targetChannel = await client.channels.fetch(channelIdAprov).catch(() => interaction.channel);
                await aprovarPagamentoRobux(client, paymentEntry, targetChannel, `Manual (${interaction.user.tag})`);
            }



            if (interaction.customId.startsWith('personalizarbot')) {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111231idsjjs123dua123')
                    .setTitle(`Editar perfil do bot`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`NOME DE USUÁRIO`)
                    .setValue(`${client.user.username}`)
                    .setPlaceholder(`Insira um nome de usuário (só pode mudar 3x por hora)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`AVATAR`)
                    .setPlaceholder(`Insira uma URL de um ícone`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`STATUS 1`)
                    .setPlaceholder(`Insira aqui um status personalizado`)
                    
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`STATUS 2`)
                    
                    .setPlaceholder(`Insira aqui um status personalizado`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);

                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6);
                await interaction.showModal(modalaAA);

            }


            if (interaction.customId.startsWith('coresembeds')) {

                const modalaAA = new ModalBuilder()
                    .setCustomId('sdaju11111idsjjs123dua123')
                    .setTitle(`Editar cores dos embeds`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel(`COR PRINCIPAL`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #Obd4cd`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('tokenMP2')
                    .setLabel(`COR DE PROCESSAMENTO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #fcba03`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('tokenMP3')
                    .setLabel(`COR DE SUCESSO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #39fc03`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN5 = new TextInputBuilder()
                    .setCustomId('tokenMP5')
                    .setLabel(`COR DE FALHA`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #ff0000`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN6 = new TextInputBuilder()
                    .setCustomId('tokenMP6')
                    .setLabel(`COR DE FINALIZADO`)
                    .setPlaceholder(`Insira aqui um código Hex Color, ex: #7363ff`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN5);
                const firstActionRow7 = new ActionRowBuilder().addComponents(newnameboteN6);



                modalaAA.addComponents(firstActionRow3, firstActionRow4, firstActionRow5, firstActionRow6, firstActionRow7);
                await interaction.showModal(modalaAA);

            }



            if (interaction.customId.startsWith('voltar2')) {
                Gerenciar(interaction, client)

            }

            if (interaction.customId.startsWith('eaffaawwawa')) {
                automatico(interaction, client)
            }

            if (interaction.customId === `nobai_dev`) {
                interaction.reply({ 
                    content: `${Emojis.get('robot')||''} **Nob AI** está em desenvolvimento!\n\n> Em breve você terá acesso a recursos de inteligência artificial para automatizar ainda mais seu servidor.`, 
                    flags: 64 
                });
            }
            if (interaction.customId.startsWith('voltarautomaticos')) {
                automatico(interaction, client)
            }

            
            if (interaction.customId === 'sugestao_config_canal') {
                const { PaginaConfigurarCanal } = require("../../Functions/SistemaSugestoes.js");
                PaginaConfigurarCanal(interaction);
            }

            if (interaction.customId === 'sugestao_config_cargo') {
                const { PaginaConfigurarCargo } = require("../../Functions/SistemaSugestoes.js");
                PaginaConfigurarCargo(interaction);
            }

            if (interaction.customId === 'sugestao_toggle') {
                const { ToggleSugestoes } = require("../../Functions/SistemaSugestoes.js");
                ToggleSugestoes(interaction, client);
            }

            if (interaction.customId === 'sugestao_voltar_painel') {
                const { PainelSistemaSugestoes } = require("../../Functions/SistemaSugestoes.js");
                PainelSistemaSugestoes(interaction, client);
            }

            
            if (interaction.customId.startsWith('sug_votar_pos_')) {
                const sugestaoId = interaction.customId.replace('sug_votar_pos_', '');
                const { VotarSugestao } = require("../../Functions/SistemaSugestoes.js");
                VotarSugestao(interaction, sugestaoId, 'positivo');
            }

            if (interaction.customId.startsWith('sug_votar_neg_')) {
                const sugestaoId = interaction.customId.replace('sug_votar_neg_', '');
                const { VotarSugestao } = require("../../Functions/SistemaSugestoes.js");
                VotarSugestao(interaction, sugestaoId, 'negativo');
            }

            if (interaction.customId.startsWith('sug_gerenciar_')) {
                const sugestaoId = interaction.customId.replace('sug_gerenciar_', '');
                const { GerenciarSugestao } = require("../../Functions/SistemaSugestoes.js");
                GerenciarSugestao(interaction, sugestaoId);
            }

            if (interaction.customId.startsWith('sug_aprovar_')) {
                const sugestaoId = interaction.customId.replace('sug_aprovar_', '');
                const { AprovarSugestao } = require("../../Functions/SistemaSugestoes.js");
                AprovarSugestao(interaction, sugestaoId);
            }

            if (interaction.customId.startsWith('sug_reprovar_')) {
                const sugestaoId = interaction.customId.replace('sug_reprovar_', '');
                const { ReprovarSugestao } = require("../../Functions/SistemaSugestoes.js");
                ReprovarSugestao(interaction, sugestaoId);
            }

            if (interaction.customId === `sug_cancelar_gerenciar`) {
                await interaction.update({ content: `${Emojis.get('checker')} | Ação cancelada.`, components: [] });
            }

            if (interaction.customId.startsWith('ecloud')) {
                ecloudAuthPanel(interaction, client)
            }

            if (interaction.customId.startsWith('configauth')) {
                configauth(interaction, client)
            }

            if (interaction.customId.startsWith('gerenciarconfigs')) {
                Gerenciar(interaction, client)
            }
            if (interaction.customId.startsWith('configcargos')) {
                ConfigRoles(interaction, client)
            
            }
            if (interaction.customId.startsWith('painelpersonalizar')) {


                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("coresembeds")
                            .setLabel('Editar cores dos embeds')
                            .setEmoji(`1178080366871973958`)
                            .setStyle(1),

                        new ButtonBuilder()
                            .setCustomId("personalizarbot")
                            .setLabel('Personalizar Bot')
                            .setEmoji(`1178080828933283960`)
                            .setStyle(1),

                        new ButtonBuilder()
                            .setCustomId("definirtema")
                            .setLabel('Definir tema')
                            .setEmoji(`1178066208835252266`)
                            .setDisabled(false)
                            .setStyle(1)
                    )

                const row3 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("voltar1")
                            .setLabel('Voltar')
                            .setEmoji(`1178068047202893869`)
                            .setStyle(2)
                    )

                interaction.reply({ embeds: [], components: [row2, row3], content: `Escolha uma opção e use sua criatividade e profissionalismo ;) `, flags: 64 })


            }
            if (interaction.customId.startsWith('painelconfigbv')) {

                msgbemvindo(interaction, client)

            }
            if (interaction.customId.startsWith('gerenciarperm')) {
            GerenciarPermsADM(interaction, client);
            }
            if (interaction.customId.startsWith('systemsugestao')) {
            SistemaSugestao(interaction, client);
            }

            
            if (interaction.customId === 'stock_definir_canal') {
                const { PaginaDefinirCanalStock } = require("../../Functions/PainelSolicitarStock.js");
                PaginaDefinirCanalStock(interaction);
            }

            if (interaction.customId === 'stock_configurar_embed') {
                const { PaginaConfigurarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                PaginaConfigurarEmbed(interaction, client);
            }

            if (interaction.customId === 'stock_enviar') {
                const { PaginaEscolherCanalPostar } = require("../../Functions/PainelSolicitarStock.js");
                PaginaEscolherCanalPostar(interaction);
            }

            if (interaction.customId === 'stock_resetar') {
                const { ResetarConfiguracoes } = require("../../Functions/PainelSolicitarStock.js");
                ResetarConfiguracoes(interaction, client);
            }

            if (interaction.customId === 'stock_visualizar') {
                const { VisualizarEmbed } = require("../../Functions/PainelSolicitarStock.js");
                VisualizarEmbed(interaction);
            }

            if (interaction.customId === 'stock_voltar_painel') {
                const { PainelSolicitarStock } = require("../../Functions/PainelSolicitarStock.js");
                PainelSolicitarStock(interaction, client);
            }

            if (interaction.customId === 'solicitar_estoque_btn') {
                const { ModalSolicitarEstoque } = require("../../Functions/PainelSolicitarStock.js");
                ModalSolicitarEstoque(interaction);
            }

            if (interaction.customId.startsWith('voltar3')) {

                Gerenciar2(interaction, client)

            }
            if (interaction.customId.startsWith('automaticRepostar')) {

                AcoesRepostAutomatics(interaction, client)

            }
            if (interaction.customId.startsWith('voltar00')) {

                Painel(interaction, client)

            }

            if (interaction.customId.startsWith('painelconfigvendas')) {


              Gerenciar2(interaction, client)
           }

            
            if (interaction.customId === 'painelextensoes') {
              PainelExtensoes(interaction, client);
           }

            
            if (interaction.customId === `sistemamoderacao` || interaction.customId === 'painelmoderation') {
              const { PainelModeracao } = require("../../Functions/ModeracaoPanel");
              PainelModeracao(interaction, client);
           }

            
            if (interaction.customId === 'painelpermissions') {
              PainelPermissions(interaction, client);
           }

            
            if (interaction.customId === 'adicionar_perm') {
              ModalAdicionarPerm(interaction);
           }

            
            if (interaction.customId === 'remover_perm') {
              ModalRemoverPerm(interaction);
           }

            
            if (interaction.customId === 'resetar_perms') {
              HandleResetarPerms(interaction, client);
           }

            if (interaction.customId.startsWith('sistemasorteios')) {
              PainelSorteios(interaction, client);
           }

            
            if (interaction.customId === 'criar_sorteio') {
              try {
                await ModalCriarSorteio(interaction);
              } catch (err) {
                console.error('[criar_sorteio] Erro ao abrir modal:', err);
                try { await interaction.reply({ content: `Ocorreu um erro ao abrir o formulário. Tente novamente.`, flags: 64 }); } catch {}
              }
           }

            
            if (interaction.customId === 'gerenciar_sorteios') {
              PaginaGerenciarSorteios(interaction, client);
           }

            
            if (interaction.customId.startsWith('gerenciar_sorteio_')) {
              const sorteioId = interaction.customId.replace('gerenciar_sorteio_', '');
              PaginaGerenciarSorteioEspecifico(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('gerenciar_forcar_')) {
              const sorteioId = interaction.customId.replace('gerenciar_forcar_', '');
              PaginaConfirmarForcarFinalizacao(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('confirmar_forcar_')) {
              const sorteioId = interaction.customId.replace('confirmar_forcar_', '');
              forcarFinalizacao(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('gerenciar_addtempo_')) {
              const sorteioId = interaction.customId.replace('gerenciar_addtempo_', '');
              ModalAdicionarTempo(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('gerenciar_descontinuar_')) {
              const sorteioId = interaction.customId.replace('gerenciar_descontinuar_', '');
              PaginaConfirmarDescontinuar(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('confirmar_descontinuar_')) {
              const sorteioId = interaction.customId.replace('confirmar_descontinuar_', '');
              descontinuarSorteio(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('gerenciar_verparticipantes_')) {
              const sorteioId = interaction.customId.replace('gerenciar_verparticipantes_', '');
              gerarListaParticipantes(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('sorteio_tempo_manual_')) {
              const sorteioId = interaction.customId.replace('sorteio_tempo_manual_', '');
              ModalTempoPersonalizado(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('sorteio_voltar_tempo_')) {
              const sorteioId = interaction.customId.replace('sorteio_voltar_tempo_', '');
              PaginaSetarTempo(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('sorteio_voltar_canal_')) {
              const sorteioId = interaction.customId.replace('sorteio_voltar_canal_', '');
              PaginaEscolherCanal(interaction, sorteioId);
           }

            
            if (interaction.customId.startsWith('sorteio_finalizar_')) {
              const sorteioId = interaction.customId.replace('sorteio_finalizar_', '');
              EnviarMensagemSorteio(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('sorteio_participar_')) {
              const sorteioId = interaction.customId.replace('sorteio_participar_', ``);
              const sorteioData = sorteios.get(sorteioId);

              if (!sorteioData || sorteioData.status !== "ativo") {
                return interaction.reply({ content: `${Emojis.get('negative')} | Este sorteio não está mais ativo!`, flags: 64 });
              }

              const userId = interaction.user.id;
              const participantes = sorteioData.participantes || [];

              
              if (sorteioData.cargosPermitidos && sorteioData.cargosPermitidos.length > 0) {
                const temCargoPermitido = sorteioData.cargosPermitidos.some(cargoId => 
                  interaction.member.roles.cache.has(cargoId)
                );
                if (!temCargoPermitido) {
                  return interaction.reply({ content: `${Emojis.get('negative')} | Você não possui os cargos necessários para participar!`, flags: 64 });
                }
              }

              
              if (sorteioData.cargosBloqueados && sorteioData.cargosBloqueados.length > 0) {
                const temCargoBloqueado = sorteioData.cargosBloqueados.some(cargoId => 
                  interaction.member.roles.cache.has(cargoId)
                );
                if (temCargoBloqueado) {
                  return interaction.reply({ content: `${Emojis.get('negative')} | Você possui um cargo que não pode participar deste sorteio!`, flags: 64 });
                }
              }

              if (participantes.includes(userId)) {
                return interaction.reply({ content: `${Emojis.get('negative')} | Você já está participando deste sorteio!`, flags: 64 });
              }

              participantes.push(userId);
              sorteios.set(`${sorteioId}.participantes`, participantes);

              
              await atualizarEmbedSorteio(sorteioId, client);

              interaction.reply({ content: `${Emojis.get('checker')} | Você está participando do sorteio **${sorteioData.titulo}**! ${Emojis.get('giveaway')||''}`, flags: 64 });
           }

            
            if (interaction.customId.startsWith('sorteio_reroll_')) {
              const sorteioId = interaction.customId.replace('sorteio_reroll_', '');
              await rerollSorteio(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('sorteio_lista_')) {
              const sorteioId = interaction.customId.replace('sorteio_lista_', '');
              await gerarListaParticipantes(interaction, sorteioId, client);
           }

            
            if (interaction.customId.startsWith('sorteio_cancelar_')) {
              const sorteioId = interaction.customId.replace('sorteio_cancelar_', '');
              sorteios.delete(sorteioId);
              PainelSorteios(interaction, client);
           }
        }
    }
}