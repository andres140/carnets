const auditoriaService = require('../services/auditoria.service');
const { getClientIp } = require('./request');

async function logAudit(req, { accion, entidad, entidadId, detalle = null }) {
  if (!req.session?.user?.id) return;

  await auditoriaService.log({
    usuarioId: req.session.user.id,
    accion,
    entidad,
    entidadId,
    detalle,
    ip: getClientIp(req),
  });
}

function actorFromSession(req) {
  return req.session?.user || null;
}

module.exports = { logAudit, actorFromSession };
