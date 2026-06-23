const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");
const fs = require('fs');
const path = require('path');
const msgAutoPath = path.resolve(__dirname, '../../database/msgauto.json');
const { res } = require('../../res');
const emojis = require("../../database/emojis.json");

const Emojis = {
    get: (name) => emojis[name] || ""
};


function loadMsgData() {
    try {
        if (fs.existsSync(msgAutoPath)) {
            return JSON.parse(fs.readFileSync(msgAutoPath, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveMsgData(data) {
    fs.writeFileSync(msgAutoPath, JSON.stringify(data, null, 2));
}


async function painelPrincipal(interaction) {
    const msgData = loadMsgData();
    const total = msgData.length;
    const ativos = msgData.filter(m => m.enabled).length;
    const desativados = total - ativos;
    const canais = [...new Set(msgData.flatMap(m => m.chatIds))].length;

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltar_painel_principal')
            .setLabel('Voltar')
            .setEmoji('1178068047202893869')
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Mensagens Automáticas` },
        { type: 14 },
        { type: 10, content: `**Sistema de Mensagens Automáticas**\n-# Configure mensagens para serem enviadas automaticamente em intervalos definidos.` },
        { type: 14 },
        { type: 10, content: `**Total de Mensagens Criadas:** ${total}\n**Mensagens Ativas:** ${ativos}\n**Mensagens Desativadas:** ${desativados}\n**Canais Configurados:** ${canais}` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: 2, custom_id: 'criar_msg_auto', label: 'Criar Mensagem', emoji: { id: '1387981753133826068' } },
                { type: 2, style: 2, custom_id: 'gerenciar_msg_auto', label: 'Gerenciar', emoji: { id: '1387981742069252326' }, disabled: total === 0 },
                { type: 2, style: 4, custom_id: 'deletar_msg_auto', label: 'Deletar', emoji: { id: `1387981752240439347` }, disabled: total === 0 }
            ]
        }
    ).with({ components: [rowVoltar], flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

async function painelGerenciar(interaction) {
    const msgData = loadMsgData();

    if (msgData.length === 0) {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Mensagens Automáticas > Gerenciar` },
            { type: 14 },
            { type: 10, content: `${Emojis.get(`negative`)} Nenhuma mensagem automática configurada.` }
        ).with({ flags: [64] }));
    }

    const options = msgData.map(m => ({
        label: `Mensagem #${m.id}`,
        description: m.message.slice(0, 50) + (m.message.length > 50 ? '...' : ''),
        value: m.id.toString(),
        emoji: m.enabled ? { id: '1384035178749497445' } : { id: '1384035206402408518' }
    }));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltar_msg_auto')
            .setLabel('Voltar')
            .setEmoji('1178068047202893869')
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Mensagens Automáticas > Gerenciar` },
        { type: 14 },
        { type: 10, content: `**Gerenciar Mensagens**\n-# Selecione uma mensagem para editar, ativar/desativar ou adicionar botões.` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: 'select_gerenciar_msg',
                placeholder: `Selecione uma mensagem`,
                options: options
            }]
        }
    ).with({ components: [row], flags: [64] });

    await interaction.update(containerContent);
}

async function painelGerenciarMensagem(interaction, msgId) {
    const msgData = loadMsgData();
    const msg = msgData.find(m => m.id === msgId);

    if (!msg) {
        return interaction.update(res.main(
            { type: 10, content: `${Emojis.get(`negative`)} Mensagem não encontrada.` }
        ).with({ flags: [64] }));
    }

    const statusEmoji = msg.enabled ? Emojis.get('checker') : Emojis.get('negative');
    const statusText = msg.enabled ? 'Ativa' : 'Desativada';
    const btnCount = msg.buttons ? msg.buttons.length : 0;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltar_msg_auto')
            .setLabel('Voltar')
            .setEmoji(`1178068047202893869`)
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Mensagens Automáticas > Gerenciar > #${msgId}` },
        { type: 14 },
        { type: 10, content: `**Gerenciando Mensagem #${msgId}**` },
        { type: 14 },
        { type: 10, content: `${statusEmoji} **Status da Mensagem:** ${statusText}\n**Intervalo de Repostagem:** ${msg.interval} minutos\n**Canais Configurados:** ${msg.chatIds.length}\n**Botões com Link:** ${btnCount}/5` },
        { type: 14 },
        {
            type: 1,
            components: [
                { type: 2, style: msg.enabled ? 4 : 3, custom_id: `toggle_msg_${msgId}`, label: msg.enabled ? `Desativar` : 'Ativar', emoji: msg.enabled ? { id: '1384035178749497445' } : { id: `1384035206402408518` } },
                { type: 2, style: 2, custom_id: `edit_msg_${msgId}`, label: `Editar`, emoji: { id: `1384035217550868493` } },
                { type: 2, style: 2, custom_id: `preview_msg_${msgId}`, label: `Preview`, emoji: { id: `1459058080766759070` } }
            ]
        },
        {
            type: 1,
            components: [
                { type: 2, style: 1, custom_id: `add_btn_msg_${msgId}`, label: `Adicionar Botão`, emoji: { id: `1387981753133826068` }, disabled: btnCount >= 5 },
                { type: 2, style: 4, custom_id: `rem_btn_msg_${msgId}`, label: `Excluir Botão`, emoji: { id: `1384035185217110077` }, disabled: btnCount === 0 }
            ]
        }
    ).with({ components: [row], flags: [64] });

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(containerContent);
    } else {
        await interaction.update(containerContent);
    }
}

