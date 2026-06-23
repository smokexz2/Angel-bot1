const { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const emojis = require("../../database/emojis.json");

module.exports = {
    name: "cargo-all",
    description: "[🛠️ | Moderação] Atribui um cargo específico a todos os membros do servidor que ainda não o possuem.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: "0x00000008",
    options: [
        {
            name: 'cargo',
            description: 'Selecione o cargo que deseja atribuir a todos os membros.',
            type: ApplicationCommandOptionType.Role,
            required: true,
        }
    ],

    run: async (client, interaction) => {
        const roleToAssign = interaction.options.getRole(`cargo`);

        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: `${Emojis.get(`negative`)} | Desculpe, você não tem permissão para utilizar este comando. Apenas **administradores** podem usá-lo.`,
                flags: 64
            });
        }

        
        if (!roleToAssign) {
            return interaction.reply({
                content: `${Emojis.get(`info`)} | Cargo inválido. Por favor, selecione um cargo válido para continuar.`,
                flags: 64
            });
        }

        
        if (roleToAssign.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: `${Emojis.get(`negative`)} | O cargo **${roleToAssign.name}** é igual ou superior ao meu cargo mais alto. Por favor, mova meu cargo acima do cargo que você deseja atribuir.`,
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        let successCount = 0;
        let errorCount = 0;
        let totalMembersProcessed = 0;

        try {
            
            
            const guildMembers = await interaction.guild.members.fetch({ force: true });

            
            const eligibleMembers = guildMembers.filter(member =>
                !member.user.bot && !member.roles.cache.has(roleToAssign.id)
            );

            if (eligibleMembers.size === 0) {
                return interaction.editReply({
                    content: `${Emojis.get(`info`)} | Não há membros elegíveis para receber o cargo **${roleToAssign.name}** (ou todos já o possuem).`,
                    flags: 64
                });
            }

            totalMembersProcessed = eligibleMembers.size;
            const progressUpdateInterval = Math.max(1, Math.floor(totalMembersProcessed / 20)); 

            let lastUpdateTime = Date.now();

            for (const member of eligibleMembers.values()) {
                try {
                    await member.roles.add(roleToAssign);
                    successCount++;
                } catch (error) {
                    
                    console.error(`[CARGO-ALL] Erro ao adicionar cargo \`${roleToAssign.name}\` para ${member.user.tag} (${member.id}):`, error.message);
                    errorCount++;
                }

                
                if (Date.now() - lastUpdateTime > 3000 || successCount === totalMembersProcessed || (successCount % progressUpdateInterval === 0 && successCount > 0)) {
                    await interaction.editReply({
                        content: `${Emojis.get('loading')} | Adicionando cargo **${roleToAssign.name}** aos membros...\nProcessado: \`${successCount} / ${totalMembersProcessed}\` (${((successCount / totalMembersProcessed) * 100).toFixed(1)}%)`,
                    });
                    lastUpdateTime = Date.now();
                }
            }

            
            const finalEmbed = new EmbedBuilder()
                .setColor(errorCount > 0 ? '#ffcc00' : '#00ff00') 
                .setTitle(`✅ Atribuição de Cargo Concluída`)
                .setDescription(`O cargo **${roleToAssign.name}** foi processado para todos os membros elegíveis.`)
                .addFields(
                    { name: 'Membros com Sucesso', value: `\`${successCount}\``, inline: true },
                    { name: 'Membros com Erro', value: `\`${errorCount}\``, inline: true },
                    { name: 'Total Processado', value: `\`${totalMembersProcessed}\``, inline: true }
                )
                .setFooter({ text: 'Verifique o console para mais detalhes sobre os erros.' })
                .setTimestamp();

            await interaction.editReply({
                content: ``, 
                embeds: [finalEmbed],
                flags: 64
            });

        } catch (error) {
            console.error("[CARGO-ALL] Erro fatal durante a operação `cargo-all`:", error);
            await interaction.editReply({
                content: `${Emojis.get(`negative`)} | Ocorreu um erro inesperado ao tentar processar os membros do servidor. Por favor, tente novamente mais tarde.`,
                flags: 64
            });
        }
    }
};