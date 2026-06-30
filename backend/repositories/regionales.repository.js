const { query } = require('../config/database');

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(r.codigo LIKE ? OR r.nombre LIKE ?)');
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
  const rows = await query(`SELECT COUNT(*) AS total FROM regionales r ${where}`, params);
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT r.id, r.codigo, r.nombre, r.activo, r.created_at, r.updated_at
     FROM regionales r ${where}
     ORDER BY r.nombre ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT id, codigo, nombre, activo, created_at, updated_at
     FROM regionales WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function codigoExists(codigo, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM regionales WHERE codigo = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM regionales WHERE codigo = ? LIMIT 1';
  const params = excludeId ? [codigo, excludeId] : [codigo];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countCentrosActivos(regionalId) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM centros_formacion WHERE regional_id = ? AND activo = 1',
    [regionalId]
  );
  return rows[0]?.total || 0;
}

async function insert(data) {
  await query(
    'INSERT INTO regionales (id, codigo, nombre, activo) VALUES (?, ?, ?, ?)',
    data
  );
}

async function update(id, fields, params) {
  await query(`UPDATE regionales SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setActivo(id, activo) {
  await query('UPDATE regionales SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

module.exports = {
  count,
  findMany,
  findById,
  codigoExists,
  countCentrosActivos,
  insert,
  update,
  setActivo,
};
