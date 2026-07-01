/**
 * backend/services/securityAuditService.js
 * Security event logging service
 */

const db = require('../config/database');

/**
 * Registrar evento de seguridad
 */
async function logSecurityEvent(event) {
  const {
    tipo, // 'RATE_LIMIT_EXCEEDED', 'CSRF_FAILED', 'PASSWORD_INVALID', 'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT'
    usuarioId,
    ip,
    detalles,
  } = event;

  try {
    const { randomUUID } = require('crypto');
    const sql = `
      INSERT INTO auditoria_seguridad (id, tipo, usuario_id, ip, detalles, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await db.query(sql, [
      randomUUID(),
      tipo,
      usuarioId || null,
      ip,
      JSON.stringify(detalles || {}),
    ]);
  } catch (err) {
    console.error('Error registrando evento de seguridad:', err);
    throw err;
  }
}

/**
 * Obtener eventos de seguridad
 */
async function getSecurityEvents(filters = {}) {
  const { tipo, usuarioId, ip, dias = 30 } = filters;

  try {
    let sql = 'SELECT * FROM auditoria_seguridad WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    const params = [dias];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (usuarioId) {
      sql += ' AND usuario_id = ?';
      params.push(usuarioId);
    }

    if (ip) {
      sql += ' AND ip = ?';
      params.push(ip);
    }

    sql += ' ORDER BY fecha_creacion DESC LIMIT 1000';

    return db.query(sql, params);
  } catch (err) {
    console.error('Error en getSecurityEvents:', err);
    throw err;
  }
}

/**
 * Detectar intentos sospechosos de la misma IP
 */
async function detectSuspiciousActivity(ip, tipo, timeWindowMinutes = 15) {
  try {
    const sql = `
      SELECT COUNT(*) as count FROM auditoria_seguridad
      WHERE ip = ? AND tipo = ? AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;

    const results = await db.query(sql, [ip, tipo, timeWindowMinutes]);
    return results[0]?.count || 0;
  } catch (err) {
    console.error('Error en detectSuspiciousActivity:', err);
    throw err;
  }
}

module.exports = {
  logSecurityEvent,
  getSecurityEvents,
  detectSuspiciousActivity,
};
