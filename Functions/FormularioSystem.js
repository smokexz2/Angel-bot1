




const { ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder } = require("discord.js");
const { configuracao, EmojisHelper } = require("../database");
const { res } = require("../res");
const { JsonDatabase } = require("../database/jsondb");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

const formularioDB = new JsonDatabase({ databasePath: './database/formulario.json' });

function btn(id, label, style, emojiKey) {
    const b = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
    const e = E(emojiKey);
    if (e) b.setEmoji(e);
    return b;
}


async function PainelFormulario(interaction, client) {
    const canalEnvio = configuracao.get('formulario.canalEnvio');
    const canalForms = configuracao.get('formulario.canalForms');
    const cargoStaff = configuracao.get('formulario.cargoStaff');
    const habilitado = configuracao.get('formulario.habilitado') || false;
    const perguntas = formularioDB.get('perguntas') || [];
    const titulo = configuracao.get('formulario.titulo') || 'Formulário para Staff';

    const envioTxt = canalEnvio ? `<#${canalEnvio}>` : '`Não configurado`';
    const formsTxt = canalForms ? `<#${canalForms}>` : '`Não configurado`';
    const cargoTxt = cargoStaff ? `<@&${cargoStaff}>` : '`Não configurado`';
    const statusTxt = habilitado ? `${E('ligado')} Habilitado` : `${E('desligado')} Desabilitado`;

    const podeHabilitar = !!(canalEnvio && canalForms && perguntas.length > 0);

    const row1 = new ActionRowBuilder().addComponents(
        btn('form_config_canalanuncio', 'Canal do Botão', 2, 'logss'),
        btn('form_config_canalforms', 'Canal de Respostas', 2, 'logss'),
        btn('form_config_cargo', 'Cargo Staff', 2, 'cargovery'),
    );
    const row2 = new ActionRowBuilder().addComponents(
        btn('form_add_pergunta', 'Adicionar Pergunta', 2, 'sucesso'),
        btn('form_ver_perguntas', `Ver Perguntas (${perguntas.length})`, 2, '_settings_emoji'),
        btn('form_enviar_painel', 'Enviar Painel', 3, 'antena'),
    );
    const row3 = new ActionRowBuilder().addComponents(
        btn('form_toggle', habilitado ? 'Desabilitar' : 'Habilitar', habilitado ? 4 : 3, habilitado ? 'desligado' : 'ligado'),
        btn('voltarautomaticos', 'Voltar', 2, '_back_emoji'),
    );

    const container = res.main(
        { type: 10, content: `-# Painel > Ações Automáticas > Formulário Staff` },
        { type: 14 },
        { type: 10, content: `### ${E('sucesso') || '📋'} Sistema de Formulário\nGerencie inscrições para staff do servidor via formulário interativo.` },
        { type: 14 },
        { type: 10, content: `> **Status:** ${statusTxt}\n> **Título:** ${titulo}\n> **Canal Botão:** ${envioTxt}\n> **Respostas:** ${formsTxt}\n> **Cargo:** ${cargoTxt}\n> **Perguntas:** ${perguntas.length}` },
        { type: 14 },
        { type: 10, content: `-# Configure os canais e adicione perguntas para habilitar.` }
    ).with({ components: [row1, row2, row3], flags: [64] });

    if (interaction.message == null) interaction.reply(container);
    else interaction.update(container);
}

async function EnviarPainelFormulario(interaction, client) {
    const canalEnvio = configuracao.get('formulario.canalEnvio');
    if (!canalEnvio) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure o canal de anúncio primeiro.` }).with({ flags: [64] }));
    }
    const perguntas = formularioDB.get('perguntas') || [];
    if (perguntas.length === 0) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Adicione pelo menos uma pergunta antes.` }).with({ flags: [64] }));
    }

    try {
        const ch = await client.channels.fetch(canalEnvio);
        const titulo = configuracao.get('formulario.titulo') || 'Formulário para Staff';
        const descricao = configuracao.get('formulario.descricao') || 'Clique no botão abaixo para iniciar sua inscrição para a equipe de staff.';

        const rowBtn = new ActionRowBuilder().addComponents(
            btn('formulario_iniciar', '📋 Iniciar Formulário', ButtonBuilder.StyleSheet?.Primary || 1)
        );

        await ch.send(res.main(
            { type: 10, content: `### ${E('sucesso') || '📋'} ${titulo}` },
            { type: 14 },
            { type: 10, content: descricao },
            { type: 14 },
            { type: 10, content: `-# Clique no botão abaixo para iniciar o processo de inscrição.` }
        ).with({ components: [rowBtn] }));

        interaction.reply(res.main(
            { type: 10, content: `${E('checker') || '✅'} Painel de formulário enviado em <#${canalEnvio}>!` }
        ).with({ flags: [64] }));
    } catch (e) {
        interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
    }
}


const formularioEmAndamento = new Map();

