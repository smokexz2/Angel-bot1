const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database', 'scripts_database.json');

const state = {
    scripts: [],
    categories: [],
    settings: { language: 'br' }
};

function ensureDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

function loadDB() {
    ensureDB();
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        state.scripts = Array.isArray(parsed.scripts) ? parsed.scripts : [];
        state.categories = Array.isArray(parsed.categories) ? parsed.categories : [];
        state.settings = parsed.settings || { language: 'br' };
    } catch {
        state.scripts = [];
        state.categories = [];
        state.settings = { language: 'br' };
        saveDB();
    }
}

loadDB();

function normalize(str) {
    return String(str || '').trim().toLowerCase();
}

function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
}

function listCategories() { return [...state.categories]; }
function listScripts() { return [...state.scripts]; }

function getScriptById(id) {
    return state.scripts.find(s => s.id === id) || null;
}

function listScriptsByCategoryName(categoryName) {
    const norm = normalize(categoryName);
    return state.scripts.filter(s => normalize(s.categoryName) === norm);
}

function listGamesWithScripts() {
    return listCategories().map(cat => ({
        ...cat,
        scripts: listScriptsByCategoryName(cat.name)
    }));
}

function hasCategories() {
    return state.categories.length > 0;
}

function addCategory(name, imageUrl) {
    if (!name || String(name).trim().length < 2) return { ok: false, reason: 'invalid_name' };
    if (!imageUrl || !isValidUrl(imageUrl)) return { ok: false, reason: 'invalid_image_url' };
    const normName = normalize(name);
    if (state.categories.some(c => normalize(c.name) === normName)) return { ok: false, reason: 'exists' };
    const category = { id: normName, name: String(name).trim(), imageUrl: String(imageUrl).trim() };
    state.categories.push(category);
    saveDB();
    return { ok: true, category };
}

function addScript({ name, content, categoryName }) {
    const normCat = normalize(categoryName);
    const category = state.categories.find(c => normalize(c.name) === normCat);
    if (!category) return { ok: false, reason: 'category_not_found' };
    if (!name || String(name).trim().length < 2) return { ok: false, reason: 'invalid_name' };
    if (!content || String(content).trim().length < 1) return { ok: false, reason: 'invalid_content' };
    const script = {
        id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label: String(name).trim(),
        description: `Jogo: ${category.name}`,
        content: String(content).trim(),
        categoryName: category.name
    };
    state.scripts.push(script);
    saveDB();
    return { ok: true, script };
}

function removeScript({ name, categoryName }) {
    const normCat = normalize(categoryName);
    const normName = normalize(name);
    const idx = state.scripts.findIndex(s =>
        normalize(s.label) === normName && normalize(s.categoryName) === normCat
    );
    if (idx === -1) return { ok: false, reason: 'script_not_found' };
    const [script] = state.scripts.splice(idx, 1);
    saveDB();
    return { ok: true, script };
}

function removeCategory(name) {
    const normName = normalize(name);
    const idx = state.categories.findIndex(c => normalize(c.name) === normName);
    if (idx === -1) return { ok: false, reason: 'not_found' };
    state.categories.splice(idx, 1);
    state.scripts = state.scripts.filter(s => normalize(s.categoryName) !== normName);
    saveDB();
    return { ok: true };
}

module.exports = {
    listCategories,
    listScripts,
    getScriptById,
    listScriptsByCategoryName,
    listGamesWithScripts,
    hasCategories,
    addCategory,
    addScript,
    removeScript,
    removeCategory
};