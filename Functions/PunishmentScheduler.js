









const { SystemMod } = require('../database');

const activeTimers = new Map(); 

function punishmentKey(type, userId, guildId) {
    return `punishments.${type}.${userId}_${guildId}`;
}





function schedulePunishment(opts) {
    const { client, type, userId, guildId, expiresAt, reason } = opts;
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;

    SystemMod.set(key, { userId, guildId, type, expiresAt, reason, savedAt: Date.now() });

    const delay = Math.max(expiresAt - Date.now(), 0);

    if (activeTimers.has(timerKey)) clearTimeout(activeTimers.get(timerKey));

    const tid = setTimeout(() => executePunishmentRemoval({ client, type, userId, guildId }), delay);
    activeTimers.set(timerKey, tid);
}




async function executePunishmentRemoval({ client, type, userId, guildId }) {
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;
    activeTimers.delete(timerKey);

    try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        if (type === 'tempban') {
            await guild.members.unban(userId, 'TempBan expirado automaticamente').catch(() => {});
        } else if (type === 'mute') {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) await member.timeout(null, 'TempMute expirado automaticamente').catch(() => {});
        }

        const logCanalId = require('./').configuracao?.get?.('moderacao.logCanal');
        if (logCanalId) {
            try {
                const ch = await client.channels.fetch(logCanalId);
                if (ch) {
                    const { res } = require('../res');
                    const label = type === 'tempban' ? 'Ban Temporário Expirou' : 'Mute Temporário Expirou';
                    await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Punição Automática` },
                        { type: 14 },
                        { type: 10, content: `### ✅ ${label}\n> **Usuário:** <@${userId}> (\`${userId}\`)\n> **Punição:** \`${type}\` removida automaticamente` }
                    ));
                }
            } catch {}
        }
    } catch (err) {
        console.error(`[PunishmentScheduler] Erro ao remover ${type} de ${userId}:`, err.message);
    } finally {
        SystemMod.delete(key);
    }
}





async function loadAndSchedule(client) {
    let loaded = 0;
    const types = ['tempban', 'mute'];

    for (const type of types) {
        const allOfType = SystemMod.get(`punishments.${type}`) || {};
        for (const [entryKey, entry] of Object.entries(allOfType)) {
            if (!entry || !entry.userId || !entry.guildId || !entry.expiresAt) continue;
            const { userId, guildId, reason, expiresAt } = entry;

            if (Date.now() >= expiresAt) {
                await executePunishmentRemoval({ client, type, userId, guildId });
            } else {
                schedulePunishment({ client, type, userId, guildId, expiresAt, reason });
                loaded++;
            }
        }
    }

    if (loaded > 0) console.log(`\x1b[36m[PunishmentScheduler]\x1b[35m ${loaded} punição(ões) temporária(s) reagendada(s).`);
}




function cancelPunishment(type, userId, guildId) {
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;
    if (activeTimers.has(timerKey)) {
        clearTimeout(activeTimers.get(timerKey));
        activeTimers.delete(timerKey);
    }
    SystemMod.delete(key);
}

module.exports = { schedulePunishment, cancelPunishment, loadAndSchedule };