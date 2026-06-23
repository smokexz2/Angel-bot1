const { InteractionType } = require("discord.js");
const {
    painelStockAuto,
    modalConfigCanal,
    modalEditarMensagem,
    modalConfigFormato,
    modalConfigBotao,
    modalConfigImagem,
    handleModalCanal,
    handleModalMensagem,
    handleModalFormato,
    handleModalBotao,
    handleModalImagem,
    testarNotificacao,
    stockAutoConfig
} = require("../../Functions/StockAutoNotify");
const emojisDb = require("../../database/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.type === InteractionType.ModalSubmit) {

            if (interaction.customId === 'stock_auto_modal_canal') {
                return handleModalCanal(interaction);
            }

            if (interaction.customId === 'stock_auto_modal_mensagem') {
                return handleModalMensagem(interaction);
            }

            if (interaction.customId === 'stock_auto_modal_formato') {
                return handleModalFormato(interaction);
            }

            if (interaction.customId === 'stock_auto_modal_botao') {
                return handleModalBotao(interaction);
            }

            if (interaction.customId === 'stock_auto_modal_imagem') {
                return handleModalImagem(interaction);
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'stock_auto_status_select') {
                const value = interaction.values[0];
                if (value === 'ativar_stock_auto') {
                    const temCanal = !!stockAutoConfig.get(`config.canal`);
                    if (!temCanal) {
                        return interaction.reply({ content: `${Emojis.get(`negative`) || '❌'} | Configure o canal antes de ativar!`, flags: 64 });
                    }
                    stockAutoConfig.set(`config.status`, true);
                    await painelStockAuto(interaction);
                    return interaction.followUp({ content: `${Emojis.get(`checker`) || '✅'} | Sistema de notificação de stock ativado!`, flags: 64 });
                } else {
                    stockAutoConfig.set(`config.status`, false);
                    await painelStockAuto(interaction);
                    return interaction.followUp({ content: `${Emojis.get(`checker`) || '✅'} | Sistema desativado!`, flags: 64 });
                }
            }
        }

        if (interaction.isButton()) {

            if (interaction.customId === 'stock_auto_config_canal') {
                return modalConfigCanal(interaction);
            }

            if (interaction.customId === 'stock_auto_config_mensagem') {
                return modalEditarMensagem(interaction);
            }

            if (interaction.customId === 'stock_auto_config_formato') {
                return modalConfigFormato(interaction);
            }

            if (interaction.customId === 'stock_auto_config_botao') {
                return modalConfigBotao(interaction);
            }

            if (interaction.customId === 'stock_auto_config_imagem') {
                return modalConfigImagem(interaction);
            }

            if (interaction.customId === 'stock_auto_testar') {
                return testarNotificacao(interaction, client);
            }
        }
    }
};