const Discord = require("discord.js");
const { configuracao, Emojis } = require("../../database/index");
const { imapConfigs } = require("../../Functions/configinter.js"); 
const { 
  ModalBuilder, 
  TextInputBuilder, 
  ActionRowBuilder, 
  InteractionType,
  TextInputStyle 
} = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {

        
        if (interaction.type === InteractionType.ModalSubmit) {

            if (interaction.customId === 'modal_set_imap_completo') {
                const user = interaction.fields.getTextInputValue('imap_user');
                const pass = interaction.fields.getTextInputValue('imap_pass');
                const bancoDigitado = interaction.fields.getTextInputValue('imap_banco').toLowerCase().trim();
                const chavePix = interaction.fields.getTextInputValue('imap_chavepix'); 

                
                const bancosValidos = ['nubank', 'inter', `picpay`];
                
                if (!bancosValidos.includes(bancoDigitado)) {
                    return interaction.reply({
                        content: `${Emojis.get(`negative`) || "❌"} | **Erro:** Banco \`${bancoDigitado}\` inválido. Use: \`nubank\`, \`inter\` ou \`picpay\`.`,
                        flags: [64]
                    });
                }

                
                let hostAutomatico = "imap.gmail.com"; 
                if (user.includes("@outlook") || user.includes("@hotmail")) hostAutomatico = "outlook.office365.com";

                
                configuracao.set('pagamentos.imap.user', user);
                configuracao.set('pagamentos.imap.password', pass);
                configuracao.set('pagamentos.imap.banco_atual', bancoDigitado);
                configuracao.set('pagamentos.imap.host', hostAutomatico);
                configuracao.set('pagamentos.imap.chavepiximap', chavePix); 

                
                return imapConfigs(interaction); 
            }
        }

        
        if (interaction.isButton()) {

            if (interaction.customId === 'setImapCreds') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_set_imap_completo')
                    .setTitle('Configurar Sistema IMAP')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('imap_user')
                                .setLabel('SEU E-MAIL (LOGADO NO BANCO)')
                                .setPlaceholder('exemplo@gmail.com')
                                .setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('imap_pass')
                                .setLabel('SENHA DE APLICATIVO')
                                .setPlaceholder('Código de 16 dígitos do Google/Outlook')
                                .setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('imap_banco')
                                .setLabel('QUAL O BANCO?')
                                .setPlaceholder('nubank, inter ou picpay')
                                .setStyle(TextInputStyle.Short).setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('imap_chavepix')
                                .setLabel('SUA CHAVE PIX')
                                .setPlaceholder('E-mail, CPF, Celular ou Aleatória')
                                .setStyle(TextInputStyle.Short).setRequired(true)
                        )
                    );
                return interaction.showModal(modal);
            }

            
            if (interaction.customId === 'toggleImapStatus') {
                const statusAtual = configuracao.get('pagamentos.imap.status') ?? false;
                configuracao.set('pagamentos.imap.status', !statusAtual);
                return imapConfigs(interaction);
            }

            
            if (interaction.customId === 'formasdepagamentos') {
                const { formasPagamento } = require("../../Functions/Pagamentos"); 
                return formasPagamento(interaction);
            }
        }
    }
};