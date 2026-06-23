const Discord = require("discord.js");
const { configuracao, Emojis, tickets } = require("../../database/index");
const { TestarQRCode } = require("../../Functions/QRCode");
const { painelTicket } = require("../../Functions/PainelTickets.js");
const {
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    InteractionType,
    TextInputStyle
} = require("discord.js");

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {

        
        if (interaction.type === InteractionType.ModalSubmit) {

            
            if (interaction.customId === 'modal_definir_content') {
                
                await interaction.deferUpdate().catch(() => {});

                const novoTexto = interaction.fields.getTextInputValue('texto_content');
                let novaImagem = interaction.fields.getTextInputValue('imagem_content');

                
                if (novaImagem.toLowerCase() === 'remover') {
                    novaImagem = ""; 
                }

                
                tickets.set(`tickets.config.textContent`, novoTexto);
                tickets.set(`tickets.config.imageContent`, novaImagem);

                
                return await painelTicket(interaction);
            }

            
            if (interaction.customId === 'qrcode-colors') {
                const corPrincipal = interaction.fields.getTextInputValue('corprincipal');
                const corLateral = interaction.fields.getTextInputValue('corlateral');
                const tipo = interaction.fields.getTextInputValue('tipo').toLowerCase();
                const corRegex = /^#[0-9A-F]{6}$/i;

                if (!corRegex.test(corPrincipal) || !corRegex.test(corLateral)) {
                    return interaction.reply({
                        content: `${Emojis.get(`warn_emoji`)} Formato de cor inválido. Use hexadecimal como \`#ffffff\`.`,
                        flags: 64
                    });
                }

                if (!['radial', 'linear'].includes(tipo)) {
                    return interaction.reply({
                        content: `${Emojis.get(`warn_emoji`)} Tipo de gradiente inválido. Use \`radial\` ou \`linear\`.`,
                        flags: 64
                    });
                }

                configuracao.set('QRCode.principal', corPrincipal);
                configuracao.set('QRCode.lateral', corLateral);
                configuracao.set('QRCode.gradient', tipo);

                const embeds = [
                    new EmbedBuilder().setColor(corPrincipal).setDescription(`${Emojis.get(`checker`)} Cor **principal** alterada para \`${corPrincipal}\`.`),
                    new EmbedBuilder().setColor(corLateral).setDescription(`${Emojis.get(`checker`)} Cor **lateral** alterada para \`${corLateral}\`.`),
                    new EmbedBuilder().setColor(corPrincipal).setDescription(`${Emojis.get(`checker`)} Tipo de **gradiente** alterado para \`${tipo}\`.`)
                ];
                return interaction.reply({ embeds, flags: 64 });
            }
        }

        
        if (interaction.isButton()) {

            
            if (interaction.customId === 'alternarmodo') {
                const modoAtual = tickets.get(`tickets.config.modoContent`) || false;
                const novoModo = !modoAtual;

                tickets.set(`tickets.config.modoContent`, novoModo);
                return await painelTicket(interaction);
            }

            
            if (interaction.customId === 'definircontent') {
                const textoAtual = tickets.get(`tickets.config.textContent`) || "";
                const imagemAtual = tickets.get(`tickets.config.imageContent`) || "";

                const modal = new ModalBuilder()
                    .setCustomId('modal_definir_content')
                    .setTitle('Configurar Mensagem de Texto')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('texto_content')
                                .setLabel('TEXTO DA MENSAGEM')
                                .setPlaceholder('Escreva o texto do ticket aqui...')
                                .setValue(textoAtual)
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('imagem_content')
                                .setLabel('LINK DA IMAGEM (OU "REMOVER")')
                                .setPlaceholder('https://link-da-sua-imagem.png')
                                .setValue(imagemAtual)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                        )
                    );
                return interaction.showModal(modal);
            }

            
            if (interaction.customId === 'qrcode-colors') {
                const principal = configuracao.get('QRCode.principal') || '#328dbc';
                const lateral = configuracao.get('QRCode.lateral') || '#000203';
                const gradient = configuracao.get('QRCode.gradient') || 'radial';

                const modal = new ModalBuilder()
                    .setTitle('Editando Cores do QRCode')
                    .setCustomId('qrcode-colors')
                    .addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('corprincipal').setLabel('COR PRINCIPAL').setValue(principal).setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('corlateral').setLabel('COR LATERAL').setValue(lateral).setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tipo').setLabel('TIPO DE GRADIENTE').setPlaceholder('radial ou linear').setMaxLength(6).setValue(gradient).setStyle(TextInputStyle.Short).setRequired(true))
                    );
                return interaction.showModal(modal);
            }

            if (interaction.customId === 'qrcode-teste') return TestarQRCode(interaction, client);

            if (interaction.customId === 'qrcode-button') {
                await interaction.reply({ content: `${Emojis.get(`loading`)} Aguarde...`, flags: 64 });
                const tempoLimite = Date.now() + 60 * 1000;
                await interaction.editReply({ content: `${Emojis.get(`warn_emoji`)} Envie a imagem do QRCode (PNG). Expira <t:${Math.ceil(tempoLimite / 1000)}:R>.`, flags: 64 });

                const collector = interaction.channel.createMessageCollector({ filter: (m) => m.author.id === interaction.user.id, time: 120000 });
                collector.on('collect', async (m) => {
                    try {
                        if (m.attachments.size > 0) {
                            const attachment = m.attachments.first();
                            if (attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg')) {
                                const axios = require('axios');
                                const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                                await saveAttachmentToFile(response.data);
                                await interaction.editReply({ content: `${Emojis.get(`checker`)} QRCode atualizado!`, flags: 64 });
                            }
                        }
                        m.delete().catch(() => { });
                        collector.stop();
                    } catch (error) { collector.stop(); }
                });
            }
        }
    }
};


async function saveAttachmentToFile(buffer) {
    const path = require('path');
    const fs = require('fs').promises;
    const dir = path.resolve(__dirname, '..', '..', 'Lib');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'aaaaa.png'), Buffer.from(buffer));
}