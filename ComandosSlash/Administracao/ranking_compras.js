const { ApplicationCommandType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { JsonDatabase } = require("../../database/jsondb");
const path = require('path');
const { getPermissions } = require('../../Functions/PermissionsCache.js');

const pedidos = new JsonDatabase({ databasePath: path.join(__dirname, '..', '..', 'database', 'pedidos.json') });

const PAGE_SIZE = 10;
const rankingCache = new Map();

function calcRanking() {
    const userStats = {};
    try {
        const all = pedidos.fetchAll();
        for (const entry of all) {
            const data = entry.data;
            if (!data) continue;
            const uid = data.userId || data.user;
            if (!uid) continue;
            if (!userStats[uid]) userStats[uid] = { userId: uid, totalGasto: 0, pedidos: 0 };
            userStats[uid].totalGasto += Number(data.valor || data.total || data.preco || 0);
            userStats[uid].pedidos++;
        }
    } catch {}
    return Object.values(userStats).sort((a, b) => b.totalGasto - a.totalGasto);
}

function buildRankingPanel(ranking, page, totalPages) {
    const start = page * PAGE_SIZE;
    const slice = ranking.slice(start, start + PAGE_SIZE);
    const medals = ['🥇', '🥈', '🥉'];

    const lines = slice.map((entry, i) => {
        const pos = start + i + 1;
        const medal = pos <= 3 ? medals[pos - 1] : `\`#${pos}\``;
        const spent = Number(entry.totalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${medal} <@${entry.userId}> — **R$ ${spent}** (${entry.pedidos} pedido(s))`;
    });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🏆 Ranking de Compradores'),
            new TextDisplayBuilder().setContent(lines.length > 0 ? lines.join('\n') : 'Nenhuma compra registrada.')
        )
        .addSeparatorComponents(sep => sep.setDivider(true))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Página ${page + 1} de ${totalPages || 1}`)
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ranking_prev:${page}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`ranking_next:${page}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= (totalPages - 1))
    );

    return { container, row };
}

module.exports = {
    name: 'ranking-compras',
    description: '[🏆 | Rank] Exibe o ranking de compradores da loja.',
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const perm = await getPermissions(client.user.id);
        if (perm === null || !perm.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ | Você não possui permissão para usar esse comando.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        const ranking = calcRanking();

        if (ranking.length === 0) {
            const empty = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## 🏆 Ranking de Compradores'),
                    new TextDisplayBuilder().setContent('Nenhuma compra registrada ainda.')
                );
            return interaction.editReply({ components: [empty], flags: MessageFlags.IsComponentsV2 });
        }

        const cacheId = `ranking:${interaction.user.id}`;
        rankingCache.set(cacheId, { ranking, createdAt: Date.now() });
        setTimeout(() => rankingCache.delete(cacheId), 300000);

        const totalPages = Math.ceil(ranking.length / PAGE_SIZE);
        const { container, row } = buildRankingPanel(ranking, 0, totalPages);

        await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
    },

    _rankingCache: rankingCache,
    _calcRanking: calcRanking,
    _buildRankingPanel: buildRankingPanel,
    _PAGE_SIZE: PAGE_SIZE
};