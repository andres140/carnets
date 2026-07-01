const { query } = require('../config/database');

async function getAll() {
  const rows = await query(
    `SELECT clave, valor, tipo, descripcion, updated_at, updated_by FROM configuracion_sistema ORDER BY clave`
  );
  return rows;
}

async function getByClave(clave) {
  const rows = await query('SELECT * FROM configuracion_sistema WHERE clave = ? LIMIT 1', [clave]);
  return rows[0] || null;
}

async function upsert(clave, valor, updatedBy, tipo = 'string') {
  await query(
    `INSERT INTO configuracion_sistema (clave, valor, tipo, updated_by)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor), updated_by = VALUES(updated_by), updated_at = NOW()`,
    [clave, String(valor), tipo, updatedBy || null]
  );
}

module.exports = { getAll, getByClave, upsert };
