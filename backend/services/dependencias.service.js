const dependenciasRepository = require('../repositories/dependencias.repository');
const centrosRepository = require('../repositories/centros.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { createAppError } = require('../utils/errors');

function format(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    centroId: row.centro_id,
    centroNombre: row.centro_nombre,
    centroCodigo: row.centro_codigo,
    regionalId: row.regional_id,
    regionalNombre: row.regional_nombre,
    activo: Boolean(row.activo),
    estado: row.activo ? 'ACTIVO' : 'INACTIVO',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function validateCentro(centroId) {
  const centro = await centrosRepository.findById(centroId);
  if (!centro) throw createAppError('Centro no válido', 400);
  if (!centro.activo) throw createAppError('El centro seleccionado está inactivo', 400);
  return centro;
}

async function list(filters = {}) {
  const { page, limit, offset } = parsePagination(filters);
  const total = await dependenciasRepository.count(filters);
  const rows = await dependenciasRepository.findMany(filters, { limit, offset });
  return {
    items: rows.map(format),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id) {
  return format(await dependenciasRepository.findById(id));
}

async function create(data) {
  const nombre = data.nombre?.trim();
  const centroId = data.centroId;

  if (!nombre || !centroId) {
    throw createAppError('Nombre y centro son obligatorios', 400);
  }
  if (await dependenciasRepository.nombreExistsEnCentro(nombre, centroId)) {
    throw createAppError('Ya existe una dependencia con ese nombre en el centro', 409);
  }
  await validateCentro(centroId);

  const id = generateId();
  await dependenciasRepository.insert([id, centroId, nombre, 1]);
  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Dependencia no encontrada', 404);

  const nombre = (data.nombre || existing.nombre).trim();
  const centroId = data.centroId || existing.centroId;

  if (await dependenciasRepository.nombreExistsEnCentro(nombre, centroId, id)) {
    throw createAppError('Ya existe una dependencia con ese nombre en el centro', 409);
  }
  await validateCentro(centroId);

  await dependenciasRepository.update(id, ['nombre = ?', 'centro_id = ?'], [nombre, centroId]);
  return getById(id);
}

async function deactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Dependencia no encontrada', 404);
  if (!existing.activo) throw createAppError('La dependencia ya está inactiva', 400);

  const usuarios = await dependenciasRepository.countUsuariosActivosPorDependencia(id);
  if (usuarios > 0) {
    throw createAppError('No se puede desactivar: tiene usuarios activos asignados', 409);
  }

  await dependenciasRepository.setActivo(id, false);
  return getById(id);
}

async function reactivate(id) {
  const existing = await getById(id);
  if (!existing) throw createAppError('Dependencia no encontrada', 404);
  if (existing.activo) throw createAppError('La dependencia ya está activa', 400);

  await validateCentro(existing.centroId);
  await dependenciasRepository.setActivo(id, true);
  return getById(id);
}

module.exports = { list, getById, create, update, deactivate, reactivate, format };
