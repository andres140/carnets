const sesionesRepository = require('../repositories/sesiones.repository');

const revokedSessions = new Set();

function markRevoked(sessionId) {
  if (sessionId) revokedSessions.add(sessionId);
}

function isRevoked(sessionId) {
  return revokedSessions.has(sessionId);
}

async function registerLogin(req, user) {
  const { getClientIp, getUserAgent, parseDeviceLabel } = require('../utils/request');
  return sesionesRepository.register({
    usuarioId: user.id,
    sessionId: req.sessionID,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    deviceLabel: parseDeviceLabel(getUserAgent(req)),
  });
}

async function touch(req) {
  if (req.sessionID) await sesionesRepository.touch(req.sessionID);
}

async function closeSession(req) {
  if (req.sessionID) {
    await sesionesRepository.closeBySessionId(req.sessionID);
    revokedSessions.delete(req.sessionID);
  }
}

async function revokeSession(id) {
  const sessionId = await sesionesRepository.revoke(id);
  if (sessionId) markRevoked(sessionId);
  return sessionId;
}

async function validateSession(req) {
  if (!req.sessionID) return true;
  if (isRevoked(req.sessionID)) return false;
  return sesionesRepository.isActive(req.sessionID);
}

async function listActivas(filters) {
  const rows = await sesionesRepository.findActivas(filters);
  return rows.map((r) => ({
    id: r.id,
    usuarioId: r.usuario_id,
    usuarioNombre: r.nombre_completo,
    email: r.email,
    rolNombre: r.rol_nombre,
    ip: r.ip,
    userAgent: r.user_agent,
    deviceLabel: r.device_label,
    createdAt: r.created_at,
    lastActivity: r.last_activity,
    sessionId: r.session_id,
  }));
}

async function ultimosAccesos(usuarioId) {
  return sesionesRepository.findUltimosAccesos(usuarioId);
}

async function countActivas() {
  return sesionesRepository.countActivas();
}

module.exports = {
  registerLogin,
  touch,
  closeSession,
  revokeSession,
  validateSession,
  listActivas,
  ultimosAccesos,
  countActivas,
  markRevoked,
  isRevoked,
};
