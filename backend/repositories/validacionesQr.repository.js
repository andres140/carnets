const { query } = require('../config/database');

async function insert(data) {
  await query(
    `INSERT INTO validaciones_qr (id, carnet_id, token_intentado, ip, resultado, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.carnetId || null,
      data.tokenIntentado || null,
      data.ip || null,
      data.resultado,
      data.usuarioId || null,
    ]
  );
}

async function countByResultado(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.desde) {
    conditions.push('created_at >= ?');
    params.push(filters.desde);
  }
  if (filters.hasta) {
    conditions.push('created_at <= ?');
    params.push(filters.hasta);
  }
  if (filters.regionalId) {
    conditions.push(
      `carnet_id IN (
        SELECT c.id FROM carnets c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE u.regional_id = ?
      )`
    );
    params.push(filters.regionalId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return query(
    `SELECT resultado, COUNT(*) AS total
     FROM validaciones_qr
     ${where}
     GROUP BY resultado`,
    params
  );
}

async function countToday(filters = {}) {
  const conditions = ['DATE(created_at) = CURDATE()'];
  const params = [];

  if (filters.regionalId) {
    conditions.push(
      `(carnet_id IS NULL OR carnet_id IN (
        SELECT c.id FROM carnets c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE u.regional_id = ?
      ))`
    );
    params.push(filters.regionalId);
  }

  const rows = await query(
    `SELECT COUNT(*) AS total FROM validaciones_qr WHERE ${conditions.join(' AND ')}`,
    params
  );
  return rows[0]?.total || 0;
}

async function countFailedToday(filters = {}) {
  const conditions = [
    "DATE(created_at) = CURDATE()",
    "resultado IN ('TOKEN_INVALIDO','NO_ENCONTRADO','MANIPULADO')",
  ];
  const params = [];

  if (filters.regionalId) {
    conditions.push(
      `(carnet_id IS NULL OR carnet_id IN (
        SELECT c.id FROM carnets c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE u.regional_id = ?
      ))`
    );
    params.push(filters.regionalId);
  }

  const rows = await query(
    `SELECT COUNT(*) AS total FROM validaciones_qr WHERE ${conditions.join(' AND ')}`,
    params
  );
  return rows[0]?.total || 0;
}

async function findRecent(limit = 10, filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.regionalId) {
    conditions.push('uc.regional_id = ?');
    params.push(filters.regionalId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  return query(
    `SELECT v.id, v.resultado, v.ip, v.created_at,
            c.codigo_unico, c.nombre_completo,
            uv.nombre_completo AS usuario_nombre
     FROM validaciones_qr v
     LEFT JOIN carnets c ON c.id = v.carnet_id
     LEFT JOIN usuarios uc ON uc.id = c.usuario_id
     LEFT JOIN usuarios uv ON uv.id = v.usuario_id
     ${where}
     ORDER BY v.created_at DESC
     LIMIT ${safeLimit}`,
    params
  );
}

module.exports = {
  insert,
  countByResultado,
  countToday,
  countFailedToday,
  findRecent,
};
