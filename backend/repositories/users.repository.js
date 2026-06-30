/**
 * Acceso a datos — usuarios (capa Repository).
 * Solo consultas SQL parametrizadas; sin lógica de negocio.
 */
const { query } = require('../config/database');

const USER_SELECT = `
  u.id, u.email, u.documento, u.tipo_documento, u.nombre_completo,
  u.foto_url, u.telefono, u.estado, u.tipo_usuario,
  u.rol_id, u.regional_id, u.centro_id, u.dependencia_id,
  u.created_at, u.updated_at, u.deactivated_at,
  r.nombre AS rol_nombre,
  reg.nombre AS regional_nombre,
  c.nombre AS centro_nombre,
  d.nombre AS dependencia_nombre
`;

const USER_FROM = `
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.rol_id
  LEFT JOIN regionales reg ON reg.id = u.regional_id
  LEFT JOIN centros_formacion c ON c.id = u.centro_id
  LEFT JOIN dependencias d ON d.id = u.dependencia_id
`;

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.documento) {
    conditions.push('u.documento LIKE ?');
    params.push(`%${filters.documento}%`);
  }
  if (filters.nombre) {
    conditions.push('u.nombre_completo LIKE ?');
    params.push(`%${filters.nombre}%`);
  }
  if (filters.email) {
    conditions.push('u.email LIKE ?');
    params.push(`%${filters.email}%`);
  }
  if (filters.rolId) {
    conditions.push('u.rol_id = ?');
    params.push(filters.rolId);
  }
  if (filters.estado) {
    conditions.push('u.estado = ?');
    params.push(filters.estado);
  }
  if (filters.regionalId) {
    conditions.push('u.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push('u.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.dependenciaId) {
    conditions.push('u.dependencia_id = ?');
    params.push(filters.dependenciaId);
  }
  if (filters.tipoUsuario) {
    conditions.push('u.tipo_usuario = ?');
    params.push(filters.tipoUsuario);
  }
  if (filters.search) {
    conditions.push('(u.documento LIKE ? OR u.nombre_completo LIKE ? OR u.email LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function countUsers(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(`SELECT COUNT(*) AS total FROM usuarios u ${where}`, params);
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  const rows = await query(
    `SELECT ${USER_SELECT} ${USER_FROM} ${where}
     ORDER BY u.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return rows;
}

async function findById(id) {
  const rows = await query(
    `SELECT ${USER_SELECT} ${USER_FROM} WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function emailExists(email, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM usuarios WHERE email = ? LIMIT 1';
  const params = excludeId ? [email, excludeId] : [email];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function documentoExists(documento, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM usuarios WHERE documento = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM usuarios WHERE documento = ? LIMIT 1';
  const params = excludeId ? [documento, excludeId] : [documento];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function findRolById(rolId) {
  const rows = await query('SELECT id, nombre, activo FROM roles WHERE id = ? LIMIT 1', [rolId]);
  return rows[0] || null;
}

async function findRegionalById(regionalId) {
  const rows = await query(
    'SELECT id FROM regionales WHERE id = ? AND activo = 1 LIMIT 1',
    [regionalId]
  );
  return rows[0] || null;
}

async function findCentroById(centroId) {
  const rows = await query(
    'SELECT id, regional_id FROM centros_formacion WHERE id = ? AND activo = 1 LIMIT 1',
    [centroId]
  );
  return rows[0] || null;
}

async function findDependenciaById(dependenciaId) {
  const rows = await query(
    'SELECT id, centro_id FROM dependencias WHERE id = ? AND activo = 1 LIMIT 1',
    [dependenciaId]
  );
  return rows[0] || null;
}

async function insertUser(data) {
  await query(
    `INSERT INTO usuarios (
      id, email, password_hash, rol_id, tipo_usuario, estado,
      documento, tipo_documento, nombre_completo, foto_url,
      regional_id, centro_id, dependencia_id, telefono
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data
  );
}

async function updateUser(id, fields, params) {
  await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setEstadoInactivo(id) {
  await query(`UPDATE usuarios SET estado = 'INACTIVO', deactivated_at = NOW() WHERE id = ?`, [id]);
}

async function setEstadoActivo(id) {
  await query(`UPDATE usuarios SET estado = 'ACTIVO', deactivated_at = NULL WHERE id = ?`, [id]);
}

module.exports = {
  findMany,
  countUsers,
  findById,
  emailExists,
  documentoExists,
  findRolById,
  findRegionalById,
  findCentroById,
  findDependenciaById,
  insertUser,
  updateUser,
  setEstadoInactivo,
  setEstadoActivo,
};
