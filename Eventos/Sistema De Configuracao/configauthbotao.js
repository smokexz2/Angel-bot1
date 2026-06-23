const { InteractionType, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const axios = require("axios");
const fs = require('fs');
const path = require('path');


const { Emojis } = require("../../database/index");
const { auth02api } = require("../../Functions/configurarauth02.js");


const API_URL = "https://ilusioncloud.camposcloud.app"; 
const AUTH_TOKEN = "galaodamassa581";
const dbPathAuth = path.join(__dirname, "..", "..", "database", "configauth02api.json");

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {

        
        if (interaction.isButton()) {
            
            
            if (interaction.customId === 'setAuth02Keys') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_set_auth02_keys')
                    .setTitle('🔑 Configurar Auth02 Enterprise');

                const inputToken = new TextInputBuilder()
                    .setCustomId('auth_token_input')
                    .setLabel('TOKEN DO BOT')
                    .setPlaceholder('Insira o token do bot de retenção')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const inputSecret = new TextInputBuilder()
                    .setCustomId('auth_secret_input')
                    .setLabel('CLIENT SECRET')
                    .setPlaceholder('Insira o Client Secret da aplicação')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(inputToken),
                    new ActionRowBuilder().addComponents(inputSecret)
                );

                return await interaction.showModal(modal);
            }

            
            if (interaction.customId === 'logauth') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_webhook_logs')
                    .setTitle('🛰️ Configurações de Verificação');

                const inputWeb = new TextInputBuilder()
                    .setCustomId('webhook_url_input')
                    .setLabel('URL DA WEBHOOK DE LOGS')
                    .setPlaceholder('https://discord.com/api/webhooks/...')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false); 

                const inputCargo = new TextInputBuilder()
                    .setCustomId('role_id_input')
                    .setLabel('ID DO CARGO DE VERIFICADO')
                    .setPlaceholder('ID do cargo que o usuário ganhará ao se verificar')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false); 

                modal.addComponents(
                    new ActionRowBuilder().addComponents(inputWeb),
                    new ActionRowBuilder().addComponents(inputCargo)
                );
                return await interaction.showModal(modal);
            }
        }

        
        if (interaction.type === InteractionType.ModalSubmit) {

            
            if (interaction.customId === 'modal_set_auth02_keys') {
                await interaction.deferReply({ flags: 64 });

                const token = interaction.fields.getTextInputValue('auth_token_input').trim();
                const secret = interaction.fields.getTextInputValue('auth_secret_input').trim();

                try {
                    const response = await axios.post(`${API_URL}/api/auth02/configurar`, {
                        user_id: interaction.user.id,
                        client_secret: secret,
                        token: token
                    }, {
                        headers: { 'Authorization': AUTH_TOKEN },
                        timeout: 15000
                    });

                    if (response.data.sucesso) {
                        const dadosBot = { 
                            bot_id: response.data.bot_id, 
                            token: token, 
                            secret: secret,
                            data_config: new Date().toISOString() 
                        };

                        fs.writeFileSync(dbPathAuth, JSON.stringify(dadosBot, null, 4));

                        await interaction.editReply({ 
                            content: `${Emojis.get(`checker`) || '✅'} | **Bot Auth02 configurado e sincronizado com o site!**` 
                        });
                        
                        try { await auth02api(interaction); } catch (e) {}
                    }
                } catch (err) {
                    console.error('❌ [ERRO API]:', err.response?.data || err.message);
                    return interaction.editReply({ content: `❌ **Erro:** Não foi possível sincronizar com a API.` });
                }
            }

            
            if (interaction.customId === 'modal_webhook_logs') {
                await interaction.deferReply({ flags: 64 });
                
                const url = interaction.fields.getTextInputValue('webhook_url_input').trim();
                const roleId = interaction.fields.getTextInputValue('role_id_input').trim();

                try {
                    if (!fs.existsSync(dbPathAuth)) return interaction.editReply("❌ Configure o Bot primeiro!");
                    const config = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));

                    
                    await axios.post(`${API_URL}/api/auth02/configurar-geral`, {
                        bot_id: config.bot_id,
                        webhook_url: url || null,
                        role_id: roleId || null,
                        guild_id: interaction.guild.id
                    }, { 
                        headers: { 
                            'Authorization': AUTH_TOKEN,
                            'User-Agent': `DiscordBot/1.0` 
                        } 
                    });

                    
                    config.webhook_logs = url || config.webhook_logs;
                    config.role_id = roleId || config.role_id;
                    fs.writeFileSync(dbPathAuth, JSON.stringify(config, null, 4));

                    return interaction.editReply({ 
                        content: `${Emojis.get(`checker`) || '✅'} | **Configurações de Logs e Cargo sincronizadas com sucesso!**` 
                    });

                } catch (err) {
                    console.error('❌ [ERRO CONFIG GERAL]:', err.message);
                    return interaction.editReply({ content: `❌ Erro ao sincronizar configurações com o servidor da Square Cloud.` });
                }
            }
        }
    }
};