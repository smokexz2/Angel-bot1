const Discord = require("discord.js");
const config = require("../../config.json");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
    name: "nuke",
    description: "[🛠️ | Moderação] dar Nuke me algum canal",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'canal',
            description: 'Selecione o canal que deseja nukear',
            type: Discord.ApplicationCommandOptionType.Channel,
            required: true,
        }
    ],

    run: async (client, interaction) => {
        const canal = interaction.options.getChannel('canal');

        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id) || !interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `❌ | Você não possui permissão para usar esse comando.`, flags: 64 });
        }

        
        const novoCanal = await canal.clone().catch(error => {
            console.error('Erro ao duplicar o canal:', error);
            return interaction.reply({ content: `❌ | Ocorreu um erro ao duplicar o canal.`, flags: 64 });
        });

        if (!novoCanal) return;

        
        canal.delete().catch(error => {
            console.error('Erro ao apagar o canal antigo:', error);
            return interaction.reply({ content: `❌ | Ocorreu um erro ao apagar o canal antigo.`, flags: 64 });
        });

        
        novoCanal.send(`Canal nukado por \`${interaction.user.username}\``);

        
        interaction.reply({ content: `✅ | O canal foi nukado com sucesso!`, flags: 64 });
    }
};