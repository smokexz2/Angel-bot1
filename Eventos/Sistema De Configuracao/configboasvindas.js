const { InteractionType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { configuracao } = require("../../database");
const { msgbemvindo } = require("../../Functions/MensagemBemVindo");

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        if (interaction.isButton()) {
            
            if (interaction.customId === 'bv_adicionar_canal') {
                const modal = new ModalBuilder()
                    .setCustomId('bv_modal_add_canal')
                    .setTitle('Adicionar Canal de Boas Vindas');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('canal_id')
                            .setLabel('ID do Canal')
                            .setPlaceholder('Cole o ID do canal onde a mensagem será enviada')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('mensagem')
                            .setLabel('Mensagem de Boas Vindas')
                            .setPlaceholder(`Ex: Bem-vindo(a) {member} ao {guildname}! ${Emojis.get('giveaway')||''}`)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(1000)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('tempo')
                            .setLabel('Tempo para apagar em segundos (0 = nunca)')
                            .setPlaceholder('Ex: 30 para apagar após 30s, ou 0 para não apagar')
                            .setValue('0')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(6)
                    )
                );

                return interaction.showModal(modal);
            }

            
            if (interaction.customId === `bv_remover_canal`) {
                const canaisConfig = configuracao.get("Entradas.canaisConfig") || [];

                if (canaisConfig.length === 0) {
                    return interaction.reply({ content: `${Emojis.get(`negative`)||''} | Nenhum canal configurado para remover.`, flags: 64 });
                }

                const modal = new ModalBuilder()
                    .setCustomId('bv_modal_remove_canal')
                    .setTitle('Remover Canal de Boas Vindas');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('canal_id')
                            .setLabel('ID do Canal para remover')
                            .setPlaceholder('Cole o ID do canal que deseja remover')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

                return interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            
            if (interaction.customId === 'bv_modal_add_canal') {
                const canalId = interaction.fields.getTextInputValue('canal_id').trim();
                const mensagem = interaction.fields.getTextInputValue('mensagem').trim();
                const tempoStr = interaction.fields.getTextInputValue(`tempo`).trim();
                const tempo = Math.max(0, parseInt(tempoStr) || 0);

                const canal = interaction.guild.channels.cache.get(canalId);
                if (!canal) {
                    return interaction.reply({
                        content: `${Emojis.get(`negative`)||``} | Canal não encontrado com o ID \`${canalId}\`. Verifique o ID e tente novamente.`,
                        flags: 64
                    });
                }

                let canaisConfig = configuracao.get("Entradas.canaisConfig") || [];
                canaisConfig = canaisConfig.filter(c => c.id !== canalId);
                canaisConfig.push({ id: canalId, msg: mensagem, tempo });
                configuracao.set("Entradas.canaisConfig", canaisConfig);

                return interaction.reply({
                    content: `${Emojis.get('checker')||''} | Canal <#${canalId}> adicionado com sucesso!\n> Mensagem configurada. Exclusão: ${tempo > 0 ? `\`${tempo}s\`` : 'nunca'}\n-# Reabra o painel de Boas Vindas para ver as alterações.`,
                    flags: 64
                });
            }

            if (interaction.customId === 'bv_modal_remove_canal') {
                const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();

                let canaisConfig = configuracao.get("Entradas.canaisConfig") || [];
                const antes = canaisConfig.length;
                canaisConfig = canaisConfig.filter(c => c.id !== canalId);
                configuracao.set("Entradas.canaisConfig", canaisConfig);

                if (canaisConfig.length === antes) {
                    return interaction.reply({
                        content: `${Emojis.get(`warn_emoji`)||``} | Canal \`${canalId}\` não estava na lista configurada.`,
                        flags: 64
                    });
                }

                return interaction.reply({
                    content: `${Emojis.get(`checker`)||''} | Canal removido com sucesso!\n-# Reabra o painel de Boas Vindas para ver as alterações.`,
                    flags: 64
                });
            }
        }
    }
};