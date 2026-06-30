const bcrypt = require('bcryptjs');
const { ROL_TO_TIPO, ROLES } = require('../constants');
const usersRepository = require('../repositories/users.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { applyUserListScope, canAccessUser } = require('../utils/permissions');
const { createAppError } = require('../utils/errors');

function splitNombreCompleto(nombreCompleto) {
  const parts = (nombreCompleto || '').trim().split(/\s+/);
  if (parts.length <= 1) {
    return { nombres: nombreCompleto || '', apellidos: '' };
  }
  return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
}

function formatUser(row) {
  if (!row) return null;
  const { nombres, apellidos } = splitNombreCompleto(row.nombre_completo);
  return {
    id: row.id,
    documento: row.documento,
    tipoDocumento: row.tipo_documento,
    nombres,
    apellidos,
    nombreCompleto: row.nombre_completo,
    email: row.email,
    telefono: row.telefono,
    fotoUrl: row.foto_url,
    estado: row.estado,
    tipoUsuario: row.tipo_usuario,
    rolId: row.rol_id,
    rolNombre: row.rol_nombre,
    regionalId: row.regional_id,
    regionalNombre: row.regional_nombre,
    centroId: row.centro_id,
    centroNombre: row.centro_nombre,
    dependenciaId: row.dependencia_id,
    dependenciaNombre: row.dependencia_nombre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}

function assertCanAccess(actor, targetUser) {
  if (!canAccessUser(actor, targetUser)) {
    throw createAppError('Usuario no encontrado', 404);
  }
}

async function validateForeignKeys({ regionalId, centroId, dependenciaId }) {
  if (regionalId) {
    const regional = await usersRepository.findRegionalById(regionalId);
    if (!regional) throw createAppError('Regional no válida', 400);
  }
  if (centroId) {
    const centro = await usersRepository.findCentroById(centroId);
    if (!centro) throw createAppError('Centro de formación no válido', 400);
    if (regionalId && centro.regional_id !== regionalId) {
      throw createAppError('El centro no pertenece a la regional seleccionada', 400);
    }
  }
  if (dependenciaId) {
    const dependencia = await usersRepository.findDependenciaById(dependenciaId);
    if (!dependencia) throw createAppError('Dependencia no válida', 400);
    if (centroId && dependencia.centro_id !== centroId) {
      throw createAppError('La dependencia no pertenece al centro seleccionado', 400);
    }
  }
}

function assertCoordinatorAssignment(actor, data) {
  if (actor?.tipoUsuario !== ROLES.COORDINADOR) return data;

  if (!actor.regionalId) {
    throw createAppError('Coordinador sin regional asignada', 403);
  }

  if (data.regionalId && data.regionalId !== actor.regionalId) {
    throw createAppError('No puede asignar usuarios fuera de su regional', 403);
  }

  return { ...data, regionalId: actor.regionalId };
}

async function list(filters = {}, actor = null) {
  const scopedFilters = applyUserListScope(actor, filters);
  const { page, limit, offset } = parsePagination(filters);

  const total = await usersRepository.countUsers(scopedFilters);
  const rows = await usersRepository.findMany(scopedFilters, { limit, offset });

  return {
    items: rows.map(formatUser),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id, actor = null) {
  const row = await usersRepository.findById(id);
  const user = formatUser(row);
  if (!user) return null;
  assertCanAccess(actor, user);
  return user;
}

async function create(data, actor = null) {
  const scopedData = assertCoordinatorAssignment(actor, data);
  const rol = await usersRepository.findRolById(scopedData.rolId);
  if (!rol) throw createAppError('Rol no válido', 400);
  if (!rol.activo) throw createAppError('El rol seleccionado está inactivo', 400);

  if (await usersRepository.emailExists(scopedData.email)) {
    throw createAppError('El correo ya está registrado', 409);
  }
  if (await usersRepository.documentoExists(scopedData.documento)) {
    throw createAppError('El documento ya está registrado', 409);
  }

  await validateForeignKeys(scopedData);

  const id = generateId();
  const nombreCompleto = `${scopedData.nombres.trim()} ${scopedData.apellidos.trim()}`.trim();
  const passwordHash = await bcrypt.hash(scopedData.password, 12);
  const tipoUsuario = ROL_TO_TIPO[rol.nombre] || 'FUNCIONARIO';
  const estado = scopedData.estado || 'ACTIVO';

  await usersRepository.insertUser([
    id,
    scopedData.email.trim().toLowerCase(),
    passwordHash,
    scopedData.rolId,
    tipoUsuario,
    estado,
    scopedData.documento.trim(),
    scopedData.tipoDocumento || 'CC',
    nombreCompleto,
    scopedData.fotoUrl || null,
    scopedData.regionalId || null,
    scopedData.centroId || null,
    scopedData.dependenciaId || null,
    scopedData.telefono?.trim() || null,
  ]);

  return getById(id, actor);
}

async function update(id, data, actor = null) {
  const existing = await getById(id, actor);
  if (!existing) throw createAppError('Usuario no encontrado', 404);

  const merged = {
    ...data,
    regionalId:
      data.regionalId !== undefined ? data.regionalId || null : existing.regionalId,
    centroId: data.centroId !== undefined ? data.centroId || null : existing.centroId,
    dependenciaId:
      data.dependenciaId !== undefined ? data.dependenciaId || null : existing.dependenciaId,
  };

  const scoped = assertCoordinatorAssignment(actor, merged);

  if (scoped.email && (await usersRepository.emailExists(scoped.email, id))) {
    throw createAppError('El correo ya está registrado', 409);
  }
  if (scoped.documento && (await usersRepository.documentoExists(scoped.documento, id))) {
    throw createAppError('El documento ya está registrado', 409);
  }

  const rolId = scoped.rolId || existing.rolId;
  const rol = await usersRepository.findRolById(rolId);
  if (!rol) throw createAppError('Rol no válido', 400);
  if (!rol.activo && rolId !== existing.rolId) {
    throw createAppError('El rol seleccionado está inactivo', 400);
  }

  await validateForeignKeys({
    regionalId: scoped.regionalId,
    centroId: scoped.centroId,
    dependenciaId: scoped.dependenciaId,
  });

  const nombres = scoped.nombres !== undefined ? scoped.nombres : existing.nombres;
  const apellidos = scoped.apellidos !== undefined ? scoped.apellidos : existing.apellidos;
  const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();
  const tipoUsuario = ROL_TO_TIPO[rol.nombre] || existing.tipoUsuario;

  const fields = [
    'email = ?',
    'documento = ?',
    'tipo_documento = ?',
    'nombre_completo = ?',
    'rol_id = ?',
    'tipo_usuario = ?',
    'telefono = ?',
    'regional_id = ?',
    'centro_id = ?',
    'dependencia_id = ?',
  ];
  const params = [
    (scoped.email || existing.email).trim().toLowerCase(),
    (scoped.documento || existing.documento).trim(),
    scoped.tipoDocumento || existing.tipoDocumento,
    nombreCompleto,
    rolId,
    tipoUsuario,
    scoped.telefono !== undefined ? scoped.telefono?.trim() || null : existing.telefono,
    scoped.regionalId,
    scoped.centroId,
    scoped.dependenciaId,
  ];

  if (scoped.estado) {
    fields.push('estado = ?');
    params.push(scoped.estado);
    if (scoped.estado === 'INACTIVO') {
      fields.push('deactivated_at = NOW()');
    } else if (scoped.estado === 'ACTIVO') {
      fields.push('deactivated_at = NULL');
    }
  }

  if (scoped.fotoUrl !== undefined) {
    fields.push('foto_url = ?');
    params.push(scoped.fotoUrl);
  }

  if (scoped.password) {
    fields.push('password_hash = ?');
    params.push(await bcrypt.hash(scoped.password, 12));
  }

  await usersRepository.updateUser(id, fields, params);
  return getById(id, actor);
}

async function deactivate(id, actor = null) {
  const existing = await getById(id, actor);
  if (!existing) throw createAppError('Usuario no encontrado', 404);
  if (existing.estado === 'INACTIVO') {
    throw createAppError('El usuario ya está inactivo', 400);
  }

  await usersRepository.setEstadoInactivo(id);
  return getById(id, actor);
}

async function reactivate(id, actor = null) {
  const existing = await getById(id, actor);
  if (!existing) throw createAppError('Usuario no encontrado', 404);
  if (existing.estado === 'ACTIVO') {
    throw createAppError('El usuario ya está activo', 400);
  }

  await usersRepository.setEstadoActivo(id);
  return getById(id, actor);
}

module.exports = {
  list,
  getById,
  create,
  update,
  deactivate,
  reactivate,
  formatUser,
};
