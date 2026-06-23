const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', '..', 'database');

function readArr(file) {
    try {
        const p = path.join(dbDir, file);
        if (!fs.existsSync(p)) return [];
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return []; }
}

function writeArr(file, data) {
    fs.writeFileSync(path.join(dbDir, file), JSON.stringify(data, null, 2));
}

function buildFilasConfigEmbed() {
    const mediador = readArr('mediador.json');
    const analista = readArr('analista.json');
    const categoria = readArr('categoria_filas.json');
    const chamarana = readArr('chamaranalista.json');
    const blacklist = readArr('blacklist_filas.json');

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Configurações de Filas')
        .setDescription('Configure o sistema de filas de apostas.')
        .addFields(
            { name: '🛡️ Cargo Mediador', value: mediador.length > 0 ? mediador.map(id => `<@&${id}>`).join(', ') : '`Não configurado`', inline: true },
            { name: '🔍 Cargo Analista', value: analista.length > 0 ? analista.map(id => `<@&${id}>`).join(', ') : '`Não configurado`', inline: true },
            { name: '📁 Categoria de Apostas', value: categoria.length > 0 ? `<#${categoria[0]}>` : '`Não configurado`', inline: true },
            { name: '📢 Canal Chamar Analista', value: chamarana.length > 0 ? `<#${chamarana[0]}>` : '`Não configurado`', inline: true },
            { name: '⛔ Canal Blacklist', value: blacklist.length > 0 ? blacklist.map(id => `<#${id}>`).join(', ') : '`Não configurado`', inline: true }
        )
        .setFooter({ text: 'WinnBuxx • Config de Filas' });
}

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        
        if ((interaction.isButton() && interaction.customId === 'painelconfigfilas') || (interaction.isStringSelectMenu?.() && interaction.customId?.startsWith('panel_select_') && interaction.values?.[0] === 'painelconfigfilas')) {
            const embed = buildFilasConfigEmbed();
            const select = new StringSelectMenuBuilder()
                .setCustomId('filas_config_select')
                .setPlaceholder('Selecione uma configuração...')
                .addOptions([
                    { label: 'Cargo de Mediador', value: 'mediador', description: 'Defina o cargo de mediador' },
                    { label: 'Cargo de Analista', value: 'analista', description: 'Defina o cargo de analista' },
                    { label: 'Categoria de Apostas', value: 'categoria', description: 'ID da categoria onde os canais de aposta são criados' },
                    { label: 'Canal Chamar Analista', value: 'chamaranalista', description: 'Canal para enviar solicitações de análise' },
                    { label: 'Canal Blacklist', value: 'blacklist', description: 'Canal onde IDs são verificados na blacklist' }
                ]);
            const row = new ActionRowBuilder().addComponents(select);
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }

        
        if (interaction.isStringSelectMenu() && interaction.customId === 'filas_config_select') {
            const selected = interaction.values[0];

            const labels = {
                mediador: 'Cargo de Mediador',
                analista: 'Cargo de Analista',
                categoria: 'Categoria de Apostas',
                chamaranalista: 'Canal Chamar Analista',
                blacklist: 'Canal Blacklist'
            };

            const modal = new ModalBuilder()
                .setCustomId(`modal_filas_config_${selected}`)
                .setTitle(`Configurar: ${labels[selected]}`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('valor')
                        .setLabel('ID (Cole o ID do cargo/canal aqui)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Ex: 1234567890123456789')
                )
            );

            return interaction.showModal(modal);
        }

        
        if (interaction.isModalSubmit() && interaction.customId?.startsWith('modal_filas_config_')) {
            const field = interaction.customId.replace('modal_filas_config_', '');
            const valor = interaction.fields.getTextInputValue('valor').trim();

            const fileMap = {
                mediador: 'mediador.json',
                analista: 'analista.json',
                categoria: 'categoria_filas.json',
                chamaranalista: 'chamaranalista.json',
                blacklist: 'blacklist_filas.json'
            };

            const arquivo = fileMap[field];
            if (!arquivo) return interaction.reply({ content: '❌ Configuração inválida.', flags: 64 });

            const current = readArr(arquivo);
            if (!current.includes(valor)) {
                current.push(valor);
                writeArr(arquivo, current);
            }

            return interaction.reply({ content: `✅ **${field}** configurado com ID: \`${valor}\``, flags: 64 });
        }
    }
};