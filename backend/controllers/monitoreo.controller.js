const monitoreoService = require('../services/monitoreo.service');
const { asyncHandler } = require('../utils/asyncHandler');

const estado = asyncHandler(async (req, res) => {
  const data = await monitoreoService.getEstado();
  return res.json({ success: true, data });
});

const seguridad = asyncHandler(async (req, res) => {
  const data = await monitoreoService.getDiagnosticoSeguridad();
  return res.json({ success: true, data });
});

module.exports = { estado, seguridad };
