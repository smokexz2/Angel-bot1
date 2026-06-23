const { ApplicationCommandType } = require("discord.js");
const path = require("path");
const fs = require("fs").promises;
const { configuracao } = require("../../database");
const { Emojis } = require("../../database");
const { getPermissions } = require("../../Functions/PermissionsCache.js");

module.exports = {
  name: "vincular_clientes",
  description: "[🛠️ | Moderação] Vincular clientes ao seu servidor",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const perm = await getPermissions(client.user.id);
    if (perm === null || !perm.includes(interaction.user.id)) {
      return interaction.reply({ content: `${Emojis.get('negative')} | Você não possui permissão para usar esse comando.`, flags: 64 });
    }

    try {
      const clientespach = path.resolve(__dirname, '../../database/clients.json');
      const data = await fs.readFile(clientespach, `utf8`);
      const clientes = JSON.parse(data);

      let totalClientes = clientes.length;
      let clientesSetadosComSucesso = 0;

      const initialMessage = await interaction.reply({
        content: `${Emojis.get(`loading`)} | Processo de sincronização de clientes foi iniciado.\n${Emojis.get(`_silueta_emoji`)} | Progresso: \`0\`/\`${totalClientes}\` clientes sincronizados.`,
        flags: 64
      });

      for (let i = 0; i < totalClientes; i++) {
        const clientId = clientes[i];
        try {
          const member = await interaction.guild.members.fetch(clientId);
          if (member) {
            await member.roles.add(configuracao.get(`ConfigRoles.cargoCliente`));
            clientesSetadosComSucesso++;
          }
        } catch (error) {
        }

        await initialMessage.edit({
          content: `${Emojis.get(`loading`)} | Processo de sincronização de clientes foi iniciado.\n${Emojis.get(`_silueta_emoji`)}  | Progresso: \`${clientesSetadosComSucesso}\`/\`${totalClientes}\` clientes sincronizados.`,
          flags: 64
        });
      }

      await initialMessage.edit({
        content: `${Emojis.get(`checker`)} | Processo de sincronização de clientes concluído. \`${clientesSetadosComSucesso}\` clientes foram sincronizados com sucesso.`,
        flags: 64
      });

    } catch (error) {
      await interaction.reply({ content: `${Emojis.get(`negative`)} | Ocorreu um erro ao tentar sincronizar os clientes.`, flags: 64 });
    }
  }
};