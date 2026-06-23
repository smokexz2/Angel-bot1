const { InteractionType } = require("discord.js");
const { painelGiftCard } = require("../../Functions/GiftCard");
const { painelIA } = require("../../Functions/SistemaIA");
const { painelStockAuto } = require("../../Functions/StockAutoNotify");
const { painelGamepassJogos } = require("../../Functions/GamepassProdutos");
const { painelFeedbackMonitor } = require("../../Functions/FeedbackMonitor");
const { PainelModeracao, ModConfigLogCanal, ModConfigReportCanal, ModConfigCargo, ModToggle, HandleModSelect } = require("../../Functions/ModeracaoPanel");
const { PainelVerificacao, HandleVerifButtons, HandleVerifSelect, HandleVerifModal } = require("../../Functions/VerificacaoSystem");
const { PainelGIFs, HandleGIFsButtons, HandleGIFsSelect, HandleGIFsModal } = require("../../Functions/GIFsSystem");
const { PainelFormulario, HandleFormularioButtons, HandleFormularioSelect, HandleFormularioModal } = require("../../Functions/FormularioSystem");
const { PainelWarnThresholds, ModalAddThreshold, HandleAddThresholdModal, HandleRemoveThreshold, HandleSelectRemoveThreshold } = require("../../Functions/WarnThresholds");

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {
        const cid = interaction.customId;

        
        if (interaction.isButton()) {
            
            if (cid === 'painelgiftcard') return painelGiftCard(interaction);
            if (cid === 'painelistema') return painelIA(interaction);
            if (cid === 'painelstockauto') return painelStockAuto(interaction);
            if (cid === 'painelgamepassjogos') return painelGamepassJogos(interaction);
            if (cid === 'painel_feedback_monitor') return painelFeedbackMonitor(interaction);

            
            if (cid === 'painelmoderation' || cid === 'sistemamoderacao') return PainelModeracao(interaction, client);
            if (cid === 'mod_config_logcanal') return ModConfigLogCanal(interaction);
            if (cid === 'mod_config_reportcanal') return ModConfigReportCanal(interaction);
            if (cid === 'mod_config_cargo') return ModConfigCargo(interaction);
            if (cid === 'mod_toggle') return ModToggle(interaction, client);
            if (cid === 'mod_voltar_painel') return PainelModeracao(interaction, client);

            
            if (cid === 'mod_warn_thresholds') return PainelWarnThresholds(interaction, client);
            if (cid === 'warnth_add') return ModalAddThreshold(interaction);
            if (cid === 'warnth_remove') return HandleRemoveThreshold(interaction, client);
            if (cid === 'warnth_cancelremove') return PainelWarnThresholds(interaction, client);

            
            if (cid === 'painelverificacao') return PainelVerificacao(interaction, client);
            if (cid.startsWith('verif_')) return HandleVerifButtons(interaction, client);

            
            if (cid === 'painelgifs') return PainelGIFs(interaction, client);
            if (cid.startsWith('gifs_')) return HandleGIFsButtons(interaction, client);

            
            if (cid === 'painelformulario') return PainelFormulario(interaction, client);
            if (cid === 'formulario_iniciar') return HandleFormularioButtons(interaction, client);
            if (cid.startsWith('form_')) return HandleFormularioButtons(interaction, client);
        }

        
        if (interaction.isAnySelectMenu() && cid && cid.startsWith('panel_select_')) {
            const selected = interaction.values[0];
            if (selected === 'painelgiftcard') return painelGiftCard(interaction);
            if (selected === 'painelistema') return painelIA(interaction);
            if (selected === 'painelstockauto') return painelStockAuto(interaction);
            if (selected === 'painel_feedback_monitor') return painelFeedbackMonitor(interaction);
            if (selected === 'painelverificacao') return PainelVerificacao(interaction, client);
            if (selected === 'painelgifs') return PainelGIFs(interaction, client);
            if (selected === 'painelformulario') return PainelFormulario(interaction, client);
        }

        if (interaction.isAnySelectMenu()) {
            
            if (['mod_select_logcanal', 'mod_select_reportcanal', 'mod_select_cargo'].includes(cid)) {
                return HandleModSelect(interaction, client);
            }
            
            if (cid === 'warnth_select_remove') return HandleSelectRemoveThreshold(interaction, client);
            
            if (cid.startsWith('verif_select_')) return HandleVerifSelect(interaction, client);
            
            if (cid.startsWith('gifs_select_')) return HandleGIFsSelect(interaction, client);
            
            if (cid.startsWith('form_select_')) return HandleFormularioSelect(interaction, client);
        }

        
        if (interaction.isModalSubmit()) {
            
            if (cid === 'warnth_modal_add') return HandleAddThresholdModal(interaction, client);
            
            if (cid === 'verif_modal_imagem') return HandleVerifModal(interaction, client);
            
            if (cid === 'gifs_modal_intervalo') return HandleGIFsModal(interaction, client);
            
            if (cid === 'form_modal_addpergunta' || cid.startsWith('formulario_resposta_')) return HandleFormularioModal(interaction, client);
        }
    }
};