const { 
    ChannelType, ActionRowBuilder, ChannelSelectMenuBuilder, 
    ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, 
    TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder 
} = require("discord.js");
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const { Emojis, configuracao } = require("../../database/index");


const dbPathAuth = path.join(__dirname, "..", "..", "database", "configauth02api.json");
const configPath = path.join(__dirname, "..", "..", "database", "configuracao.json");
const REDIRECT_URL = "https://auth.ilusionsoluctions.com.br/auth02/verify";

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {
        
        
        if (interaction.isButton() && interaction.customId === 'configurar_venda_membro') {
            try {
                
                if (!fs.existsSync(dbPathAuth)) return interaction.reply({ content: "❌ Configuração do Bot Auth não encontrada.", flags: 64 });
                const authData = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));
                
                
                
                const botIDs = Object.keys(authData);
                const roleId = authData.role_id || (botIDs.length > 0 ? authData[botIDs[0]].role_id : null);

                
                if (!roleId) {
                    return interaction.reply({ 
                        content: `❌ **Ação Negada!** Você precisa configurar o **Cargo de Verificado** no Bot Auth antes de habilitar esta opção.`, 
                        flags: 64 
                    });
                }

                
                let configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

                
                const statusAtual = configData.Verificacaobrigatoria === "true";
                const novoStatus = statusAtual ? "false" : "true";
                configData.Verificacaobrigatoria = novoStatus;

                
                fs.writeFileSync(configPath, JSON.stringify(configData, null, 4));

                
                if (typeof configuracao.set === 'function') {
                    configuracao.set('Verificacaobrigatoria', novoStatus);
                }

                
                const { auth02api } = require(`../../Functions/configurarauth02.js`); 
                await auth02api(interaction);

                
                const mencaoCargo = `<@&${roleId}>`;
                if (novoStatus === "true") {
                    await interaction.followUp({ 
                        content: `${Emojis.get(`checker`) || "✅"} **Verificação obrigatória ativada!** Agora apenas quem for verificado e tiver o cargo ${mencaoCargo} poderá abrir carrinhos e efetuar compras!`, 
                        flags: 64 
                    });
                } else {
                    await interaction.followUp({ 
                        content: `${Emojis.get(`checker`) || "✅"} **Verificação obrigatória desativada!** Abertura de carrinhos e compras agora estão liberadas para todos os usuários.`, 
                        flags: 64 
                    });
                }

            } catch (err) {
                console.error("Erro ao alterar verificação obrigatória:", err);
                return interaction.reply({ content: "❌ Ocorreu um erro ao processar sua solicitação.", flags: 64 });
            }
        }

        
        if (interaction.isButton() && interaction.customId === `mensagem_auth02`) {
            if (!fs.existsSync(dbPathAuth)) {
                return interaction.reply({ 
                    content: `${Emojis.get(`negative`) || "❌"} Configure o Bot Auth02 primeiro!`, 
                    flags: 64 
                });
            }
            
            const selectMenu = new ChannelSelectMenuBuilder()
                .setCustomId('selecionar_canal_auth')
                .setPlaceholder('🔍 Selecione o canal de destino')
                .addChannelTypes(ChannelType.GuildText);

            return interaction.reply({
                content: `Selecione abaixo o canal onde a verificação será enviada:`,
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: 64
            });
        }

        
        
        if (interaction.isChannelSelectMenu() && interaction.customId === `selecionar_canal_auth`) {
            const canalId = interaction.values[0];
            const rowOpcoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`auth_tipo_msg_${canalId}`).setLabel(`Mensagem Simples`).setStyle(ButtonStyle.Primary).setEmoji(`${Emojis.get(`_lapis_emoji`) || "📝"}`),
                new ButtonBuilder().setCustomId(`auth_tipo_embed_${canalId}`).setLabel(`Embed Customizada`).setStyle(ButtonStyle.Secondary).setEmoji(`${Emojis.get(`_lapis_emoji`) || "🖼️"}`)
            );
            return interaction.update({ content: `${Emojis.get(`information_emoji`) || "ℹ️"} Canal <#${canalId}> selecionado\nAgora, como você deseja enviar o anúncio?`, components: [rowOpcoes] });
        }

        if (interaction.isButton() && interaction.customId.startsWith('auth_tipo_')) {
            const [, , tipo, canalId] = interaction.customId.split('_');
            if (tipo === `msg`) {
                const modal = new ModalBuilder().setCustomId(`modal_auth_msg_${canalId}`).setTitle(`Configurar Mensagem Simples`).addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texto_input').setLabel('TEXTO DA MENSAGEM').setStyle(TextInputStyle.Paragraph).setPlaceholder('Ex: Clique no botão abaixo para se verificar...').setRequired(true)));
                return interaction.showModal(modal);
            } 
            if (tipo === `embed`) {
                const modal = new ModalBuilder().setCustomId(`modal_auth_embed_${canalId}`).setTitle(`Configurar Embed de Verificação`).addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('TÍTULO').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('DESCRIÇÃO').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('COR (HEX)').setPlaceholder('#00FF00').setStyle(TextInputStyle.Short).setRequired(false)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL DA IMAGEM').setStyle(TextInputStyle.Short).setRequired(false))
                );
                return interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('modal_auth_')) {
            await interaction.deferReply({ flags: 64 });
            const [, , tipo, canalId] = interaction.customId.split('_');
            const configAuthRaw = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));
            const botIds = Object.keys(configAuthRaw);
            const configAuth = configAuthRaw.bot_id ? configAuthRaw : configAuthRaw[botIds[0]];
            const canalDestino = interaction.guild.channels.cache.get(canalId);
            if (!canalDestino) return interaction.editReply({ content: "❌ Canal não encontrado ou bot sem permissão." });
            const linkFinal = `https://discord.com/api/oauth2/authorize?client_id=${configAuth.bot_id}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&response_type=code&scope=identify%20guilds.join&state=${configAuth.bot_id}`;
            const rowBotao = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Verificar-se').setStyle(ButtonStyle.Link).setURL(linkFinal));
            try {
                if (tipo === 'msg') {
                    const texto = interaction.fields.getTextInputValue('texto_input');
                    await canalDestino.send({ content: texto, components: [rowBotao] });
                } else {
                    const embed = new EmbedBuilder().setTitle(interaction.fields.getTextInputValue('title')).setDescription(interaction.fields.getTextInputValue('desc')).setColor(interaction.fields.getTextInputValue('color') || '#2b2d31');
                    const img = interaction.fields.getTextInputValue('image');
                    if (img && img.startsWith(`http`)) embed.setImage(img);
                    await canalDestino.send({ embeds: [embed], components: [rowBotao] });
                }
                return interaction.editReply({ content: `${Emojis.get(`checker`) || "✅"} Anúncio de verificação enviado com sucesso em <#${canalId}>!` });
            } catch (err) { console.error(err); return interaction.editReply({ content: "❌ Ocorreu um erro ao enviar a mensagem no canal destino." }); }
        }
    }
};