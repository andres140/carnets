const { query } = require('../config/database');

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(r.nombre LIKE ? OR r.descripcion LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }
  if (filters.activo !== undefined && filters.activo !== '') {
    conditions.push('r.activo = ?');
    params.push(filters.activo === '1' || filters.activo === 1 || filters.activo === true ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function count(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(`SELECT COUNT(*) AS total FROM roles r ${where}`, params);
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT r.id, r.nombre, r.descripcion, r.activo, r.created_at, r.updated_at,
            (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS usuarios_count
     FROM roles r ${where}
     ORDER BY r.nombre ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT id, nombre, descripcion, activo, created_at, updated_at
     FROM roles WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function nombreExists(nombre, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM roles WHERE nombre = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM roles WHERE nombre = ? LIMIT 1';
  const params = excludeId ? [nombre, excludeId] : [nombre];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countUsuarios(rolId) {
  const rows = await query('SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = ?', [rolId]);
  return rows[0]?.total || 0;
}

async function getPermisosByRolId(rolId) {
  return query(
    `SELECT p.id, p.codigo, p.nombre
     FROM permisos p
     INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = ?
     ORDER BY p.codigo`,
    [rolId]
  );
}

async function insert(data) {
  await query(
    'INSERT INTO roles (id, nombre, descripcion, activo) VALUES (?, ?, ?, ?)',
    data
  );
}

async function update(id, fields, params) {
  await query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setActivo(id, activo) {
  await query('UPDATE roles SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

async function replacePermisos(rolId, permisoIds) {
  await query('DELETE FROM rol_permisos WHERE rol_id = ?', [rolId]);
  if (!permisoIds.length) return;

  const placeholders = permisoIds.map(() => '(?, ?)').join(', ');
  const params = permisoIds.flatMap((pid) => [rolId, pid]);
  await query(`INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${placeholders}`, params);
}

module.exports = {
  count,
  findMany,
  findById,
  nombreExists,
  countUsuarios,
  getPermisosByRolId,
  insert,
  update,
  setActivo,
  replacePermisos,
};
