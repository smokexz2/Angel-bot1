const fs = require("fs")

module.exports = {

  run: (client) => {

    
    const SlashsArray = []

    const loadCommands = () => {
      const folders = fs.readdirSync(`./ComandosSlash/`);
      for (const subfolder of folders) {
        const files = fs.readdirSync(`./ComandosSlash/${subfolder}/`);
        for (const file of files) {
          if (!file.endsWith('.js')) continue;
          const command = require(`../ComandosSlash/${subfolder}/${file}`);
          if (!command?.name) continue;
          client.slashCommands.set(command.name, command);
          SlashsArray.push(command);
        }
      }
    };

    loadCommands();

    client.on("ready", async () => {
      console.log(`[Slash] Registrando ${SlashsArray.length} comandos...`);
      await client.application.commands.set(SlashsArray)
        .then(() => console.log('[Slash] Comandos registrados com sucesso!'))
        .catch(err => console.error('[Slash] Erro ao registrar comandos:', err));
    });
  }
}