const { query } = require('../config/database');

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('d.nombre LIKE ?');
    params.push(`%${filters.search}%`);
  }
  if (filters.centroId) {
    conditions.push('d.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.regionalId) {
    conditions.push('c.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.activo !== undefined && filters.activo !== '') {
    conditions.push('d.activo = ?');
    params.push(filters.activo === '1' || filters.activo === 1 || filters.activo === true ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function count(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM dependencias d
     INNER JOIN centros_formacion c ON c.id = d.centro_id
     ${where}`,
    params
  );
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT d.id, d.nombre, d.centro_id, d.activo, d.created_at, d.updated_at,
            c.nombre AS centro_nombre, c.codigo AS centro_codigo,
            r.id AS regional_id, r.nombre AS regional_nombre
     FROM dependencias d
     INNER JOIN centros_formacion c ON c.id = d.centro_id
     INNER JOIN regionales r ON r.id = c.regional_id
     ${where}
     ORDER BY d.nombre ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT d.id, d.nombre, d.centro_id, d.activo, d.created_at, d.updated_at,
            c.nombre AS centro_nombre, r.id AS regional_id, r.nombre AS regional_nombre
     FROM dependencias d
     INNER JOIN centros_formacion c ON c.id = d.centro_id
     INNER JOIN regionales r ON r.id = c.regional_id
     WHERE d.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function nombreExistsEnCentro(nombre, centroId, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM dependencias WHERE nombre = ? AND centro_id = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM dependencias WHERE nombre = ? AND centro_id = ? LIMIT 1';
  const params = excludeId ? [nombre, centroId, excludeId] : [nombre, centroId];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countUsuariosActivos(centroId) {
  const rows = await query(
    `SELECT COUNT(*) AS total FROM usuarios
     WHERE dependencia_id IN (SELECT id FROM dependencias WHERE centro_id = ?)
       AND estado = 'ACTIVO'`,
    [centroId]
  );
  return rows[0]?.total || 0;
}

async function countUsuariosActivosPorDependencia(dependenciaId) {
  const rows = await query(
    "SELECT COUNT(*) AS total FROM usuarios WHERE dependencia_id = ? AND estado = 'ACTIVO'",
    [dependenciaId]
  );
  return rows[0]?.total || 0;
}

async function insert(data) {
  await query(
    'INSERT INTO dependencias (id, centro_id, nombre, activo) VALUES (?, ?, ?, ?)',
    data
  );
}

async function update(id, fields, params) {
  await query(`UPDATE dependencias SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setActivo(id, activo) {
  await query('UPDATE dependencias SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

module.exports = {
  count,
  findMany,
  findById,
  nombreExistsEnCentro,
  countUsuariosActivosPorDependencia,
  insert,
  update,
  setActivo,
};
