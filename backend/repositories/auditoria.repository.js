/**
 * Consultas de bitácora — auditoría general y seguridad.
 */
const { query } = require('../config/database');
const { buildUserScope } = require('./dashboard.repository');
const { ROLES } = require('../constants');

function buildAuditoriaScope(actor) {
  if (!actor) return { clause: '', params: [] };

  if (actor.tipoUsuario === ROLES.APRENDIZ || actor.tipoUsuario === ROLES.CONTRATISTA) {
    return { clause: ' AND a.usuario_id = ?', params: [actor.id] };
  }

  if (actor.tipoUsuario === ROLES.COORDINADOR && actor.regionalId) {
    return {
      clause: ` AND (
        u.regional_id = ?
        OR a.usuario_id IS NULL
      )`,
      params: [actor.regionalId],
    };
  }

  if (actor.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    return {
      clause: ` AND (
        u.centro_id = ?
        OR a.usuario_id IS NULL
      )`,
      params: [actor.centroId],
    };
  }

  return { clause: '', params: [] };
}

function buildFilters(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.usuarioId) {
    conditions.push('a.usuario_id = ?');
    params.push(filters.usuarioId);
  }
  if (filters.rolNombre) {
    conditions.push('(a.rol_nombre = ? OR r.nombre = ?)');
    params.push(filters.rolNombre, filters.rolNombre);
  }
  if (filters.modulo) {
    conditions.push('(a.modulo = ? OR a.entidad = ?)');
    params.push(filters.modulo, filters.modulo);
  }
  if (filters.accion) {
    conditions.push('a.accion = ?');
    params.push(filters.accion);
  }
  if (filters.resultado) {
    conditions.push('a.resultado = ?');
    params.push(filters.resultado);
  }
  if (filters.ip) {
    conditions.push('a.ip LIKE ?');
    params.push(`%${filters.ip}%`);
  }
  if (filters.fechaDesde) {
    conditions.push('DATE(a.created_at) >= ?');
    params.push(filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    conditions.push('DATE(a.created_at) <= ?');
    params.push(filters.fechaHasta);
  }
  if (filters.search) {
    conditions.push(
      `(a.accion LIKE ? OR a.entidad LIKE ? OR u.nombre_completo LIKE ? OR u.email LIKE ? OR a.detalle_json LIKE ?)`
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term, term);
  }

  return {
    where: conditions.length ? ` AND ${conditions.join(' AND ')}` : '',
    params,
  };
}

async function insert(entry) {
  const { generateId } = require('../utils/helpers');
  const id = generateId();
  await query(
    `INSERT INTO auditoria (
       id, usuario_id, rol_nombre, accion, modulo, resultado,
       entidad, entidad_id, detalle_json, ip, user_agent
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.usuarioId || null,
      entry.rolNombre || null,
      entry.accion,
      entry.modulo || entry.entidad || null,
      entry.resultado || 'EXITO',
      entry.entidad,
      entry.entidadId || null,
      entry.detalle ? JSON.stringify(entry.detalle) : null,
      entry.ip || null,
      entry.userAgent || null,
    ]
  );
  return id;
}

async function count(filters, actor) {
  const scope = buildAuditoriaScope(actor);
  const f = buildFilters(filters);
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM auditoria a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN roles r ON r.id = u.rol_id
     WHERE 1=1 ${scope.clause} ${f.where}`,
    [...scope.params, ...f.params]
  );
  return Number(rows[0]?.total) || 0;
}

async function findMany(filters, actor, { limit, offset }) {
  const scope = buildAuditoriaScope(actor);
  const f = buildFilters(filters);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  return query(
    `SELECT
       a.id, a.usuario_id, a.rol_nombre, a.accion, a.modulo, a.resultado,
       a.entidad, a.entidad_id, a.detalle_json, a.ip, a.user_agent, a.created_at,
       COALESCE(u.nombre_completo, 'Sistema') AS usuario_nombre,
       COALESCE(u.email, '') AS usuario_email,
       COALESCE(r.nombre, a.rol_nombre) AS rol_nombre_actual
     FROM auditoria a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN roles r ON r.id = u.rol_id
     WHERE 1=1 ${scope.clause} ${f.where}
     ORDER BY a.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [...scope.params, ...f.params]
  );
}

async function getAccionesDistinct(actor) {
  const scope = buildAuditoriaScope(actor);
  return query(
    `SELECT DISTINCT a.accion FROM auditoria a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE 1=1 ${scope.clause}
     ORDER BY a.accion`,
    scope.params
  );
}

async function getModulosDistinct(actor) {
  const scope = buildAuditoriaScope(actor);
  return query(
    `SELECT DISTINCT COALESCE(a.modulo, a.entidad) AS modulo FROM auditoria a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE 1=1 ${scope.clause}
     ORDER BY modulo`,
    scope.params
  );
}

async function countSeguridadReciente(horas = 24) {
  try {
    const rows = await query(
      `SELECT COUNT(*) AS total FROM auditoria_seguridad
       WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [horas]
    );
    return Number(rows[0]?.total) || 0;
  } catch {
    return 0;
  }
}

async function findSeguridadReciente(limit = 20) {
  try {
    const safeLimit = Math.min(50, Math.max(5, parseInt(limit, 10) || 20));
    return await query(
      `SELECT s.id, s.tipo AS accion, s.usuario_id, s.ip, s.detalles, s.fecha_creacion AS created_at,
              u.nombre_completo AS usuario_nombre
       FROM auditoria_seguridad s
       LEFT JOIN usuarios u ON u.id = s.usuario_id
       ORDER BY s.fecha_creacion DESC
       LIMIT ${safeLimit}`
    );
  } catch {
    return [];
  }
}

module.exports = {
  insert,
  count,
  findMany,
  getAccionesDistinct,
  getModulosDistinct,
  countSeguridadReciente,
  findSeguridadReciente,
};
