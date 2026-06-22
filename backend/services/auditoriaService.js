const { query } = require('../config/database');
const { generateId } = require('../utils/helpers');

async function log(params) {
  const id = generateId();
  await query(
    `INSERT INTO auditoria (id, usuario_id, accion, entidad, entidad_id, detalle_json, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.usuarioId || null,
      params.accion,
      params.entidad,
      params.entidadId || null,
      params.detalle ? JSON.stringify(params.detalle) : null,
      params.ip || null,
    ]
  );
}

module.exports = { log };