async function IniciarFormulario(interaction, client) {
    const habilitado = configuracao.get('formulario.habilitado');
    if (!habilitado) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} O sistema de formulário está desabilitado no momento.` }).with({ flags: [64] }));
    }

    const perguntas = formularioDB.get('perguntas') || [];
    if (perguntas.length === 0) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Ainda não há perguntas configuradas.` }).with({ flags: [64] }));
    }

    formularioEmAndamento.set(interaction.user.id, { respostas: [], perguntaAtual: 0, perguntas });
    await EnviarPergunta(interaction, 0, perguntas);
}

async function EnviarPergunta(interaction, idx, perguntas) {
    const pergunta = perguntas[idx];
    const modal = new ModalBuilder()
        .setCustomId(`formulario_resposta_${idx}`)
        .setTitle(`Pergunta ${idx + 1} de ${perguntas.length}`);

    modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('resposta')
            .setLabel(pergunta.substring(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
    ));

    try { await interaction.showModal(modal); } catch (e) { await interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro ao abrir formulário.` }).with({ flags: [64] })); }
}

async function HandleRespostaFormulario(interaction, client, idx) {
    const resposta = interaction.fields.getTextInputValue('resposta');
    const estado = formularioEmAndamento.get(interaction.user.id);

    if (!estado) {
        return interaction.reply(res.main({ type: 10, content: `${E('negative')} Sessão expirada. Clique em Iniciar Formulário novamente.` }).with({ flags: [64] }));
    }

    estado.respostas.push(resposta);
    estado.perguntaAtual++;

    if (estado.perguntaAtual < estado.perguntas.length) {
        
        await interaction.deferUpdate().catch(() => interaction.reply(res.main({ type: 10, content: `-# Resposta salva. Aguardando próxima pergunta...` }).with({ flags: [64] })).catch(() => {}));
        try {
            const nextPergunta = estado.perguntas[estado.perguntaAtual];
            const modal = new ModalBuilder()
                .setCustomId(`formulario_resposta_${estado.perguntaAtual}`)
                .setTitle(`Pergunta ${estado.perguntaAtual + 1} de ${estado.perguntas.length}`);
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('resposta').setLabel(nextPergunta.substring(0, 45)).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
            ));
            await interaction.followUp({ content: `${E('sucesso') || '📋'} Próxima pergunta...`, flags: [64] });
        } catch {}
    } else {
        
        formularioEmAndamento.delete(interaction.user.id);
        await FinalizarFormulario(interaction, client, estado);
    }
}

async function FinalizarFormulario(interaction, client, estado) {
    const canalForms = configuracao.get('formulario.canalForms');
    const titulo = configuracao.get('formulario.titulo') || 'Formulário Staff';

    const respostasText = estado.perguntas.map((p, i) => `> **${i+1}. ${p}**\n> ${estado.respostas[i] || 'Sem resposta'}`).join('\n\n');

    const rowAcoes = new ActionRowBuilder().addComponents(
        btn(`form_aprovar_${interaction.user.id}`, 'Aprovar', 3, 'checker'),
        btn(`form_reprovar_${interaction.user.id}`, 'Reprovar', 4, 'negative'),
    );

    try {
        if (canalForms) {
            const ch = await client.channels.fetch(canalForms);
            if (ch) await ch.send(res.main(
                { type: 10, content: `-# ${titulo} > Nova Inscrição` },
                { type: 14 },
                { type: 10, content: `### ${E('sucesso') || '📋'} Nova Inscrição Recebida\n> **Candidato:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n> **Data:** <t:${Math.floor(Date.now()/1000)}:F>` },
                { type: 14 },
                { type: 10, content: respostasText }
            ).with({ components: [rowAcoes] }));
        }
    } catch {}

    await interaction.reply(res.main(
        { type: 10, content: `### ${E('checker') || '✅'} Formulário Enviado!\nSua inscrição foi recebida e será avaliada pela equipe. Obrigado pelo interesse!` }
    ).with({ flags: [64] }));
}


async function AprovarCandidato(interaction, client, userId) {
    const cargoStaff = configuracao.get('formulario.cargoStaff');
    try {
        if (cargoStaff) {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (member) await member.roles.add(cargoStaff).catch(() => {});
        }
        try {
            const user = await client.users.fetch(userId);
            await user.send(res.main({ type: 10, content: `### ${E('checker') || '✅'} Parabéns!\nSua inscrição para staff foi **aprovada**! Bem-vindo à equipe!` }));
        } catch {}
        await interaction.update(res.main(
            { type: 10, content: `${E('checker') || '✅'} Candidato <@${userId}> **aprovado** com sucesso!` }
        ));
    } catch (e) {
        interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
    }
}

async function ReprovarCandidato(interaction, client, userId) {
    try {
        try {
            const user = await client.users.fetch(userId);
            await user.send(res.main({ type: 10, content: `### ${E('negative')} Inscrição Reprovada\nInfelizmente sua inscrição para staff não foi aprovada desta vez. Continue participando do servidor!` }));
        } catch {}
        await interaction.update(res.main(
            { type: 10, content: `${E('negative')} Candidato <@${userId}> **reprovado**.` }
        ));
    } catch (e) {
        interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
    }
}


