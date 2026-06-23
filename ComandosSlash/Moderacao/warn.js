const { PermissionFlagsBits } = require("discord.js");
const { configuracao, SystemMod, EmojisHelper } = require("../../database");
const { res } = require("../../res");
const { checkAndApplyThresholds } = require("../../Functions/WarnThresholds");

const E = (n) => { const v = EmojisHelper.get(n); return (v && v.trim()) ? v : ''; };

module.exports = {
    name: 'warn',
    type: 1,
    description: 'Aplica um aviso a um usuário.',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    options: [
        { type: 6, name: 'usuario', description: 'Usuário a avisar.', required: true },
        { type: 3, name: 'motivo', description: 'Motivo do aviso.', required: true }
    ],
    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo');

        if (target.id === interaction.user.id) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Você não pode se avisar.` }).with({ flags: [64] }));
        }
        if (target.bot) {
            return interaction.reply(res.main({ type: 10, content: `${E('negative')} Não é possível avisar bots.` }).with({ flags: [64] }));
        }

        const warnId = `${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
        const warns = SystemMod.get(`warns.${target.id}`) || [];
        warns.push({ id: warnId, reason, modId: interaction.user.id, guildId: interaction.guild.id, ts: Date.now() });
        SystemMod.set(`warns.${target.id}`, warns);
        const warnCount = warns.length;

        try { await target.send(`${E('negative') || '⚠️'} Você recebeu um **aviso** no servidor **${interaction.guild.name}**.\n**Motivo:** ${reason}\n**Total de avisos:** ${warnCount}`); } catch {}

        const logCanalId = configuracao.get('moderacao.logCanal');
        if (logCanalId) {
            try {
                const ch = await client.channels.fetch(logCanalId);
                if (ch) await ch.send(res.main(
                    { type: 10, content: `-# Moderação > Warn` },
                    { type: 14 },
                    { type: 10, content: `### ${E('negative') || '⚠️'} Aviso Aplicado\n> **Usuário:** ${target.tag} (\`${target.id}\`)\n> **Aviso #${warnCount}**\n> **Motivo:** ${reason}\n> **Moderador:** ${interaction.user.tag}` }
                ));
            } catch {}
        }

        
        const punishMsg = await checkAndApplyThresholds({
            client, interaction, target, warnCount, guildId: interaction.guild.id
        });

        interaction.reply(res.main(
            { type: 10, content: `${E('checker') || '✅'} Aviso **#${warnCount}** aplicado a **${target.tag}**.\n-# Motivo: ${reason}${punishMsg || ''}` }
        ).with({ flags: [64] }));
    }
};