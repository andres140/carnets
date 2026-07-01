const auditoriaService = require('../services/auditoria.service');
const { getClientIp, getUserAgent } = require('./request');

async function logAudit(req, { accion, entidad, entidadId, detalle = null, modulo = null, resultado = 'EXITO' }) {
  const user = req.session?.user;

  await auditoriaService.log({
    usuarioId: user?.id || null,
    rolNombre: user?.rolNombre || null,
    accion,
    entidad,
    entidadId,
    detalle,
    modulo,
    resultado,
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

function actorFromSession(req) {
  return req.session?.user || null;
}

module.exports = { logAudit, actorFromSession };
