const sesionesService = require('../services/sesiones.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession, logAudit } = require('../utils/auditHelper');

const list = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.usuarioId) filters.usuarioId = req.query.usuarioId;
  const data = await sesionesService.listActivas(filters);
  return res.json({ success: true, data });
});

const revoke = asyncHandler(async (req, res) => {
  const sessionId = await sesionesService.revokeSession(req.params.id);
  if (!sessionId) return res.status(404).json({ success: false, error: 'Sesión no encontrada' });

  await logAudit(req, {
    accion: 'REVOCAR_SESION',
    entidad: 'Sesion',
    entidadId: req.params.id,
    detalle: { sessionId },
    modulo: 'Autenticación',
  });

  return res.json({ success: true, message: 'Sesión cerrada remotamente' });
});

const misAccesos = asyncHandler(async (req, res) => {
  const data = await sesionesService.ultimosAccesos(actorFromSession(req).id);
  return res.json({ success: true, data });
});

module.exports = { list, revoke, misAccesos };