async function painelDeletar(interaction) {
    const msgData = loadMsgData();

    if (msgData.length === 0) {
        return interaction.update(res.main(
            { type: 10, content: `-# Painel > Mensagens Automáticas > Deletar` },
            { type: 14 },
            { type: 10, content: `${Emojis.get(`negative`)} Nenhuma mensagem automática configurada.` }
        ).with({ flags: [64] }));
    }

    const options = msgData.map(m => ({
        label: `Mensagem #${m.id}`,
        description: m.message.slice(0, 50) + (m.message.length > 50 ? '...' : ''),
        value: m.id.toString(),
        emoji: { id: '1387981754081476669' }
    }));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('voltar_msg_auto')
            .setLabel('Voltar')
            .setEmoji('1384035199192666243')
            .setStyle(ButtonStyle.Secondary)
    );

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Mensagens Automáticas > Deletar` },
        { type: 14 },
        { type: 10, content: `**Deletar Mensagem**\n-# Selecione uma mensagem para remover permanentemente.` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: 'select_deletar_msg',
                placeholder: 'Selecione para deletar',
                options: options
            }]
        }
    ).with({ components: [row], flags: [64] });

    await interaction.update(containerContent);
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {
        try {
            
            if (interaction.isButton()) {
                
                if (interaction.customId === 'configmsgauto') {
                    await painelPrincipal(interaction);
                }

                if (interaction.customId === 'voltar_painel_principal') {
                    const { Painel } = require("../../Functions/Painel");
                    await Painel(interaction);
                    return;
                }
                
                if (interaction.customId === 'criar_msg_auto') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_criar_msg_auto')
                        .setTitle('Criar Mensagem Automática');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('msgContent')
                                .setLabel('Conteúdo da Mensagem')
                                .setStyle(TextInputStyle.Paragraph)
                                .setPlaceholder('Digite a mensagem')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('chatIds')
                                .setLabel('IDs dos Canais (separados por vírgula)')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Ex: 123456789,987654321')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('interval')
                                .setLabel('Intervalo de Repostagem (minutos)')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Ex: 30')
                                .setRequired(true)
                        )
                    );
                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'gerenciar_msg_auto') {
                    await painelGerenciar(interaction);
                }
                
                if (interaction.customId === 'deletar_msg_auto') {
                    await painelDeletar(interaction);
                }
                
                if (interaction.customId === 'voltar_msg_auto') {
                    await painelPrincipal(interaction);
                }
                
                
                if (interaction.customId.startsWith('toggle_msg_')) {
                    const msgId = parseInt(interaction.customId.split('_')[2], 10);
                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === msgId);
                    
                    if (msg) {
                        msg.enabled = !msg.enabled;
                        saveMsgData(msgData);
                        await painelGerenciarMensagem(interaction, msgId); 
                    }
                }
                
                
                if (interaction.customId.startsWith('add_btn_msg_')) {
                    const msgId = interaction.customId.split('_')[3];
                    
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_add_btn_${msgId}`)
                        .setTitle('Adicionar Botão com Link');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('btnLabel')
                                .setLabel('Texto do Botão')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Ex: Acessar Site')
                                .setRequired(true)
                                .setMaxLength(80)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('btnUrl')
                                .setLabel('URL do Link')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('https://exemplo.com')
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('btnEmoji')
                                .setLabel('Emoji do Botão (opcional)')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('🔗 ou deixe vazio')
                                .setRequired(false)
                        )
                    );
                    await interaction.showModal(modal);
                }
                
                
                if (interaction.customId.startsWith('rem_btn_msg_')) {
                    const msgId = parseInt(interaction.customId.split(`_`)[3], 10);
                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === msgId);
                    
                    if (msg && msg.buttons && msg.buttons.length > 0) {
                        msg.buttons.pop();
                        saveMsgData(msgData);
                        await painelGerenciarMensagem(interaction, msgId); 
                    } else {
                        await interaction.reply({ 
                            content: `${Emojis.get(`negative`)} Esta mensagem não possui botões.`, 
                            flags: 64 
                        });
                    }
                }
                
                
                if (interaction.customId.startsWith('edit_msg_')) {
                    const msgId = interaction.customId.split('_')[2];
                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === parseInt(msgId, 10));
                    if (!msg) return;
                    
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_edit_msg_${msgId}`)
                        .setTitle('Editar Mensagem');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('msgContent')
                                .setLabel('Conteúdo da Mensagem')
                                .setStyle(TextInputStyle.Paragraph)
                                .setValue(msg.message)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('interval')
                                .setLabel('Intervalo (minutos)')
                                .setStyle(TextInputStyle.Short)
                                .setValue(msg.interval.toString())
                                .setRequired(true)
                        )
                    );
                    await interaction.showModal(modal);
                }
                
                
                if (interaction.customId.startsWith('preview_msg_')) {
                    const msgId = parseInt(interaction.customId.split('_')[2], 10);
                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === msgId);
                    
                    if (msg) {
                        const components = [];
                        if (msg.buttons && msg.buttons.length > 0) {
                            const row = new ActionRowBuilder();
                            for (const btn of msg.buttons.slice(0, 5)) {
                                const button = new ButtonBuilder()
                                    .setLabel(btn.label)
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(btn.url);
                                if (btn.emoji) button.setEmoji(btn.emoji);
                                row.addComponents(button);
                            }
                            components.push(row);
                        } else {
                            
                            components.push(new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('msg_auto_disabled')
                                    .setLabel('Mensagem Automática')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            ));
                        }
                        
                        await interaction.reply({
                            content: msg.message,
                            components: components,
                            flags: 64
                        });
                    }
                }
            }

            
            if (interaction.isStringSelectMenu()) {
                
                if (interaction.customId === 'select_gerenciar_msg') {
                    const msgId = parseInt(interaction.values[0], 10);
                    await painelGerenciarMensagem(interaction, msgId);
                }
                
                
                if (interaction.customId === 'select_deletar_msg') {
                    const msgId = parseInt(interaction.values[0], 10);
                    let msgData = loadMsgData();
                    msgData = msgData.filter(m => m.id !== msgId);
                    saveMsgData(msgData);
                    await painelPrincipal(interaction); 
                }
            }

            
            if (interaction.isModalSubmit()) {
                
                
                if (interaction.customId === 'modal_criar_msg_auto') {
                    const message = interaction.fields.getTextInputValue('msgContent');
                    const chatIds = interaction.fields.getTextInputValue('chatIds').split(',').map(id => id.trim());
                    const interval = parseInt(interaction.fields.getTextInputValue(`interval`), 10);

                    if (isNaN(interval) || interval < 1) {
                        return interaction.reply({ 
                            content: `${Emojis.get(`negative`)} O intervalo deve ser um número válido maior que 0.`, 
                            flags: 64 
                        });
                    }

                    let msgData = loadMsgData();
                    const newId = msgData.length > 0 ? Math.max(...msgData.map(d => d.id)) + 1 : 1;

                    msgData.push({
                        id: newId,
                        message,
                        chatIds,
                        interval,
                        enabled: true,
                        lastPost: null,
                        buttons: []
                    });

                    saveMsgData(msgData);
                    await interaction.deferUpdate();
                    await painelPrincipal(interaction); 
                }
                
                
                if (interaction.customId.startsWith('modal_add_btn_')) {
                    const msgId = parseInt(interaction.customId.split('_')[3], 10);
                    const label = interaction.fields.getTextInputValue('btnLabel');
                    const url = interaction.fields.getTextInputValue('btnUrl');
                    const emoji = interaction.fields.getTextInputValue('btnEmoji') || null;

                    if (!url.startsWith('http://') && !url.startsWith(`https://`)) {
                        return interaction.reply({ 
                            content: `${Emojis.get(`negative`)} A URL deve começar com http:// ou https://`, 
                            flags: 64 
                        });
                    }

                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === msgId);
                    
                    if (msg) {
                        if (!msg.buttons) msg.buttons = [];
                        if (msg.buttons.length >= 5) {
                            return interaction.reply({ 
                                content: `${Emojis.get(`negative`)} Máximo de 5 botões por mensagem.`, 
                                flags: 64 
                            });
                        }
                        
                        msg.buttons.push({ label, url, emoji });
                        saveMsgData(msgData);
                        await interaction.deferUpdate();
                        await painelGerenciarMensagem(interaction, msgId); 
                    }
                }
                
                
                if (interaction.customId.startsWith('modal_edit_msg_')) {
                    const msgId = parseInt(interaction.customId.split('_')[3], 10);
                    const message = interaction.fields.getTextInputValue('msgContent');
                    const interval = parseInt(interaction.fields.getTextInputValue(`interval`), 10);

                    if (isNaN(interval) || interval < 1) {
                        return interaction.reply({ 
                            content: `${Emojis.get(`negative`)} O intervalo deve ser um número válido maior que 0.`, 
                            flags: 64 
                        });
                    }

                    let msgData = loadMsgData();
                    const msg = msgData.find(m => m.id === msgId);
                    
                    if (msg) {
                        msg.message = message;
                        msg.interval = interval;
                        saveMsgData(msgData);
                        await interaction.deferUpdate();
                        await painelGerenciarMensagem(interaction, msgId); 
                    }
                }
            }
        } catch (error) {
            console.error('[MensagemConfig] Erro:', error);
        }
    },
    painelPrincipal
};