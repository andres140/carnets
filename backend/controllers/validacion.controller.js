const validacionService = require('../services/validacion.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { getClientIp } = require('../utils/request');
const { actorFromSession } = require('../utils/auditHelper');

const validar = asyncHandler(async (req, res) => {
  const token = req.params.token || req.query.token;
  const actor = actorFromSession(req);
  const result = await validacionService.validarToken(token, {
    ip: getClientIp(req),
    usuarioId: actor?.id,
  });

  return res.json({ success: true, data: result });
});

module.exports = { validar };
