const { PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { configuracao, EmojisHelper } = require("../../database");
const { res } = require("../../res");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'report',
    type: 1,
    description: 'Reporta um usuário aos moderadores.',
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a reportar.', required: true },
        { type: 3, name: 'motivo', description: 'Descrição do problema.', required: true }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        if (target.id === interaction.user.id) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Você não pode se reportar.` }).with({ flags: [64] }));
        }
        if (target.bot) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não é possível reportar bots.` }).with({ flags: [64] }));
        }

        const reportCanalId = configuracao.get('moderacao.reportCanal');
        if (!reportCanalId) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Canal de reports não configurado. Use \`/panel\` para configurar.` }).with({ flags: [64] }));
        }

        try {
            const ch = await client.channels.fetch(reportCanalId);
            if (!ch) throw new Error('Canal não encontrado');

            await ch.send(res.main(
                { type: 10, content: `-# Moderação > Report` },
                { type: 14 },
                { type: 10, content: `### ${E('negative') || '⚠️'} Novo Report\n> **Reportado:** ${target.tag} (\`${target.id}\`) <@${target.id}>\n> **Reportado por:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n> **Canal:** <#${interaction.channel.id}>\n> **Motivo:** ${motivo}\n> **Quando:** <t:${Math.floor(Date.now()/1000)}:R>` }
            ));

            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Report enviado aos moderadores. Obrigado por ajudar a manter o servidor seguro!` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro ao enviar report: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};