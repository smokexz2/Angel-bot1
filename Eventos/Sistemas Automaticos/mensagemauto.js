const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const automaticosPath = path.resolve(__dirname, '../../database/msgauto.json');

module.exports = {
    name: "ready",
    run: async (client) => {
        let msgData = [];
        let lastMessageIds = new Map();

        const loadMsgData = () => {
            if (fs.existsSync(automaticosPath)) {
                try {
                    msgData = JSON.parse(fs.readFileSync(automaticosPath));
                } catch (error) {
                    msgData = [];
                }
            }
        };

        const saveMsgData = (data) => {
            fs.writeFileSync(automaticosPath, JSON.stringify(data, null, 2));
        };

        const getBrasiliaTime = () => {
            return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        };

        const checkAndSendMessages = async () => {
            const now = getBrasiliaTime();
            let hasChanges = false;

            for (const data of msgData) {
                if (!data.enabled) continue;

                const lastPost = data.lastPost ? new Date(data.lastPost) : null;
                const intervalMs = data.interval * 60 * 1000;

                let shouldPost = false;

                if (!lastPost) {
                    shouldPost = true;
                } else {
                    const timeSinceLastPost = now.getTime() - lastPost.getTime();
                    if (timeSinceLastPost >= intervalMs) {
                        shouldPost = true;
                    }
                }

                if (shouldPost) {
                    for (const chatId of data.chatIds) {
                        try {
                            const channel = client.channels.cache.get(chatId);
                            if (channel) {
                                
                                const lastMsgKey = `${data.id}_${chatId}`;
                                const lastMsgId = lastMessageIds.get(lastMsgKey);
                                
                                if (lastMsgId) {
                                    try {
                                        const oldMsg = await channel.messages.fetch(lastMsgId);
                                        if (oldMsg) await oldMsg.delete();
                                    } catch (e) {}
                                }

                                
                                const components = [];
                                
                                if (data.buttons && data.buttons.length > 0) {
                                    const row = new ActionRowBuilder();
                                    for (const btn of data.buttons.slice(0, 5)) {
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

                                const newMsg = await channel.send({
                                    content: data.message,
                                    components: components
                                });

                                lastMessageIds.set(lastMsgKey, newMsg.id);
                                console.log(`[MensagemAuto] Mensagem #${data.id} enviada para ${channel.name}`);
                            }
                        } catch (error) {
                            console.error(`[MensagemAuto] Erro ao enviar para ${chatId}:`, error.message);
                        }
                    }

                    data.lastPost = now.toISOString();
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                saveMsgData(msgData);
            }
        };

        loadMsgData();

        const startInterval = () => {
            const now = new Date();
            const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

            setTimeout(() => {
                checkAndSendMessages();
                setInterval(checkAndSendMessages, 60 * 1000);
            }, msUntilNextMinute);
        };

        startInterval();
        console.log('[MensagemAuto] Sistema iniciado (Horário de Brasília)');

        chokidar.watch(automaticosPath).on('change', () => {
            console.log('[MensagemAuto] Configurações recarregadas');
            loadMsgData();
        });
    }
};