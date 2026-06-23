const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const {
    getMediadores, getMediadorCargos, getAnalistaCargos, getFilas1v1, getFilasNormal,
    getFilasDados, setMediadores, setFilas1v1, setFilasNormal, setFilasDados,
    tentarParear, getUserInfo, saveUserInfo, addToTaxados, removeFromTaxados, searchTaxados
} = require('../../Functions/FilasSystem');

const dbDir = path.join(__dirname, '..', '..', 'database');

function userIsMediadorRole(member) {
    const cargos = getMediadorCargos();
    if (!cargos.length) return false;
    return cargos.some(id => member.roles.cache.has(id));
}

function userIsAnalistaRole(member) {
    const cargos = getAnalistaCargos();
    if (!cargos.length) return false;
    return cargos.some(id => member.roles.cache.has(id));
}

function isOwner(userId) {
    try {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config.json'), 'utf8'));
        return config.owner === userId;
    } catch { return false; }
}


function buildFila1v1Embed(valor) {
    const filas = getFilas1v1();
    const jogadores = (filas[valor] || []);
    return new EmbedBuilder()
        .setTitle('🎯 Fila 1v1')
        .setColor(0x5865F2)
        .addFields(
            { name: 'Valor', value: `R$ ${valor}`, inline: true },
            { name: 'Modo', value: 'fila 1v1', inline: true },
            { name: 'Jogadores na fila', value: jogadores.length > 0 ? jogadores.map(j => `<@${j.id}>`).join(', ') : 'Nenhum', inline: false }
        )
        .setFooter({ text: 'Use os botões abaixo para entrar na fila.' });
}


function buildFilaNormalEmbed(valor) {
    const filas = getFilasNormal();
    const jogadores = (filas[valor] || []);
    return new EmbedBuilder()
        .setTitle('👥 Fila Normal')
        .setColor(0x57F287)
        .addFields(
            { name: 'Valor', value: `R$ ${valor}`, inline: true },
            { name: 'Modo', value: 'fila normal', inline: true },
            { name: 'Jogadores na fila', value: jogadores.length > 0 ? jogadores.map(j => `<@${j.id}>`).join(', ') : 'Nenhum', inline: false }
        )
        .setFooter({ text: 'Use os botões abaixo para entrar na fila.' });
}

