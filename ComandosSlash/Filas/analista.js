const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMediadorCargos, getChamarAnalista } = require('../../Functions/FilasSystem');

module.exports = {
    name: 'analista',
    description: '[🔍 | Filas] Solicita análise de um usuário nas filas de apostas.',
    type: ApplicationCommandType.ChatInput,
    options: [
        { name: 'user', description: 'Usuário a ser analisado', type: 6, required: true },
        { name: 'motivo', description: 'Motivo da análise', type: 3, required: true }
    ],

    run: async (client, interaction) => {
        const mediadorCargos = getMediadorCargos();
        const temCargo = mediadorCargos.length > 0
            ? mediadorCargos.some(id => interaction.member.roles.cache.has(id))
            : false;

        const config = (() => { try { return require('../../config.json'); } catch { return {}; } })();
        const ehDono = config.owner === interaction.user.id;

        if (!temCargo && !ehDono) {
            return interaction.reply({ content: '❌ Você precisa do cargo de mediador para usar este comando!', flags: 64 });
        }

        const alvo = interaction.options.getUser('user');
        const motivo = interaction.options.getString('motivo');
        const canalIds = getChamarAnalista();
        const canalId = canalIds[0];

        const embed = new EmbedBuilder()
            .setTitle('🔍 Solicitação de Análise')
            .setColor(0xF59E42)
            .addFields(
                { name: 'Usuário', value: `${alvo} (\`${alvo.id}\`)`, inline: true },
                { name: 'Solicitado por', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                { name: 'Motivo', value: motivo, inline: false },
                { name: 'Canal de Origem', value: `${interaction.channel}`, inline: false },
                { name: 'Horário', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
            )
            .setThumbnail(alvo.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`analista_aceitar:${alvo.id}`).setLabel('Aceitar').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId(`analista_recusar:${alvo.id}`).setLabel('Recusar').setStyle(ButtonStyle.Danger).setEmoji('❌')
        );

        if (canalId) {
            try {
                const canal = await client.channels.fetch(canalId);
                await canal.send({ embeds: [embed], components: [row] });
                return interaction.reply({ content: '✅ Solicitação de análise enviada!', flags: 64 });
            } catch {}
        }

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};