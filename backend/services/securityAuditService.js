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
    const sql = `
      INSERT INTO auditoria_seguridad (tipo, usuario_id, ip, detalles, fecha_creacion)
      VALUES (?, ?, ?, ?, NOW())
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [tipo, usuarioId || null, ip, JSON.stringify(detalles || {})], (err, result) => {
        if (err) {
          console.error('Error registrando evento de seguridad:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (err) {
    console.error('Error en logSecurityEvent:', err);
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

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
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

    return new Promise((resolve, reject) => {
      db.query(sql, [ip, tipo, timeWindowMinutes], (err, results) => {
        if (err) {
          reject(err);
        } else {
          const count = results[0]?.count || 0;
          resolve(count);
        }
      });
    });
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
