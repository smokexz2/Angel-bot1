const fs = require('fs');
const path = require('path');
const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DB_DIR = path.join(__dirname, '..', 'database');

function readJson(file, fallback) {
    const p = path.join(DB_DIR, file);
    try {
        if (!fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(fallback, null, 2)); return fallback; }
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return fallback; }
}

function writeJson(file, data) {
    fs.writeFileSync(path.join(DB_DIR, file), JSON.stringify(data, null, 2));
}


function getMediadores() { return readJson('mediadores.json', []); }
function getMediadorCargos() { return readJson('mediador.json', []); }
function getAnalistaCargos() { return readJson('analista.json', []); }
function getCategoriaFilas() { return readJson('categoria_filas.json', []); }
function getChamarAnalista() { return readJson('chamaranalista.json', []); }
function getTaxados() { return readJson('taxados.json', []); }
function getBlacklist() { return readJson('blacklist_filas.json', []); }
function getFilas1v1() { return readJson('filas1v1.json', {}); }
function getFilasNormal() { return readJson('filasNormal.json', {}); }
function getFilasDados() { return readJson('filasDados.json', {}); }
function getUsersInfo() { return readJson('usersinfo.json', {}); }


function setMediadores(data) { writeJson('mediadores.json', data); }
function setFilas1v1(data) { writeJson('filas1v1.json', data); }
function setFilasNormal(data) { writeJson('filasNormal.json', data); }
function setFilasDados(data) { writeJson('filasDados.json', data); }
function setUsersInfo(data) { writeJson('usersinfo.json', data); }
function setTaxados(data) { writeJson('taxados.json', data); }
function setBlacklist(data) { writeJson('blacklist_filas.json', data); }


function getUserInfo(id) {
    const db = getUsersInfo();
    if (!db[id]) db[id] = { id, vitorias: 0, derrotas: 0, pontos: 0, partidas: 0 };
    return db[id];
}

function saveUserInfo(user) {
    const db = getUsersInfo();
    db[user.id] = user;
    setUsersInfo(db);
}


function escolherMediadorPorHash(mediadores, idPartida) {
    if (!Array.isArray(mediadores) || mediadores.length === 0) return null;
    let hash = 0;
    for (let i = 0; i < idPartida.length; i++) {
        hash = (hash * 31 + idPartida.charCodeAt(i)) % mediadores.length;
    }
    return mediadores[hash];
}

async function tentarParear(interaction, valor, modo, tipo, filaEmbedMsg, tipoFila = '1v1') {
    let filasDB = tipoFila === 'normal' ? getFilasNormal() : getFilas1v1();
    if (!filasDB[valor]) return;

    let jogadoresMatch = [];
    if (tipoFila === 'normal') {
        jogadoresMatch = filasDB[valor];
    } else {
        jogadoresMatch = filasDB[valor].filter(j => j.tipo === tipo);
    }

    if (jogadoresMatch.length < 2) return;

    const [jogador1, jogador2] = jogadoresMatch;
    filasDB[valor] = filasDB[valor].filter(j => !jogadoresMatch.slice(0, 2).some(jm => jm.id === j.id));
    if (tipoFila === 'normal') setFilasNormal(filasDB); else setFilas1v1(filasDB);

    
    let valorReal = valor;
    if (filaEmbedMsg?.embeds?.[0]) {
        const vf = filaEmbedMsg.embeds[0].fields?.find(f => f.name.toLowerCase().includes('valor'));
        if (vf) { const m = vf.value.match(/([0-9]+,[0-9]+)/); if (m) valorReal = m[1]; }
    }

    await criarSalaAposta(interaction.guild, jogador1, jogador2, modo, tipo, valorReal);
}

async function criarSalaAposta(guild, jogador1, jogador2, modo, tipoGel, valor) {
    const categoriaIds = getCategoriaFilas();
    const categoriaId = categoriaIds[0] || null;
    const mediadores = getMediadores();

    const canal = await guild.channels.create({
        name: `aposta-${jogador1.id}-${jogador2.id}`,
        type: ChannelType.GuildText,
        parent: categoriaId,
        permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: jogador1.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: jogador2.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
    });

    const mediadorId = escolherMediadorPorHash(mediadores, canal.id);
    if (mediadorId) {
        await canal.permissionOverwrites.edit(mediadorId, { ViewChannel: true, SendMessages: true });
    }

    await canal.send({ content: `<@${jogador1.id}> <@${jogador2.id}>${mediadorId ? ` <@${mediadorId}>` : ''}` });

    const estiloJogo = `${modo} | ${tipoGel}`;
    const embed = new EmbedBuilder()
        .setTitle('Partida Iniciada')
        .setColor(0xF59E42)
        .addFields(
            { name: 'Estilo de Jogo', value: estiloJogo, inline: false },
            { name: 'Informações da Partida', value: `Mediador: ${mediadorId ? `<@${mediadorId}>` : 'N/A'}\nTaxa de Serviço: R$ 1,80`, inline: false },
            { name: 'Valor da Aposta', value: `R$ ${valor}`, inline: false },
            { name: 'Jogadores', value: `<@${jogador1.id}>\n<@${jogador2.id}>`, inline: false },
            { name: 'Horário', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setFooter({ text: 'Selecione a ação que deseja realizar.' });

    const select = new StringSelectMenuBuilder()
        .setCustomId('match_action')
        .setPlaceholder('Selecione a ação que deseja realizar.')
        .addOptions([
            { label: 'Finalizar Aposta', description: 'Clique aqui para fechar esta aposta.', value: 'finalizar_aposta' },
            { label: 'Reportar Usuário', description: 'Reporte um comportamento suspeito.', value: 'reportar_usuario' }
        ]);

    const row = new ActionRowBuilder().addComponents(select);
    await canal.send({ embeds: [embed], components: [row] });

    
    const filasDados = getFilasDados();
    filasDados[canal.id] = { valor, modo, tipoGel, jogadores: [jogador1.id, jogador2.id], mediador: mediadorId, timestamp: Date.now() };
    setFilasDados(filasDados);
}


function addToTaxados(entry) {
    const taxados = getTaxados();
    taxados.push(entry);
    setTaxados(taxados);
}

function removeFromTaxados(id) {
    const taxados = getTaxados();
    const filtered = taxados.filter(t => t.id !== id);
    if (filtered.length === taxados.length) return false;
    setTaxados(filtered);
    return true;
}

function searchTaxados(id) {
    return getTaxados().find(t => t.id === id || t.id_jogo === id) || null;
}

module.exports = {
    getMediadores, getMediadorCargos, getAnalistaCargos, getCategoriaFilas,
    getChamarAnalista, getTaxados, getBlacklist, getFilas1v1, getFilasNormal,
    getFilasDados, getUserInfo, saveUserInfo, setMediadores, setFilas1v1,
    setFilasNormal, setFilasDados, tentarParear, criarSalaAposta,
    addToTaxados, removeFromTaxados, searchTaxados
};