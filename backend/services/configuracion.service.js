const configuracionRepository = require('../repositories/configuracion.repository');
const { CONFIG_KEYS } = require('../constants');

const DEFAULTS = {
  [CONFIG_KEYS.INSTITUCION_NOMBRE]: 'Servicio Nacional de Aprendizaje — SENA',
  [CONFIG_KEYS.LOGO_URL]: '/uploads/placeholder-logo.png',
  [CONFIG_KEYS.SESSION_MAX_AGE_MS]: '28800000',
  [CONFIG_KEYS.CARNET_VIGENCIA_ANOS]: '1',
  [CONFIG_KEYS.CARNET_CODIGO_FORMATO]: '{REGIONAL}-{YEAR}-{SEQ}',
  [CONFIG_KEYS.UPLOAD_MAX_MB]: '5',
  [CONFIG_KEYS.IDIOMA]: 'es',
  [CONFIG_KEYS.TIMEZONE]: 'America/Bogota',
};

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30000;

function parseValue(row) {
  if (!row) return null;
  if (row.tipo === 'number') return Number(row.valor);
  if (row.tipo === 'boolean') return row.valor === 'true' || row.valor === '1';
  return row.valor;
}

async function loadMap() {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;
  const rows = await configuracionRepository.getAll();
  cache = {};
  for (const row of rows) {
    cache[row.clave] = parseValue(row);
  }
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (cache[k] === undefined) cache[k] = v;
  }
  cacheAt = Date.now();
  return cache;
}

function invalidateCache() {
  cache = null;
}

async function getAll() {
  const rows = await configuracionRepository.getAll();
  const map = {};
  for (const row of rows) {
    map[row.clave] = {
      valor: parseValue(row),
      tipo: row.tipo,
      descripcion: row.descripcion,
      updatedAt: row.updated_at,
    };
  }
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (!map[k]) map[k] = { valor: v, tipo: typeof v === 'number' ? 'number' : 'string', descripcion: null };
  }
  return map;
}

async function get(clave) {
  const map = await loadMap();
  return map[clave] ?? DEFAULTS[clave] ?? null;
}

async function updateMany(updates, actorId) {
  const allowed = Object.values(CONFIG_KEYS);
  const changed = [];

  for (const [clave, valor] of Object.entries(updates)) {
    if (!allowed.includes(clave)) continue;
    const tipo = typeof valor === 'number' ? 'number' : 'string';
    await configuracionRepository.upsert(clave, valor, actorId, tipo);
    changed.push({ clave, valor });
  }

  invalidateCache();
  return changed;
}

module.exports = { getAll, get, updateMany, invalidateCache, DEFAULTS };
