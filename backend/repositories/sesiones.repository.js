const { query } = require('../config/database');
const { generateId } = require('../utils/helpers');

async function register({ usuarioId, sessionId, ip, userAgent, deviceLabel }) {
  const id = generateId();
  await query(
    `INSERT INTO sesiones_usuario (id, usuario_id, session_id, ip, user_agent, device_label)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, usuarioId, sessionId, ip || null, userAgent || null, deviceLabel || null]
  );
  return id;
}

async function touch(sessionId) {
  await query(
    `UPDATE sesiones_usuario SET last_activity = NOW()
     WHERE session_id = ? AND activa = 1`,
    [sessionId]
  );
}

async function closeBySessionId(sessionId) {
  await query(
    `UPDATE sesiones_usuario SET activa = 0, closed_at = NOW()
     WHERE session_id = ? AND activa = 1`,
    [sessionId]
  );
}

async function revoke(id) {
  const rows = await query('SELECT session_id FROM sesiones_usuario WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  await query(
    `UPDATE sesiones_usuario SET activa = 0, closed_at = NOW() WHERE id = ?`,
    [id]
  );
  return rows[0].session_id;
}

async function isActive(sessionId) {
  const rows = await query(
    'SELECT activa FROM sesiones_usuario WHERE session_id = ? LIMIT 1',
    [sessionId]
  );
  if (!rows.length) return true;
  return rows[0].activa === 1;
}

async function findActivas(filters = {}) {
  const conditions = ['s.activa = 1'];
  const params = [];

  if (filters.usuarioId) {
    conditions.push('s.usuario_id = ?');
    params.push(filters.usuarioId);
  }

  return query(
    `SELECT s.*, u.nombre_completo, u.email, r.nombre AS rol_nombre
     FROM sesiones_usuario s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.last_activity DESC
     LIMIT 100`,
    params
  );
}

async function findUltimosAccesos(usuarioId, limit = 10) {
  const safeLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));
  return query(
    `SELECT s.*, u.nombre_completo
     FROM sesiones_usuario s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.usuario_id = ?
     ORDER BY s.created_at DESC
     LIMIT ${safeLimit}`,
    [usuarioId]
  );
}

async function countActivas() {
  const rows = await query('SELECT COUNT(*) AS total FROM sesiones_usuario WHERE activa = 1');
  return Number(rows[0]?.total) || 0;
}

module.exports = {
  register,
  touch,
  closeBySessionId,
  revoke,
  isActive,
  findActivas,
  findUltimosAccesos,
  countActivas,
};
