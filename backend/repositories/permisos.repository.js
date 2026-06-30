const { query } = require('../config/database');

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(p.codigo LIKE ? OR p.nombre LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function count(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(`SELECT COUNT(*) AS total FROM permisos p ${where}`, params);
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT p.id, p.codigo, p.nombre, p.created_at,
            (SELECT COUNT(*) FROM rol_permisos rp WHERE rp.permiso_id = p.id) AS roles_count
     FROM permisos p ${where}
     ORDER BY p.codigo ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findAll() {
  return query('SELECT id, codigo, nombre FROM permisos ORDER BY codigo');
}

async function findById(id) {
  const rows = await query(
    'SELECT id, codigo, nombre, created_at FROM permisos WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function codigoExists(codigo, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM permisos WHERE codigo = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM permisos WHERE codigo = ? LIMIT 1';
  const params = excludeId ? [codigo, excludeId] : [codigo];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countRolesAsignados(permisoId) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM rol_permisos WHERE permiso_id = ?',
    [permisoId]
  );
  return rows[0]?.total || 0;
}

async function insert(data) {
  await query('INSERT INTO permisos (id, codigo, nombre) VALUES (?, ?, ?)', data);
}

async function update(id, fields, params) {
  await query(`UPDATE permisos SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function findByIds(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return query(`SELECT id FROM permisos WHERE id IN (${placeholders})`, ids);
}

module.exports = {
  count,
  findMany,
  findAll,
  findById,
  codigoExists,
  countRolesAsignados,
  insert,
  update,
  findByIds,
};