module.exports = {
    name: 'interactionCreate',
    async run(interaction, client) {

        
        if (interaction.isButton() && interaction.customId === 'fila_mediadores') {
            const fila = getMediadores();
            const desc = fila.length > 0
                ? fila.map(u => `<@${u}> \`${u}\``).join('\n')
                : 'Nenhum mediador disponível no momento.';

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Fila de Mediadores')
                .setDescription('Entre ou saia da fila de mediadores.')
                .addFields({ name: 'Mediadores Disponíveis', value: desc })
                .setColor(0x2ecc71);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('entrar_fila').setLabel('Entrar na Fila').setStyle(ButtonStyle.Success).setEmoji('➕'),
                new ButtonBuilder().setCustomId('sair_fila').setLabel('Sair da Fila').setStyle(ButtonStyle.Danger).setEmoji('➖')
            );
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
        }

        
        if (interaction.isButton() && (interaction.customId === 'entrar_fila' || interaction.customId === 'sair_fila')) {
            let fila = getMediadores();
            const userId = interaction.user.id;

            if (interaction.customId === 'entrar_fila') {
                const temCargo = userIsMediadorRole(interaction.member);
                const ehDono = isOwner(userId);
                if (!temCargo && !ehDono) {
                    return interaction.reply({ content: '❌ Você precisa do cargo de mediador para entrar na fila!', flags: 64 });
                }
                if (fila.includes(userId)) {
                    return interaction.reply({ content: '❌ Você já está na fila!', flags: 64 });
                }
                fila.push(userId);
                setMediadores(fila);
                await interaction.reply({ content: '✅ Você entrou na fila de mediadores!', flags: 64 });
            } else {
                if (!fila.includes(userId)) {
                    return interaction.reply({ content: '❌ Você não está na fila!', flags: 64 });
                }
                fila = fila.filter(id => id !== userId);
                setMediadores(fila);
                await interaction.reply({ content: '✅ Você saiu da fila de mediadores!', flags: 64 });
            }

            const desc = fila.length > 0 ? fila.map(u => `<@${u}> \`${u}\``).join('\n') : 'Nenhum mediador na fila.';
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Fila de Mediadores')
                .setDescription('Entre ou saia da fila de mediadores.')
                .addFields({ name: 'Mediadores Disponíveis:', value: desc })
                .setColor(0x2ecc71);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('entrar_fila').setLabel('Entrar na Fila').setStyle(ButtonStyle.Success).setEmoji('➕'),
                new ButtonBuilder().setCustomId('sair_fila').setLabel('Sair da Fila').setStyle(ButtonStyle.Danger).setEmoji('➖')
            );
            try { await interaction.message.edit({ embeds: [embed], components: [row] }); } catch {}
            return;
        }

        
        if (interaction.isButton() && interaction.customId === 'fila_enviar_1v1') {
            const modal = new ModalBuilder().setCustomId('modal_criar_fila_1v1').setTitle('Criar Painel 1v1');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('valor_fila').setLabel('Valor da Aposta (ex: 10,00)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('10,00')
                )
            );
            return interaction.showModal(modal);
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_criar_fila_1v1') {
            const valor = interaction.fields.getTextInputValue('valor_fila').trim();
            const embed = buildFila1v1Embed(valor);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('gel_normal').setLabel('Gel Normal').setStyle(ButtonStyle.Primary).setEmoji('🎯'),
                new ButtonBuilder().setCustomId('gel_infinito').setLabel('Gel Infinito').setStyle(ButtonStyle.Secondary).setEmoji('♾️'),
                new ButtonBuilder().setCustomId('sair_fila_1v1').setLabel('Sair da Fila').setStyle(ButtonStyle.Danger).setEmoji('🚪')
            );
            await interaction.reply({ content: '✅ Painel 1v1 criado!', flags: 64 });
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return;
        }

        
        if (interaction.isButton() && interaction.customId === 'fila_enviar_normal') {
            const modal = new ModalBuilder().setCustomId('modal_criar_fila_normal').setTitle('Criar Painel Normal');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('valor_fila').setLabel('Valor da Aposta (ex: 10,00)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('10,00')
                )
            );
            return interaction.showModal(modal);
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_criar_fila_normal') {
            const valor = interaction.fields.getTextInputValue('valor_fila').trim();
            const embed = buildFilaNormalEmbed(valor);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('entrar_fila_normal').setLabel('Entrar na Fila').setStyle(ButtonStyle.Success).setEmoji('➕'),
                new ButtonBuilder().setCustomId('sair_fila_normal').setLabel('Sair da Fila').setStyle(ButtonStyle.Danger).setEmoji('➖')
            );
            await interaction.reply({ content: '✅ Painel Normal criado!', flags: 64 });
            await interaction.channel.send({ embeds: [embed], components: [row] });
            return;
        }

        
        if (interaction.isButton() && ['gel_normal', 'gel_infinito', 'sair_fila_1v1'].includes(interaction.customId)) {
            const embed = interaction.message.embeds[0];
            if (!embed) return interaction.reply({ content: 'Embed não encontrada.', flags: 64 });
            const valorField = embed.fields?.find(f => f.name.includes('Valor'));
            const valor = valorField?.value?.replace('R$ ', '').trim();
            if (!valor) return interaction.reply({ content: 'Valor não encontrado.', flags: 64 });

            const mediadores = getMediadores();
            const userId = interaction.user.id;
            let filasDB = getFilas1v1();
            if (!filasDB[valor]) filasDB[valor] = [];

            if (interaction.customId === 'sair_fila_1v1') {
                if (!filasDB[valor].some(j => j.id === userId)) {
                    return interaction.reply({ content: '❌ Você não está na fila!', flags: 64 });
                }
                filasDB[valor] = filasDB[valor].filter(j => j.id !== userId);
                setFilas1v1(filasDB);
                await interaction.reply({ content: '✅ Você saiu da fila!', flags: 64 });
            } else {
                if (!mediadores.length) {
                    return interaction.reply({ content: '❌ Não há mediadores disponíveis no momento!', flags: 64 });
                }
                if (filasDB[valor].some(j => j.id === userId)) {
                    return interaction.reply({ content: '❌ Você já está na fila!', flags: 64 });
                }
                const tipoGel = interaction.customId === 'gel_normal' ? 'Gel Normal' : 'Gel Infinito';
                filasDB[valor].push({ id: userId, tipo: tipoGel });
                setFilas1v1(filasDB);
                await interaction.reply({ content: '✅ Você entrou na fila!', flags: 64 });
                await tentarParear(interaction, valor, '1v1', tipoGel, interaction.message, '1v1');
                filasDB = getFilas1v1();
            }

            
            const embedAtual = buildFila1v1Embed(valor);
            try { await interaction.message.edit({ embeds: [embedAtual] }); } catch {}
            return;
        }

        
        if (interaction.isButton() && ['entrar_fila_normal', 'sair_fila_normal'].includes(interaction.customId)) {
            const embed = interaction.message.embeds[0];
            if (!embed) return interaction.reply({ content: 'Embed não encontrada.', flags: 64 });
            const valorField = embed.fields?.find(f => f.name.includes('Valor'));
            const valor = valorField?.value?.replace('R$ ', '').trim();
            if (!valor) return interaction.reply({ content: 'Valor não encontrado.', flags: 64 });

            const mediadores = getMediadores();
            const userId = interaction.user.id;
            let filasDB = getFilasNormal();
            if (!filasDB[valor]) filasDB[valor] = [];

            if (interaction.customId === 'sair_fila_normal') {
                if (!filasDB[valor].some(j => j.id === userId)) {
                    return interaction.reply({ content: '❌ Você não está na fila!', flags: 64 });
                }
                filasDB[valor] = filasDB[valor].filter(j => j.id !== userId);
                setFilasNormal(filasDB);
                await interaction.reply({ content: '✅ Você saiu da fila!', flags: 64 });
            } else {
                if (!mediadores.length) {
                    return interaction.reply({ content: '❌ Não há mediadores disponíveis no momento!', flags: 64 });
                }
                if (filasDB[valor].some(j => j.id === userId)) {
                    return interaction.reply({ content: '❌ Você já está na fila!', flags: 64 });
                }
                filasDB[valor].push({ id: userId });
                setFilasNormal(filasDB);
                await interaction.reply({ content: '✅ Você entrou na fila!', flags: 64 });
                await tentarParear(interaction, valor, 'normal', 'Normal', interaction.message, 'normal');
                filasDB = getFilasNormal();
            }

            const embedAtual = buildFilaNormalEmbed(valor);
            try { await interaction.message.edit({ embeds: [embedAtual] }); } catch {}
            return;
        }

        
        if (interaction.isButton() && ['blacklist_add', 'blacklist_remove', 'blacklist_search'].includes(interaction.customId)) {
            if (!userIsAnalistaRole(interaction.member) && !isOwner(interaction.user.id)) {
                return interaction.reply({ content: '❌ Apenas analistas podem usar este painel!', flags: 64 });
            }

            const modals = {
                blacklist_add: {
                    id: 'modal_blacklist_add', title: 'Adicionar à Blacklist',
                    fields: [
                        { id: 'id', label: 'ID do Usuário (Discord)', placeholder: '123456789012345678' },
                        { id: 'id_jogo', label: 'ID do Jogo', placeholder: '987654321' },
                        { id: 'motivo', label: 'Motivo', style: 2, placeholder: 'Descreva o motivo...' },
                        { id: 'provas', label: 'Provas', style: 2, placeholder: 'Links, prints ou descrição das provas' }
                    ]
                },
                blacklist_remove: {
                    id: 'modal_blacklist_remove', title: 'Remover da Blacklist',
                    fields: [{ id: 'id', label: 'ID do Usuário', placeholder: '123456789012345678' }]
                },
                blacklist_search: {
                    id: 'modal_blacklist_search', title: 'Procurar na Blacklist',
                    fields: [{ id: 'id', label: 'ID do Usuário ou Jogo', placeholder: '123456789012345678' }]
                }
            };

            const cfg = modals[interaction.customId];
            const modal = new ModalBuilder().setCustomId(cfg.id).setTitle(cfg.title);
            cfg.fields.forEach(f => {
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId(f.id).setLabel(f.label)
                        .setStyle(f.style || TextInputStyle.Short).setPlaceholder(f.placeholder || '').setRequired(true)
                ));
            });
            return interaction.showModal(modal);
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_blacklist_add') {
            if (!userIsAnalistaRole(interaction.member) && !isOwner(interaction.user.id)) {
                return interaction.reply({ content: '❌ Apenas analistas podem usar este painel!', flags: 64 });
            }
            const entry = {
                id: interaction.fields.getTextInputValue('id'),
                id_jogo: interaction.fields.getTextInputValue('id_jogo'),
                motivo: interaction.fields.getTextInputValue('motivo'),
                provas: interaction.fields.getTextInputValue('provas'),
                data: new Date().toLocaleString('pt-BR'),
                adicionadoid: interaction.user.id
            };
            addToTaxados(entry);
            return interaction.reply({ content: '✅ Usuário adicionado à blacklist!', flags: 64 });
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_blacklist_remove') {
            if (!userIsAnalistaRole(interaction.member) && !isOwner(interaction.user.id)) {
                return interaction.reply({ content: '❌ Apenas analistas podem usar este painel!', flags: 64 });
            }
            const id = interaction.fields.getTextInputValue('id');
            const removed = removeFromTaxados(id);
            return interaction.reply({ content: removed ? '✅ Usuário removido da blacklist!' : '❌ Usuário não encontrado!', flags: 64 });
        }

        
        if (interaction.isModalSubmit() && interaction.customId === 'modal_blacklist_search') {
            if (!userIsAnalistaRole(interaction.member) && !isOwner(interaction.user.id)) {
                return interaction.reply({ content: '❌ Apenas analistas podem usar este painel!', flags: 64 });
            }
            const id = interaction.fields.getTextInputValue('id');
            const entry = searchTaxados(id);
            if (!entry) return interaction.reply({ content: '❌ Usuário não encontrado na blacklist!', flags: 64 });
            const embed = new EmbedBuilder()
                .setColor(0x2f3136).setTitle('⛔ Usuário na Blacklist')
                .addFields(
                    { name: 'ID Discord', value: entry.id, inline: true },
                    { name: 'ID Jogo', value: entry.id_jogo, inline: true },
                    { name: 'Motivo', value: entry.motivo, inline: false },
                    { name: 'Provas', value: entry.provas, inline: false },
                    { name: 'Data', value: entry.data, inline: true },
                    { name: 'Adicionado por', value: `<@${entry.adicionadoid}>`, inline: true }
                );
            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        
        if (interaction.isStringSelectMenu() && interaction.customId === 'match_action') {
            const val = interaction.values[0];
            if (val === 'finalizar_aposta') {
                const filasDados = getFilasDados();
                const partida = filasDados[interaction.channelId];
                const jogadores = partida?.jogadores || [];

                if (!userIsMediadorRole(interaction.member) && !isOwner(interaction.user.id)) {
                    return interaction.reply({ content: '❌ Apenas mediadores podem finalizar apostas!', flags: 64 });
                }

                if (jogadores.length < 2) {
                    return interaction.reply({ content: '❌ Jogadores não encontrados nesta partida.', flags: 64 });
                }

                const select = new StringSelectMenuBuilder()
                    .setCustomId('definir_vencedor')
                    .setPlaceholder('⭐ Selecione o vencedor')
                    .addOptions(jogadores.map(id => ({
                        label: interaction.guild.members.cache.get(id)?.displayName || id,
                        value: id,
                        emoji: '✅'
                    })));

                const row = new ActionRowBuilder().addComponents(select);
                return interaction.reply({ content: '**Quem venceu a partida?**', components: [row], flags: 64 });
            }

            if (val === 'reportar_usuario') {
                return interaction.reply({ content: '📋 Sistema de report em desenvolvimento. Contate um administrador.', flags: 64 });
            }
        }

        
        if (interaction.isStringSelectMenu() && interaction.customId === 'definir_vencedor') {
            const vencedorId = interaction.values[0];
            const filasDados = getFilasDados();
            const partida = filasDados[interaction.channelId];
            const jogadores = partida?.jogadores || [];
            const perdedorId = jogadores.find(j => j !== vencedorId);

            if (vencedorId) {
                const v = getUserInfo(vencedorId);
                v.vitorias++;
                v.pontos = (v.pontos || 0) + 10;
                v.partidas++;
                saveUserInfo(v);
            }
            if (perdedorId) {
                const p = getUserInfo(perdedorId);
                p.derrotas++;
                p.partidas++;
                saveUserInfo(p);
            }

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('🏆 Partida Finalizada')
                .addFields(
                    { name: '🥇 Vencedor', value: `<@${vencedorId}>`, inline: true },
                    { name: '💔 Perdedor', value: perdedorId ? `<@${perdedorId}>` : 'N/A', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            delete filasDados[interaction.channelId];
            setFilasDados(filasDados);

            setTimeout(async () => {
                try { await interaction.channel.delete(); } catch {}
            }, 10000);
        }

        
        if (interaction.isButton() && (interaction.customId?.startsWith('analista_aceitar:') || interaction.customId?.startsWith('analista_recusar:'))) {
            const [action, userId] = interaction.customId.split(':');
            const isMed = userIsMediadorRole(interaction.member) || isOwner(interaction.user.id);
            if (!isMed) return interaction.reply({ content: '❌ Sem permissão.', flags: 64 });

            if (action === 'analista_aceitar') {
                await interaction.update({
                    embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ Análise Aceita').setDescription(`<@${interaction.user.id}> aceitou analisar <@${userId}>.`).setTimestamp()],
                    components: []
                });
            } else {
                await interaction.update({
                    embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('❌ Análise Recusada').setDescription(`<@${interaction.user.id}> recusou a análise de <@${userId}>.`).setTimestamp()],
                    components: []
                });
            }
        }

        
        if (interaction.isButton() && (interaction.customId?.startsWith('ranking_prev:') || interaction.customId?.startsWith('ranking_next:'))) {
            const [action, pageStr] = interaction.customId.split(':');
            const currentPage = parseInt(pageStr, 10);
            const rankingMod = require('../../ComandosSlash/Administracao/ranking_compras');
            const cacheId = `ranking:${interaction.user.id}`;
            const cached = rankingMod._rankingCache.get(cacheId);

            if (!cached) {
                return interaction.reply({ content: '❌ Cache expirado. Execute /ranking-compras novamente.', flags: 64 });
            }

            const { ranking } = cached;
            const PAGE_SIZE = rankingMod._PAGE_SIZE;
            const totalPages = Math.ceil(ranking.length / PAGE_SIZE);
            const newPage = action === 'ranking_next' ? currentPage + 1 : currentPage - 1;

            if (newPage < 0 || newPage >= totalPages) return interaction.reply({ content: '❌ Página inválida.', flags: 64 });

            const { MessageFlags } = require('discord.js');
            const { container, row } = rankingMod._buildRankingPanel(ranking, newPage, totalPages);
            await interaction.update({ components: [container, row], flags: MessageFlags.IsComponentsV2 });
        }
    }
};