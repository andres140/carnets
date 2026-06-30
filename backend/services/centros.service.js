const centrosRepository = require('../repositories/centros.repository');
const regionalesRepository = require('../repositories/regionales.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { createAppError } = require('../utils/errors');

function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    regionalId: row.regional_id,
    regionalNombre: row.regional_nombre,
    regionalCodigo: row.regional_codigo,
    activo: Boolean(row.activo),
    estado: row.activo ? 'ACTIVO' : 'INACTIVO',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function validateRegional(regionalId) {
  const regional = await regionalesRepository.findById(regionalId);
  if (!regional) throw createAppError('Regional no válida', 400);
  if (!regional.activo) throw createAppError('La regional seleccionada está inactiva', 400);
  return regional;
}

async function list(filters = {}) {
  const { page, limit, offset } = parsePagination(filters);
  const total = await centrosRepository.count(filters);
  const rows = await centrosRepository.findMany(filters, { limit, offset });
  return {
    items: rows.map(format),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id) {
  return format(await centrosRepository.findById(id));
}

async function create(data) {
  const codigo = data.codigo?.trim().toUpperCase();
  const nombre = data.nombre?.trim();
  const regionalId = data.regionalId;

  if (!codigo || !nombre || !regionalId) {
    throw createAppError('Código, nombre y regional son obligatorios', 400);
  }
  if (await centrosRepository.codigoExists(codigo)) {
    throw createAppError('El código de centro ya existe', 409);
  }
  await validateRegional(regionalId);

  const id = generateId();
  await centrosRepository.insert([id, regionalId, codigo, nombre, 1]);
  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Centro no encontrado', 404);

  const codigo = (data.codigo || existing.codigo).trim().toUpperCase();
  const nombre = (data.nombre || existing.nombre).trim();
  const regionalId = data.regionalId || existing.regionalId;

  if (await centrosRepository.codigoExists(codigo, id)) {
    throw createAppError('El código de centro ya existe', 409);
  }
  await validateRegional(regionalId);

  await centrosRepository.update(
    id,
    ['codigo = ?', 'nombre = ?', 'regional_id = ?'],
    [codigo, nombre, regionalId]
  );
  return getById(id);
}

async function deactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Centro no encontrado', 404);
  if (!existing.activo) throw createAppError('El centro ya está inactivo', 400);

  const deps = await centrosRepository.countDependenciasActivas(id);
  if (deps > 0) {
    throw createAppError('No se puede desactivar: tiene dependencias activas', 409);
  }

  await centrosRepository.setActivo(id, false);
  return getById(id);
}

async function reactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Centro no encontrado', 404);
  if (existing.activo) throw createAppError('El centro ya está activo', 400);

  await validateRegional(existing.regionalId);
  await centrosRepository.setActivo(id, true);
  return getById(id);
}

module.exports = { list, getById, create, update, deactivate, reactivate, format };