async function HandleFormularioButtons(interaction, client) {
    const cid = interaction.customId;

    if (cid === 'form_config_canalanuncio') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Formulário > Canal do Botão` },
            { type: 14 },
            { type: 10, content: `### Selecione onde o botão de inscrição será enviado` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('form_select_canalanuncio').setPlaceholder('Canal do botão...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('form_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'form_config_canalforms') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Formulário > Canal de Respostas` },
            { type: 14 },
            { type: 10, content: `### Selecione onde as inscrições serão recebidas` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('form_select_canalforms').setPlaceholder('Canal de respostas...').setChannelTypes(ChannelType.GuildText)),
                new ActionRowBuilder().addComponents(btn('form_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'form_config_cargo') {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Formulário > Cargo Staff` },
            { type: 14 },
            { type: 10, content: `### Selecione o cargo que será dado aos aprovados` }
        ).with({
            components: [
                new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('form_select_cargo').setPlaceholder('Cargo staff...')),
                new ActionRowBuilder().addComponents(btn('form_voltar_painel', 'Voltar', 2, '_back_emoji'))
            ], flags: [64]
        }));
    }
    if (cid === 'form_add_pergunta') {
        const modal = new ModalBuilder().setCustomId('form_modal_addpergunta').setTitle('Adicionar Pergunta');
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pergunta').setLabel('Escreva a pergunta').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(200).setPlaceholder('Ex: Quantos anos você tem?')
        ));
        return interaction.showModal(modal);
    }
    if (cid === 'form_ver_perguntas') {
        const perguntas = formularioDB.get('perguntas') || [];
        if (perguntas.length === 0) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Nenhuma pergunta cadastrada ainda.` }).with({ flags: [64] }));
        }
        const lista = perguntas.map((p, i) => `> **${i+1}.** ${p}`).join('\n');
        const rowV = new ActionRowBuilder().addComponents(
            btn('form_limpar_perguntas', 'Limpar Todas', 4, 'negative'),
            btn('form_voltar_painel', 'Voltar', 2, '_back_emoji'),
        );
        return interaction.reply(res.main(
            { type: 10, content: `-# Perguntas Cadastradas` },
            { type: 14 },
            { type: 10, content: `### ${E('sucesso') || '📋'} Perguntas (${perguntas.length})\n${lista}` }
        ).with({ components: [rowV], flags: [64] }));
    }
    if (cid === 'form_limpar_perguntas') {
        formularioDB.set('perguntas', []);
        return PainelFormulario(interaction, client);
    }
    if (cid === 'form_enviar_painel') return EnviarPainelFormulario(interaction, client);
    if (cid === 'form_voltar_painel') return PainelFormulario(interaction, client);
    if (cid === 'form_toggle') {
        const hab = configuracao.get('formulario.habilitado') || false;
        const canalEnvio = configuracao.get('formulario.canalEnvio');
        const canalForms = configuracao.get('formulario.canalForms');
        const perguntas = formularioDB.get('perguntas') || [];
        if (!hab && (!canalEnvio || !canalForms || perguntas.length === 0)) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Configure os canais e adicione perguntas primeiro.` }).with({ flags: [64] }));
        }
        configuracao.set('formulario.habilitado', !hab);
        return PainelFormulario(interaction, client);
    }
    if (cid === 'formulario_iniciar') return IniciarFormulario(interaction, client);
    if (cid.startsWith('form_aprovar_')) {
        const userId = cid.replace('form_aprovar_', '');
        return AprovarCandidato(interaction, client, userId);
    }
    if (cid.startsWith('form_reprovar_')) {
        const userId = cid.replace('form_reprovar_', '');
        return ReprovarCandidato(interaction, client, userId);
    }
}

async function HandleFormularioSelect(interaction, client) {
    const cid = interaction.customId;
    if (cid === 'form_select_canalanuncio') {
        configuracao.set('formulario.canalEnvio', interaction.values[0]);
        return PainelFormulario(interaction, client);
    }
    if (cid === 'form_select_canalforms') {
        configuracao.set('formulario.canalForms', interaction.values[0]);
        return PainelFormulario(interaction, client);
    }
    if (cid === 'form_select_cargo') {
        configuracao.set('formulario.cargoStaff', interaction.values[0]);
        return PainelFormulario(interaction, client);
    }
}

async function HandleFormularioModal(interaction, client) {
    const cid = interaction.customId;
    if (cid === 'form_modal_addpergunta') {
        const pergunta = interaction.fields.getTextInputValue('pergunta');
        const perguntas = formularioDB.get('perguntas') || [];
        if (perguntas.length >= 10) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Máximo de 10 perguntas atingido. Remova algumas antes de adicionar.` }).with({ flags: [64] }));
        }
        perguntas.push(pergunta);
        formularioDB.set('perguntas', perguntas);
        return PainelFormulario(interaction, client);
    }
    if (cid.startsWith('formulario_resposta_')) {
        const idx = parseInt(cid.replace('formulario_resposta_', ''));
        return HandleRespostaFormulario(interaction, client, idx);
    }
}

module.exports = { PainelFormulario, HandleFormularioButtons, HandleFormularioSelect, HandleFormularioModal };