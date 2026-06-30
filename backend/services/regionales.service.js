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
    activo: Boolean(row.activo),
    estado: row.activo ? 'ACTIVO' : 'INACTIVO',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(filters = {}) {
  const { page, limit, offset } = parsePagination(filters);
  const total = await regionalesRepository.count(filters);
  const rows = await regionalesRepository.findMany(filters, { limit, offset });
  return {
    items: rows.map(format),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id) {
  return format(await regionalesRepository.findById(id));
}

async function create(data) {
  const codigo = data.codigo?.trim().toUpperCase();
  const nombre = data.nombre?.trim();

  if (!codigo || !nombre) throw createAppError('Código y nombre son obligatorios', 400);
  if (await regionalesRepository.codigoExists(codigo)) {
    throw createAppError('El código de regional ya existe', 409);
  }

  const id = generateId();
  await regionalesRepository.insert([id, codigo, nombre, 1]);
  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Regional no encontrada', 404);

  const codigo = (data.codigo || existing.codigo).trim().toUpperCase();
  const nombre = (data.nombre || existing.nombre).trim();

  if (await regionalesRepository.codigoExists(codigo, id)) {
    throw createAppError('El código de regional ya existe', 409);
  }

  await regionalesRepository.update(id, ['codigo = ?', 'nombre = ?'], [codigo, nombre]);
  return getById(id);
}

async function deactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Regional no encontrada', 404);
  if (!existing.activo) throw createAppError('La regional ya está inactiva', 400);

  const centros = await regionalesRepository.countCentrosActivos(id);
  if (centros > 0) {
    throw createAppError('No se puede desactivar: tiene centros activos asociados', 409);
  }

  await regionalesRepository.setActivo(id, false);
  return getById(id);
}

async function reactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Regional no encontrada', 404);
  if (existing.activo) throw createAppError('La regional ya está activa', 400);

  await regionalesRepository.setActivo(id, true);
  return getById(id);
}

module.exports = { list, getById, create, update, deactivate, reactivate, format };
