const fs = require('fs');
const path = require('path');

function ensureFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}', 'utf8');
}

function readJson(filePath) {
  ensureFile(filePath);
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeJson(filePath, data) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function pathParts(key) {
  return String(key).split('.').filter(Boolean);
}

function getValue(data, key) {
  if (key === undefined || key === null || key === '') return data;
  let current = data;
  for (const part of pathParts(key)) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function setValue(data, key, value) {
  const parts = pathParts(key);
  if (!parts.length) return value;
  let current = data;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === null || typeof current[part] !== 'object' || Array.isArray(current[part])) current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return data;
}

function deleteValue(data, key) {
  const parts = pathParts(key);
  if (!parts.length) return false;
  let current = data;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current === null || typeof current !== 'object') return false;
    current = current[part];
  }
  if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, parts[parts.length - 1])) {
    delete current[parts[parts.length - 1]];
    return true;
  }
  return false;
}

class JsonDatabase {
  constructor(options = {}) {
    this.databasePath = options.databasePath || options.filePath || path.join(process.cwd(), 'database', 'database.json');
    this.databasePath = path.resolve(process.cwd(), this.databasePath);
    ensureFile(this.databasePath);
  }

  _read() {
    return readJson(this.databasePath);
  }

  _write(data) {
    writeJson(this.databasePath, data);
    return data;
  }

  get(key) {
    const value = getValue(this._read(), key);
    return value === undefined ? null : value;
  }

  fetch(key) {
    return this.get(key);
  }

  set(key, value) {
    const data = this._read();
    setValue(data, key, value);
    this._write(data);
    return value;
  }

  has(key) {
    const value = getValue(this._read(), key);
    return value !== undefined && value !== null;
  }

  delete(key) {
    const data = this._read();
    const deleted = deleteValue(data, key);
    this._write(data);
    return deleted;
  }

  deleteAll() {
    this._write({});
    return true;
  }

  clear() {
    return this.deleteAll();
  }

  all() {
    const data = this._read();
    return Object.entries(data).map(([ID, data]) => ({ ID, data, id: ID, value: data }));
  }

  fetchAll() {
    return this.all();
  }

  valueArray() {
    const data = this._read();
    if (Array.isArray(data)) return data;
    return Object.values(data);
  }

  filter(callback, thisArg) {
    return this.all().filter(callback, thisArg);
  }

  map(callback, thisArg) {
    return this.all().map(callback, thisArg);
  }

  some(callback, thisArg) {
    return this.all().some(callback, thisArg);
  }

  find(callback, thisArg) {
    return this.all().find(callback, thisArg);
  }

  forEach(callback, thisArg) {
    return this.all().forEach(callback, thisArg);
  }

  keyArray() {
    const data = this._read();
    if (Array.isArray(data)) return data.map((_, index) => String(index));
    return Object.keys(data);
  }

  dataArray() {
    return this.valueArray();
  }

  object() {
    return this._read();
  }

  push(key, value) {
    const current = this.get(key);
    const list = Array.isArray(current) ? current : [];
    list.push(value);
    this.set(key, list);
    return list;
  }

  pull(key, value) {
    const current = this.get(key);
    const list = Array.isArray(current) ? current : [];
    const filtered = list.filter(item => JSON.stringify(item) !== JSON.stringify(value));
    this.set(key, filtered);
    return filtered;
  }

  add(key, amount) {
    const next = (Number(this.get(key)) || 0) + (Number(amount) || 0);
    this.set(key, next);
    return next;
  }

  sub(key, amount) {
    return this.add(key, -(Number(amount) || 0));
  }

  table(name) {
    const parsed = path.parse(this.databasePath);
    return new JsonDatabase({ databasePath: path.join(parsed.dir, `${parsed.name}_${name}.json`) });
  }
}

class QuickDB extends JsonDatabase {}

module.exports = { JsonDatabase, QuickDB };