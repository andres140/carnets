const { query } = require('../config/database');

async function insert(data) {
  await query(
    `INSERT INTO carnet_documentos_historial (id, carnet_id, accion, usuario_id, detalle_json)
     VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.carnetId, data.accion, data.usuarioId, data.detalle ? JSON.stringify(data.detalle) : null]
  );
}

async function findByCarnetId(carnetId) {
  return query(
    `SELECT h.id, h.accion, h.detalle_json, h.created_at,
            u.nombre_completo AS usuario_nombre
     FROM carnet_documentos_historial h
     INNER JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.carnet_id = ?
     ORDER BY h.created_at DESC`,
    [carnetId]
  );
}

async function getResumen(carnetId) {
  const rows = await query(
    `SELECT
       MIN(CASE WHEN accion = 'GENERAR' THEN created_at END) AS fecha_generacion,
       MAX(CASE WHEN accion = 'DESCARGAR' THEN created_at END) AS fecha_descarga,
       MAX(CASE WHEN accion IN ('IMPRIMIR','REIMPRIMIR') THEN created_at END) AS fecha_impresion,
       SUM(CASE WHEN accion = 'REIMPRIMIR' THEN 1 ELSE 0 END) AS reimpresiones
     FROM carnet_documentos_historial
     WHERE carnet_id = ?`,
    [carnetId]
  );
  return rows[0] || null;
}

module.exports = { insert, findByCarnetId, getResumen };
