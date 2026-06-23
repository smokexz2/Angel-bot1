const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { configuracao, tickets, Temporario } = require("../database");
const { res } = require("../res");
const emojis = require("../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};

async function CreateTicket(interaction, painelId, funcaoId) {
    const supRole = configuracao.get(`ConfigRoles.cargosup`);

    
    if (!supRole) {
        return interaction.reply({ 
            content: `${Emojis.get(`negative`)} | O sistema de tickets não está configurado corretamente. Configure o cargo de suporte primeiro!`, 
            flags: 64 
        });
    }

    await interaction.reply({ content: `${Emojis.get(`loading`)} | Aguarde, estamos criando seu Ticket!`, flags: 64 });

    let painel, funcao, modoExibicao;

    
    if (painelId) {
        painel = tickets.get(`tickets.paineis.${painelId}`);
        console.log(`[CreateTicket] Buscando painel: ${painelId}`, painel ? `Encontrado` : `Não encontrado`);
        
        if (!painel) {
            return interaction.editReply({ content: `${Emojis.get(`negative`)} | Painel de ticket não encontrado!`, flags: 64 });
        }
        
        funcao = painel?.funcoes?.[funcaoId];
        console.log(`[CreateTicket] Buscando função: ${funcaoId}`, funcao ? `Encontrada` : `Não encontrada`);
        console.log(`[CreateTicket] Funções disponíveis:`, Object.keys(painel?.funcoes || {}));
        
        modoExibicao = painel?.modoExibicao || "embed";
    } else {
        funcao = tickets.get(`tickets.funcoes.${funcaoId}`);
        console.log(`[CreateTicket] Sistema legado - Buscando função: ${funcaoId}`, funcao ? `Encontrada` : 'Não encontrada');
        modoExibicao = "embed";
        painel = { cor: configuracao.get('Cores.Principal') || `#2b2d31` };
    }

    if (!funcao) {
        return interaction.editReply({ content: `${Emojis.get(`negative`)} | Essa categoria de ticket não existe!`, flags: 64 });
    }

    
    const existingThread = interaction.channel.threads.cache.find(thread => 
        thread.name.includes(interaction.user.id) && 
        !thread.archived &&
        thread.name.startsWith(funcao.nome)
    );
    
    if (existingThread) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${existingThread.id}`)
                .setLabel(`Ir para o Ticket`)
                .setStyle(5)
        );
        return interaction.editReply({ content: `${Emojis.get(`negative`)} Você já possui um ticket aberto desta categoria.`, components: [row], flags: 64 });
    }

    const adminRole = configuracao.get('ConfigRoles.cargoadm');

    console.log(`[CreateTicket] Criando thread para ${interaction.user.username} - Categoria: ${funcao.nome}`);

    
    const thread = await interaction.channel.threads.create({
        name: `${funcao.nome}・${interaction.user.username}・${interaction.user.id}`,
        type: ChannelType.PrivateThread,
        reason: 'Ticket aberto',
        invitable: false
    }).catch(err => {
        console.error('[CreateTicket] Erro ao criar thread:', err);
        throw new Error(`Não foi possível criar o ticket: ${err.message}`);
    });

    
    try {
        await thread.members.add(interaction.user.id);
        console.log(`[CreateTicket] Usuário ${interaction.user.username} adicionado ao thread`);
    } catch (err) {
        console.error('[CreateTicket] Erro ao adicionar usuário:', err);
    }

    const rowLink = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)
            .setLabel(`Ir para o Ticket`)
            .setStyle(5)
    );

    await interaction.editReply({ content: `${Emojis.get(`checker`)} Ticket criado com sucesso!`, components: [rowLink], flags: 64 });

    
    Temporario.set(`ticket_owner_${thread.id}`, interaction.user.id);
    Temporario.set(`ticket_categoria_${thread.id}`, funcao.nome);

    
    const actionRow = new ActionRowBuilder().addComponents(
        (() => { const b = new ButtonBuilder().setCustomId('deletar').setLabel('Fechar Ticket').setStyle(4); const e = Emojis.get('_trash_emoji'); if (e) b.setEmoji(e); return b; })(),
        (() => { const b = new ButtonBuilder().setCustomId('lembrar123').setLabel('Lembrar Usuário').setStyle(2); const e = Emojis.get('_notify_emoji'); if (e) b.setEmoji(e); return b; })(),
        (() => { const b = new ButtonBuilder().setCustomId('painel_staff').setLabel('Painel Staff').setStyle(2); const e = Emojis.get('ticketpanel'); if (e) b.setEmoji(e); return b; })()
    );

    const descricaoTicket = funcao.descricao || "Aguarde um momento, nossa equipe já irá lhe atender.";

    if (modoExibicao === "container") {
        
        
        await thread.send({ content: `${interaction.user} <@&${supRole}>` });

        const containerComponents = [
            { type: 10, content: `# ${Emojis.get(`ticketpanel`)} Atendimento Criado` },
            { type: 14 },
            { type: 10, content: `> ${descricaoTicket}` }
        ];

        
        if (funcao.banner && funcao.banner.startsWith('http')) {
            containerComponents.push({ type: 14 });
            containerComponents.push({ type: 12, items: [{ media: { url: funcao.banner.trim() }, spoiler: false }] });
        }

        const containerMsg = res.main(...containerComponents).with({ components: [actionRow] });

        await thread.send(containerMsg);
    } else {
        
        const embed = new EmbedBuilder()
            .setColor(painel?.cor || configuracao.get('Cores.Principal') || '#2b2d31')
            .setAuthor({ name: `Sistema de Atendimento`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTitle(`Atendimento Criado`)
            .setDescription(`> ${descricaoTicket}`)
            .setTimestamp();

        if (funcao.banner) embed.setImage(funcao.banner);

        await thread.send({
            content: `${interaction.user} <@&${supRole}>`,
            embeds: [embed],
            components: [actionRow]
        });
    }
}

module.exports = { CreateTicket };