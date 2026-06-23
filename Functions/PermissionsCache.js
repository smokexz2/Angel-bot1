const perms = require("../database/perms.json");

async function getPermissions() {
    const idAdmin = perms;

    const permissions = Object.values(idAdmin);

    return permissions;
}

module.exports = {
    getPermissions
};