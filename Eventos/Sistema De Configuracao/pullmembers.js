const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, InteractionType, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const { Emojis } = require("../../database/index");

const API_URL = "https://auth.ilusionsoluctions.com.br/";
const AUTH_TOKEN = "galaodamassa581";
const dbPathAuth = path.join(__dirname, "..", "..", "database", "configauth02api.json");

module.exports = {
    name: 'interactionCreate',

    async run(interaction, client) {
        
        if (interaction.isButton() && interaction.customId === 'recuperarmembroauth') {
            const modal = new ModalBuilder()
                .setCustomId('modal_pull_members')
                .setTitle('🔄 Recuperar Membros');

            const inputGuild = new TextInputBuilder()
                .setCustomId('guild_id_input')
                .setLabel('ID DO SERVIDOR DESTINO')
                .setPlaceholder('Ex: 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputQtd = new TextInputBuilder()
                .setCustomId('qtd_input')
                .setLabel('QUANTIDADE DE MEMBROS')
                .setPlaceholder('Ex: 50')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(inputGuild),
                new ActionRowBuilder().addComponents(inputQtd)
            );

            return await interaction.showModal(modal);
        }

        
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_pull_members') {
            await interaction.deferReply({ flags: 64 });

            const guildId = interaction.fields.getTextInputValue('guild_id_input').trim();
            const quantidade = parseInt(interaction.fields.getTextInputValue(`qtd_input`).trim());

            
            if (isNaN(quantidade) || quantidade <= 0) {
                return interaction.editReply(`${Emojis.get(`negative`)} Informe uma quantidade válida!`);
            }

            try {
                
                if (!fs.existsSync(dbPathAuth)) {
                    return interaction.editReply("❌ Erro: Configuração do Bot Auth02 não encontrada!");
                }
                
                const config = JSON.parse(fs.readFileSync(dbPathAuth, 'utf-8'));

                
                const guildDestino = client.guilds.cache.get(guildId);
                if (!guildDestino) {
                    
                    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.bot_id}&permissions=8&scope=bot%20applications.commands`;
                    const rowInvite = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel(`Adicionar Bot ao Servidor`)
                            .setStyle(ButtonStyle.Link)
                            .setURL(inviteUrl)
                    );
                    return interaction.editReply({
                        content: `${Emojis.get(`negative`)} **Bot não encontrado!**\n> O bot Auth02 precisa estar no servidor destino para realizar a puxada.`,
                        components: [rowInvite]
                    });
                }

                
                const infoRes = await axios.get(`${API_URL}/api/auth02/info/${config.bot_id}`, {
                    headers: { 'Authorization': AUTH_TOKEN }
                });

                const membrosDisponiveis = infoRes.data.membros || 0;

                if (quantidade > membrosDisponiveis) {
                    return interaction.editReply(`${Emojis.get(`negative`)} Você tentou puxar \`${quantidade}\` membros, mas seu bot possui apenas \`${membrosDisponiveis}\` verificados na database.`);
                }

                
                await interaction.editReply(`${Emojis.get(`loading`)} **Iniciando puxada...** Isso pode levar alguns minutos.`);

                const pullRes = await axios.post(`${API_URL}/api/auth02/pull`, {
                    bot_id: String(config.bot_id).trim(), 
                    guild_id: String(guildId).trim(),
                    quantidade: quantidade
                }, {
                    headers: { 'Authorization': AUTH_TOKEN }
                });

                if (pullRes.data.sucesso) {
                    const d = pullRes.data.detalhes;
                    
                    const embedSucesso = new EmbedBuilder()
                        .setTitle(`✅ Puxada Finalizada`)
                        .setColor("#2b2d31")
                        .setDescription("O processo de recuperação de membros foi concluído com sucesso.Abaixo estão os detalhes da operação realizada no servidor.")
                        .addFields(
                            { name: 'Membros Puxados', value: `\`${d.solicitados}\``, inline: true },
                            { name: 'Puxados com sucesso!', value: `\`${d.adicionados}\``, inline: true },
                            { name: 'Erro na puxada', value: `\`${d.falhas}\``, inline: true }
                        )
                        .setFooter({ text: `Migração para: ${guildDestino.name}` })
                        .setTimestamp();

                    return interaction.editReply({ content: "", embeds: [embedSucesso] });
                } else {
                    return interaction.editReply(`❌ **Erro na API:** ${pullRes.data.message || "Falha desconhecida"}`);
                }

            } catch (err) {
                console.error("Erro no Interaction Pull:", err.response?.data || err.message);
                
                
                const apiMessage = err.response?.data?.message || err.message;
                return interaction.editReply(`❌ **Falha no Pull:** \`${apiMessage}\``);
            }
        }
    }
};