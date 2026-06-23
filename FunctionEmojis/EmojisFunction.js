const { EmojisHelper } = require('../database');
const AllEmojis = require('./emojis.json');
const axios = require('axios');
const fs = require('fs');

async function fetchEmojis(client) {
    const response = await axios.get(`https://discord.com/api/v10/applications/${client.application.id}/emojis`, {
        headers: { Authorization: `Bot ${client.token}` }
    });
    return response.data.items;
}

async function createEmoji(client, name, image) {
    try {
        const response = await axios.post(`https://discord.com/api/v10/applications/${client.application.id}/emojis`, {
            name: name,
            image: image
        }, {
            headers: { Authorization: `Bot ${client.token}` }
        });

        const emojiId = response.data.id;
        const isAnimated = response.data.animated || image.endsWith('.gif');
        await saveEmojiToDatabase(name, emojiId, isAnimated);

        return isAnimated ? `<a:${name}:${emojiId}>` : `<:${name}:${emojiId}>`;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message === 'You are being rate limited.') {
            const retryAfter = error.response.data.retry_after * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return await createEmoji(client, name, image);
        }
        if (error.response && error.response.status === 500) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await createEmoji(client, name, image);
        }
        console.log(`\x1b[31m[Emojis]\x1b[0m Erro ao adicionar o emoji ${name}: ${error.message}`);
        return null;
    }
}

async function GetEmoji(client, emojiName) {
    const emojis = await fetchEmojis(client);
    const existingEmoji = emojis.find(e => e.name === emojiName);
    if (existingEmoji) {
        return existingEmoji.animated
            ? `<a:${emojiName}:${existingEmoji.id}>`
            : `<:${emojiName}:${existingEmoji.id}>`;
    }
    const emojiData = AllEmojis.find(e => e.name === emojiName);
    if (emojiData) {
        return await createEmoji(client, emojiData.name, emojiData.image);
    }
    return null;
}

async function saveEmojiToDatabase(emojiName, emojiId, isAnimated) {
    try {
        const emojiMention = isAnimated
            ? `<a:${emojiName}:${emojiId}>`
            : `<:${emojiName}:${emojiId}>`;

        const dbPath = './database/emojis.json';
        let emojiData = {};
        if (fs.existsSync(dbPath)) {
            try { emojiData = JSON.parse(fs.readFileSync(dbPath)); } catch { emojiData = {}; }
        }
        emojiData[emojiName] = emojiMention;
        fs.writeFileSync(dbPath, JSON.stringify(emojiData, null, 2));
        EmojisHelper.reload();
    } catch (error) {
        console.log(`\x1b[31m[Emojis]\x1b[0m Erro ao salvar o emoji ${emojiName}: ${error.message}`);
    }
}

async function UploadEmojis(client) {
    const emojis = await fetchEmojis(client);
    const existingNames = new Set(emojis.map(e => e.name));

    
    
    const freshEmojiData = {};
    for (const emoji of emojis) {
        freshEmojiData[emoji.name] = emoji.animated
            ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;
    }
    fs.writeFileSync('./database/emojis.json', JSON.stringify(freshEmojiData, null, 2));
    EmojisHelper.reload();

    
    
    const missingEmojis = AllEmojis.filter(emoji => !existingNames.has(emoji.name));
    for (const emoji of missingEmojis) {
        await createEmoji(client, emoji.name, emoji.image);
    }

    EmojisHelper.reload();
    console.log('\x1b[36m[Emojis]\x1b[0m Cache de emojis atualizado.');
}

module.exports = { GetEmoji, UploadEmojis };