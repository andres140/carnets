const notificacionesService = require('../services/notificaciones.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession } = require('../utils/auditHelper');

const list = asyncHandler(async (req, res) => {
  const actor = actorFromSession(req);
  await notificacionesService.generateSystemAlerts(actor);
  const data = await notificacionesService.listForUser(actor.id, req.query);
  return res.json({ success: true, data });
});

const markRead = asyncHandler(async (req, res) => {
  const actor = actorFromSession(req);
  const ok = await notificacionesService.markRead(req.params.id, actor.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
  return res.json({ success: true, message: 'Marcada como leída' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificacionesService.markAllRead(actorFromSession(req).id);
  return res.json({ success: true, message: 'Todas marcadas como leídas' });
});

module.exports = { list, markRead, markAllRead };
