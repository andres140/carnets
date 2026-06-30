const permisosRepository = require('../repositories/permisos.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { createAppError } = require('../utils/errors');

function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    rolesCount: row.roles_count ?? undefined,
    createdAt: row.created_at,
  };
}

async function list(filters = {}) {
  const { page, limit, offset } = parsePagination(filters);
  const total = await permisosRepository.count(filters);
  const rows = await permisosRepository.findMany(filters, { limit, offset });
  return {
    items: rows.map(format),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function listAll() {
  const rows = await permisosRepository.findAll();
  return rows.map(format);
}

async function getById(id) {
  return format(await permisosRepository.findById(id));
}

async function create(data) {
  const codigo = data.codigo?.trim().toLowerCase();
  const nombre = data.nombre?.trim();

  if (!codigo || !nombre) throw createAppError('Código y nombre son obligatorios', 400);
  if (!/^[a-z0-9._-]+$/.test(codigo)) {
    throw createAppError('Código inválido. Use letras minúsculas, números, puntos o guiones', 400);
  }
  if (await permisosRepository.codigoExists(codigo)) {
    throw createAppError('El código de permiso ya existe', 409);
  }

  const id = generateId();
  await permisosRepository.insert([id, codigo, nombre]);
  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Permiso no encontrado', 404);

  const nombre = (data.nombre || existing.nombre).trim();
  await permisosRepository.update(id, ['nombre = ?'], [nombre]);
  return getById(id);
}

module.exports = { list, listAll, getById, create, update, format };
