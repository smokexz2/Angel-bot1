const Discord = require("discord.js");
const axios = require("axios");
const { configuracao, Emojis } = require("../../database/index");
const { misticConfigs } = require("../../Functions/misticpayconfig.js"); 
const { 
  ModalBuilder, 
  TextInputBuilder, 
  ActionRowBuilder, 
  InteractionType 
} = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {

        
        if (interaction.type === InteractionType.ModalSubmit) {
            
            
            if (interaction.customId === 'modal_set_mistic_creds') {
                const clientId = interaction.fields.getTextInputValue('mistic_id_input');
                const clientSecret = interaction.fields.getTextInputValue('mistic_secret_input');

                configuracao.set('pagamentos.mistclientid', clientId);
                configuracao.set(`pagamentos.misticsecret`, clientSecret);
                
                return interaction.reply({
                    content: `${Emojis.get(`checker`)} | Credenciais da **Mistic Pay** configuradas com sucesso!`,
                    flags: 64
                });
            }

            
            if (interaction.customId === 'modal_mistic_withdraw') {
                await interaction.deferReply({ flags: 64 });

                const amount = Number(interaction.fields.getTextInputValue('withdraw_amount'));
                const pixKey = interaction.fields.getTextInputValue('withdraw_key');
                const pixType = interaction.fields.getTextInputValue('withdraw_type').toUpperCase();

                const clientId = configuracao.get('pagamentos.mistclientid');
                const clientSecret = configuracao.get('pagamentos.misticsecret');

                try {
                    
                    const response = await axios.post('https://api.misticpay.com/api/transactions/withdraw', {
                        amount: amount,
                        pixKey: pixKey,
                        pixKeyType: pixType,
                        description: `Saque via Discord | Solicitado por ${interaction.user.tag}`
                    }, {
                        headers: {
                            'ci': clientId,
                            'cs': clientSecret,
                            'Content-Type': `application/json`
                        }
                    });

                    if (response.data) {
                        await interaction.editReply({
                            content: `${Emojis.get(`checker`)} | Saque de **R$ ${amount.toFixed(2)}** solicitado com sucesso!`
                        });

                        
                        const logContent = 
                            `# 💸 Saque Realizado com Sucesso - Mistic Pay\n\n` +
                            `> - **Valor:** R$ ${amount.toFixed(2)}\n` +
                            `> - **Chave Pix:** \`${pixKey}\`\n` +
                            `> - **Data:** <t:${Math.floor(Date.now() / 1000)}:f>\n` +
                            `> - **Status:** ✅ Valor Sacado com sucesso!!`;

                        await interaction.user.send({ content: logContent }).catch(() => {
                            console.log(`[MISTIC] DM fechada para ${interaction.user.tag}`);
                        });
                    }

                } catch (error) {
                    const errorMsg = error.response?.data?.message || error.message;
                    console.error("[MISTIC WITHDRAW ERROR]:", errorMsg);
                    return interaction.editReply({
                        content: `${Emojis.get(`negative`)} | Falha ao solicitar saque: \`${errorMsg}\``
                    });
                }
            }
        }

        
        if (interaction.isButton()) {

            
            if (interaction.customId === 'setMisticCreds') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_set_mistic_creds')
                    .setTitle('Configurar Mistic Pay')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('mistic_id_input')
                                .setLabel('CLIENT ID')
                                .setPlaceholder('ci_...')
                                .setStyle(1)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('mistic_secret_input')
                                .setLabel('CLIENT SECRET')
                                .setPlaceholder('cs_...')
                                .setStyle(1)
                                .setRequired(true)
                        )
                    );
                return interaction.showModal(modal);
            }

            
            if (interaction.customId === 'requestMisticWithdraw') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_mistic_withdraw')
                    .setTitle('Solicitar Saque - Mistic Pay')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('withdraw_amount')
                                .setLabel('VALOR (Ex: 100.50)')
                                .setPlaceholder('Quanto deseja sacar?')
                                .setStyle(1)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('withdraw_key')
                                .setLabel('CHAVE PIX')
                                .setPlaceholder('Sua chave Pix sem formatação')
                                .setStyle(1)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('withdraw_type')
                                .setLabel('TIPO DE CHAVE')
                                .setPlaceholder('CPF, EMAIL, PHONE, CHAVE_ALEATORIA')
                                .setStyle(1)
                                .setRequired(true)
                        )
                    );
                return interaction.showModal(modal);
            }

            
            if (interaction.customId === 'toggleMisticStatus') {
                const statusAtual = configuracao.get('pagamentos.MisticSystem') ?? false;
                configuracao.set('pagamentos.MisticSystem', !statusAtual);
                return misticConfigs(interaction);
            }

            
            if (interaction.customId === 'formasdepagamentos') {
                const { formasPagamento } = require("../../Functions/Pagamentos"); 
                return formasPagamento(interaction);
            }
        }
    }
};