const { query } = require('../config/database');
const { generateId } = require('../utils/helpers');

async function create(entry) {
  const id = generateId();
  await query(
    `INSERT INTO notificaciones (id, usuario_id, tipo, titulo, mensaje, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.usuarioId || null,
      entry.tipo,
      entry.titulo,
      entry.mensaje,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ]
  );
  return id;
}

async function countUnread(usuarioId) {
  const rows = await query(
    `SELECT COUNT(*) AS total FROM notificaciones
     WHERE leida = 0 AND (usuario_id = ? OR usuario_id IS NULL)`,
    [usuarioId]
  );
  return Number(rows[0]?.total) || 0;
}

async function findForUser(usuarioId, { limit, offset, soloNoLeidas = false }) {
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
  const leidaClause = soloNoLeidas ? ' AND leida = 0' : '';

  return query(
    `SELECT * FROM notificaciones
     WHERE (usuario_id = ? OR usuario_id IS NULL) ${leidaClause}
     ORDER BY created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [usuarioId]
  );
}

async function markRead(id, usuarioId) {
  const result = await query(
    `UPDATE notificaciones SET leida = 1
     WHERE id = ? AND (usuario_id = ? OR usuario_id IS NULL)`,
    [id, usuarioId]
  );
  return result.affectedRows > 0;
}

async function markAllRead(usuarioId) {
  await query(
    `UPDATE notificaciones SET leida = 1
     WHERE leida = 0 AND (usuario_id = ? OR usuario_id IS NULL)`,
    [usuarioId]
  );
}

async function existsRecent(tipo, usuarioId, horas = 24) {
  const rows = await query(
    `SELECT id FROM notificaciones
     WHERE tipo = ? AND (usuario_id = ? OR (? IS NULL AND usuario_id IS NULL))
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
     LIMIT 1`,
    [tipo, usuarioId, usuarioId, horas]
  );
  return rows.length > 0;
}

module.exports = {
  create,
  countUnread,
  findForUser,
  markRead,
  markAllRead,
  existsRecent,
};
