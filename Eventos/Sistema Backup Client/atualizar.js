const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../database");
const ROLE_ID = `${configuracao.get(`ConfigRoles.cargoCliente`)}`;
const DATA_FILE = path.resolve(__dirname, '../../database/clients.json');

module.exports = {
    name: 'guildMemberAdd',
    run: async (member) => {
        const data = readDataFile();
        const role = member.guild.roles.cache.get(ROLE_ID);

        if (data.includes(member.id) && role) {
            try {
                await member.roles.add(role);
            } catch (error) {
            }
        }
    },
};

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