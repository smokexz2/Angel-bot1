const { 
    EmbedBuilder, 
    ApplicationCommandType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ChannelType,
    PermissionFlagsBits 
} = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "webhook",
    description: "[👑 | Owner] Cria um webhook e envia a URL na sua DM",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "canal",
            description: "O canal onde o webhook será criado",
            type: 7, 
            channel_types: [ChannelType.GuildText],
            required: true
        },
        {
            name: "nome",
            description: "Nome do Webhook",
            type: 3, 
            required: false
        }
    ],

    run: async (client, interaction) => {
        
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: `❌ | Você não possui permissão para usar esse comando.`, 
                flags: 64 
            });
        }

        
        await interaction.deferReply({ flags: 64 });

        const canal = interaction.options.getChannel("canal");
        const nomeWebhook = interaction.options.getString("nome") || "Ilusion Webhook";

        try {
            
            const webhook = await canal.createWebhook({
                name: nomeWebhook,
                avatar: client.user.displayAvatarURL(),
                reason: `Gerado por ${interaction.user.tag} via comando /webhook`
            });

            
            const embedDM = new EmbedBuilder()
                .setTitle("🔗 Webhook Gerado com Sucesso")
                .setColor("#7c3aed")
                .setDescription(`Você criou um novo webhook no servidor **${interaction.guild.name}**.`)
                .addFields(
                    { name: "📍 Canal", value: `${canal}`, inline: true },
                    { name: "🏷️ Nome", value: `\`${webhook.name}\``, inline: true },
                    { name: "🚀 URL do Webhook", value: `\`\`\`${webhook.url}\`\`\``, inline: false }
                )
                .setFooter({ text: "WINNBUXX • Não compartilhe esta URL!" })
                .setTimestamp();

            
            let dmEnviada = true;
            await interaction.user.send({ embeds: [embedDM] }).catch(() => {
                dmEnviada = false;
            });

            
            if (dmEnviada) {
                await interaction.editReply({ 
                    content: `✅ **Sucesso!** Webhook criado em ${canal}. Confira sua **DM** para pegar a URL.` 
                });
            } else {
                await interaction.editReply({ 
                    content: `⚠️ **Sua DM está fechada!** Como não consegui enviar no privado, aqui está a URL: \n\`\`\`${webhook.url}\`\`\``,
                    embeds: [embedDM]
                });
            }

        } catch (error) {
            console.error("[WEBHOOK ERRO]", error);
            await interaction.editReply({ 
                content: "❌ Erro ao criar o webhook. Verifique minhas permissões de `Gerenciar Webhooks` no canal." 
            });
        }
    }
};