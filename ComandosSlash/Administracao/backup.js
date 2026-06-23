const { PermissionFlagsBits, ApplicationCommandType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { pedidos, pagamentos, carrinhos, configuracao, produtos, Temporario, BackupStorage } = require("../../database");
const emojis = require("../../database/emojis.json");
const config = require("../../config.json"); 

const Emojis = {
    get: (name) => emojis[name] || ""
};

module.exports = {
    name: "backup",
    description: "[💾 | Backup] Configure o sistema de proteçao do servidor",
    type: ApplicationCommandType.ChatInput,
    default_member_permissions: PermissionFlagsBits.Administrator,

    run: async (client, interaction) => {
        
        await interaction.reply({ content: `${Emojis.get("loading")} Aguarde...`, flags: 64 });

        
        setTimeout(async () => {
            if (interaction.user.id !== config.owner) {
                return interaction.editReply({ 
                    content: `${Emojis.get("negative")} Faltam Permissoes.\n${Emojis.get("question_emoji")} Apenas o Titular da compra (<@${config.owner}>) pode alterar as configurações de proteção do servidor.`, 
                    flags: 64 
                });
            }

            
            BackupFunction(client, interaction);
        }, 500);
    }
};

async function BackupFunction(client, interaction) {
    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('restaurarservidor')
            .setLabel('Restaurar servidor')
            .setEmoji(Emojis.get("_transfer_emoji") || '🔄')
            .setDisabled(BackupStorage.fetchAll()?.length > 0 ? false : true)
            .setStyle(3),
        new ButtonBuilder()
            .setCustomId('salvartemplate')
            .setLabel('Salvar template')
            .setEmoji(Emojis.get("_mail_emoji") || '📧')
            .setStyle(2),
    );

    const botao2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sincronizardados')
            .setLabel('Sincronizar')
            .setEmoji(Emojis.get("_change_emoji") || '🔁')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('apagarbackup')
            .setLabel('Apagar Backup')
            .setEmoji(Emojis.get("_trash_emoji") || '🗑️')
            .setDisabled(BackupStorage.fetchAll()?.length > 0 ? false : true)
            .setStyle(4),
    );

    await interaction.editReply({ content: "", components: [botao, botao2], flags: 64 });
}