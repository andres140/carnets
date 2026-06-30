const catalogService = require('../services/catalog.service');
const { asyncHandler } = require('../utils/asyncHandler');

const getRoles = asyncHandler(async (_req, res) => {
  const roles = await catalogService.getRoles();
  return res.json({ success: true, data: roles });
});

const getRegionales = asyncHandler(async (_req, res) => {
  const regionales = await catalogService.getRegionales();
  return res.json({ success: true, data: regionales });
});

const getCentros = asyncHandler(async (req, res) => {
  const centros = await catalogService.getCentros(req.query.regionalId);
  return res.json({ success: true, data: centros });
});

const getDependencias = asyncHandler(async (req, res) => {
  const dependencias = await catalogService.getDependencias(req.query.centroId);
  return res.json({ success: true, data: dependencias });
});

module.exports = {
  getRoles,
  getRegionales,
  getCentros,
  getDependencias,
};
