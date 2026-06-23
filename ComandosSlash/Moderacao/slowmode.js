const { PermissionFlagsBits, ChannelType } = require("discord.js");
const { EmojisHelper } = require("../../database");
const { res } = require("../../res");
const ms = require("ms");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'slowmode',
    type: 1,
    description: 'Define o slowmode de um canal.',
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        { type: 3, name: 'tempo', description: 'Tempo (ex: 5s, 10m, 1h) ou 0 para desativar.', required: true },
        { type: 7, name: 'canal', description: 'Canal alvo (padrão: canal atual).', required: false }
    ],
    run: async (client, interaction) => {
        const tempoStr = interaction.options.getString('tempo');
        const canal = interaction.options.getChannel('canal') || interaction.channel;

        if (!canal.isTextBased()) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Canal inválido.` }).with({ flags: [64] }));
        }

        let segundos = 0;
        if (tempoStr !== '0' && tempoStr !== 'off') {
            const millis = ms(tempoStr);
            if (!millis || isNaN(millis)) {
                return interaction.reply(res.main({ type: 10, content: `${E('negative')} Tempo inválido. Use: \`0\`, \`5s\`, \`10m\`, \`6h\`` }).with({ flags: [64] }));
            }
            segundos = Math.floor(millis / 1000);
            if (segundos > 21600) return interaction.reply(res.main({ type: 10, content: `${E('negative')} Máximo é 6 horas (21600s).` }).with({ flags: [64] }));
        }

        try {
            await canal.setRateLimitPerUser(segundos, `Slowmode definido por ${interaction.user.tag}`);
            const txt = segundos === 0 ? 'desativado' : `${tempoStr}`;
            interaction.reply(res.main(
                { type: 10, content: `${E('checker') || '✅'} Slowmode em <#${canal.id}> ${segundos === 0 ? '**desativado**' : `definido para \`${txt}\``}.` }
            ).with({ flags: [64] }));
        } catch (e) {
            interaction.reply(res.main({ type: 10, content: `${E('negative')} Erro: \`${e.message}\`` }).with({ flags: [64] }));
        }
    }
};