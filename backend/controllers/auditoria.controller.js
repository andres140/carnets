const auditoriaService = require('../services/auditoria.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession } = require('../utils/auditHelper');

const list = asyncHandler(async (req, res) => {
  const data = await auditoriaService.list(req.query, actorFromSession(req));
  return res.json({ success: true, data });
});

const seguridad = asyncHandler(async (req, res) => {
  const data = await auditoriaService.getSeguridadReciente();
  return res.json({ success: true, data });
});

module.exports = { list, seguridad };
