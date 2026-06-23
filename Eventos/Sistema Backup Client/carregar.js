const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../database");
const ROLE_ID = `${configuracao.get(`ConfigRoles.cargoCliente`)}`;
const DATA_FILE = path.resolve(__dirname, '../../database/clients.json');

module.exports = {
    name: 'ready',
    once: true,
    run: async (client) => {
        await reassignRoles(client);
    },
};

async function reassignRoles(client) {
    const data = readDataFile();
    const guild = client.guilds.cache.first();
    if (guild) {
        const role = guild.roles.cache.get(ROLE_ID);
        const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(ROLE_ID));
        
        membersWithRole.forEach(member => {
            const userId = member.id;
            if (!data.includes(userId)) {
                data.push(userId); 
            }
        });

        saveDataFile(data); 

        console.log(`Verificados ${membersWithRole.size} membros com o cargo ${role ? role.name : ROLE_ID}.`);
    }
}

function readDataFile() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
            return [];
        }
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        if (!rawData.trim()) {
            return [];
        }
        return JSON.parse(rawData);
    } catch (error) {
        return [];
    }
}

function saveDataFile(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
    }
}