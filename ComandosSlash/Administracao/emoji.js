const { ApplicationCommandType } = require("discord.js");
const { getPermissions } = require("../../Functions/PermissionsCache.js");
const { configuracao } = require("../../database/index.js")
const { Emojis } = require("../../database");

module.exports = {
    name: "create_emojis",
    description: "[🛠️ | Moderação] Criar os emojis padrão do bot",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (!perm || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: `${Emojis.get(`negative`)} Voce nao Tem Permissao Para Isso`, flags: 64 });
        }
        
        await interaction.reply({ content: `${Emojis.get(`loading`)} Adicionado os Emojis Aguarde...`, flags: 64 });

        const emojiArray = [
            "https://cdn.discordapp.com/emojis/1183841001824067676.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841127661580339.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841205839220776.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841312018026556.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841529148739669.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841627425476621.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841719976996885.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841795864535151.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1183841842467446844.webp?size=96&quality=lossless"
        ];

        const arrayVendasAuto = [
            "https://cdn.discordapp.com/emojis/1194131420499677317.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131444797288549.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131474534899753.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131507858636961.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131544764317736.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131583767162960.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131629812220005.webp?size=96&quality=lossless",
            "https://cdn.discordapp.com/emojis/1194131674196344922.webp?size=96&quality=lossless",
        ];

        try {
            await Promise.all(emojiArray.map(async (url, index) => {
                const emojiName = `eb${index + 1}`;
                const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
                await configuracao.push(`Emojis_EntregAbaixo`, { id: createdEmoji.id, name: createdEmoji.name });
            }));

            await Promise.all(arrayVendasAuto.map(async (url, index) => {
                const emojiName = `ea${index + 1}`;
                const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
                await configuracao.push(`Emojis_EntregAuto`, { id: createdEmoji.id, name: createdEmoji.name });
            }));

            await interaction.editReply({ content: `${Emojis.get(`checker`)} Emojis Adicionados com Sucesso! Lembre-se de reiniciar o bot parar as configuraçoes serem atualizadas`, flags: 64 });
        } catch (error) {
            console.error("Erro ao criar emojis:", error);
            interaction.reply({ content: `${Emojis.get(`negative`)} Ocorreu um erro ao adicionar os emojis`, flags: 64 });
        }
    },
};