const rolesRepository = require('../repositories/roles.repository');
const permisosRepository = require('../repositories/permisos.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { createAppError } = require('../utils/errors');

function format(row, permisos = null) {
  if (!row) return null;
  const item = {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    activo: Boolean(row.activo),
    estado: row.activo ? 'ACTIVO' : 'INACTIVO',
    usuariosCount: row.usuarios_count ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (permisos !== null) item.permisos = permisos;
  return item;
}

function formatPermiso(row) {
  return { id: row.id, codigo: row.codigo, nombre: row.nombre };
}

async function list(filters = {}) {
  const { page, limit, offset } = parsePagination(filters);
  const total = await rolesRepository.count(filters);
  const rows = await rolesRepository.findMany(filters, { limit, offset });
  return {
    items: rows.map((r) => format(r)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id, { includePermisos = false } = {}) {
  const row = await rolesRepository.findById(id);
  if (!row) return null;
  const permisos = includePermisos
    ? (await rolesRepository.getPermisosByRolId(id)).map(formatPermiso)
    : null;
  return format(row, permisos);
}

async function create(data) {
  const nombre = data.nombre?.trim().toUpperCase();
  const descripcion = data.descripcion?.trim() || null;

  if (!nombre) throw createAppError('El nombre del rol es obligatorio', 400);
  if (await rolesRepository.nombreExists(nombre)) {
    throw createAppError('El nombre del rol ya existe', 409);
  }

  const id = generateId();
  await rolesRepository.insert([id, nombre, descripcion, 1]);
  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Rol no encontrado', 404);

  const nombre = (data.nombre || existing.nombre).trim().toUpperCase();
  const descripcion =
    data.descripcion !== undefined ? data.descripcion?.trim() || null : existing.descripcion;

  if (await rolesRepository.nombreExists(nombre, id)) {
    throw createAppError('El nombre del rol ya existe', 409);
  }

  await rolesRepository.update(id, ['nombre = ?', 'descripcion = ?'], [nombre, descripcion]);
  return getById(id);
}

async function deactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Rol no encontrado', 404);
  if (!existing.activo) throw createAppError('El rol ya está inactivo', 400);

  const usuarios = await rolesRepository.countUsuarios(id);
  if (usuarios > 0) {
    throw createAppError('No se puede desactivar: el rol está asignado a usuarios', 409);
  }

  await rolesRepository.setActivo(id, false);
  return getById(id);
}

async function reactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Rol no encontrado', 404);
  if (existing.activo) throw createAppError('El rol ya está activo', 400);

  await rolesRepository.setActivo(id, true);
  return getById(id);
}

async function setPermisos(rolId, permisoIds = []) {
  const existing = await getById(rolId);
  if (!existing) throw createAppError('Rol no encontrado', 404);

  const uniqueIds = [...new Set(permisoIds)];
  const found = await permisosRepository.findByIds(uniqueIds);
  if (found.length !== uniqueIds.length) {
    throw createAppError('Uno o más permisos no son válidos', 400);
  }

  await rolesRepository.replacePermisos(rolId, uniqueIds);
  return getById(rolId, { includePermisos: true });
}

module.exports = {
  list,
  getById,
  create,
  update,
  deactivate,
  reactivate,
  setPermisos,
  format,
};
