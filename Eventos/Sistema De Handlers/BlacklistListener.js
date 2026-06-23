const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { searchTaxados } = require('../../Functions/FilasSystem');

const dbDir = path.join(__dirname, '..', '..', 'database');

module.exports = {
    name: 'messageCreate',
    run: async (message, client) => {
        if (message.author.bot) return;
        if (!message.guild) return;

        const blacklistPath = path.join(dbDir, 'blacklist_filas.json');
        if (!fs.existsSync(blacklistPath)) return;

        let canaisBlacklist = [];
        try {
            const raw = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
            if (Array.isArray(raw)) canaisBlacklist = raw;
            else if (raw.id) canaisBlacklist = [raw.id];
        } catch { return; }

        if (!canaisBlacklist.includes(message.channel.id)) return;

        const conteudo = message.content.trim();
        if (!/^\d+$/.test(conteudo)) {
            try { await message.delete(); } catch {}
            return;
        }

        const encontrado = searchTaxados(conteudo);

        let emojis = {};
        try { emojis = JSON.parse(fs.readFileSync(path.join(dbDir, 'emojis.json'), 'utf8')); } catch {}

        let embed;
        if (encontrado) {
            embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle(`${emojis.confirmed_emoji || '✅'} Detectado na Blacklist`)
                .setDescription(`O ID \`${conteudo}\` **foi encontrado** na blacklist.`)
                .addFields(
                    { name: 'Motivo', value: encontrado.motivo || 'Não informado', inline: false },
                    { name: 'Adicionado em', value: encontrado.data || 'Desconhecido', inline: true },
                    { name: 'Adicionado por', value: `<@${encontrado.adicionadoid || '0'}>`, inline: true }
                );
        } else {
            embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle(`${emojis.failuser_emoji || '❌'} Não Detectado`)
                .setDescription(`O ID \`${conteudo}\` **não foi encontrado** na blacklist.\n-# Caso isso seja um erro, contate a administração.`);
        }

        try { await message.reply({ embeds: [embed] }); } catch {}
    }
};