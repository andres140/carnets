const { query } = require('../config/database');

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(c.codigo LIKE ? OR c.nombre LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }
  if (filters.regionalId) {
    conditions.push('c.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.activo !== undefined && filters.activo !== '') {
    conditions.push('c.activo = ?');
    params.push(filters.activo === '1' || filters.activo === 1 || filters.activo === true ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function count(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(
    `SELECT COUNT(*) AS total FROM centros_formacion c ${where}`,
    params
  );
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT c.id, c.codigo, c.nombre, c.regional_id, c.activo, c.created_at, c.updated_at,
            r.nombre AS regional_nombre, r.codigo AS regional_codigo
     FROM centros_formacion c
     INNER JOIN regionales r ON r.id = c.regional_id
     ${where}
     ORDER BY c.nombre ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT c.id, c.codigo, c.nombre, c.regional_id, c.activo, c.created_at, c.updated_at,
            r.nombre AS regional_nombre
     FROM centros_formacion c
     INNER JOIN regionales r ON r.id = c.regional_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function codigoExists(codigo, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM centros_formacion WHERE codigo = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM centros_formacion WHERE codigo = ? LIMIT 1';
  const params = excludeId ? [codigo, excludeId] : [codigo];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countDependenciasActivas(centroId) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM dependencias WHERE centro_id = ? AND activo = 1',
    [centroId]
  );
  return rows[0]?.total || 0;
}

async function insert(data) {
  await query(
    'INSERT INTO centros_formacion (id, regional_id, codigo, nombre, activo) VALUES (?, ?, ?, ?, ?)',
    data
  );
}

async function update(id, fields, params) {
  await query(`UPDATE centros_formacion SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setActivo(id, activo) {
  await query('UPDATE centros_formacion SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

module.exports = {
  count,
  findMany,
  findById,
  codigoExists,
  countDependenciasActivas,
  insert,
  update,
  setActivo,
};
