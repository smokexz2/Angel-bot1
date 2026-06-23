const fs = require('fs');
const path = require('path');
const { configuracao } = require("../../database");
const ROLE_ID = `${configuracao.get(`ConfigRoles.cargoCliente`)}`;
const DATA_FILE = path.resolve(__dirname, '../../database/clients.json');

module.exports = {
    name: 'guildMemberUpdate',
    run: (oldMember, newMember) => {
        const role = newMember.guild.roles.cache.get(ROLE_ID);

        
        const hasRoleBefore = oldMember.roles.cache.has(ROLE_ID);
        const hasRoleNow = newMember.roles.cache.has(ROLE_ID);

        if (hasRoleBefore && !hasRoleNow) {

        } else if (!hasRoleBefore && hasRoleNow) {
            addUserRole(newMember.id);
        } else {
        }
    },
};

function addUserRole(userId) {
    const data = readDataFile();
    if (!data.includes(userId)) {
        data.push(userId);
        saveDataFile(data);
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