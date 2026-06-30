const regionalesService = require('../services/regionales.service');
const centrosService = require('../services/centros.service');
const dependenciasService = require('../services/dependencias.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { logAudit } = require('../utils/auditHelper');
const { computeEntityChanges } = require('../utils/diff');

const REGIONAL_FIELDS = ['codigo', 'nombre', 'estado'];
const CENTRO_FIELDS = ['codigo', 'nombre', 'regionalId', 'estado'];
const DEPENDENCIA_FIELDS = ['nombre', 'centroId', 'estado'];

// --- Regionales ---

const listRegionales = asyncHandler(async (req, res) => {
  const result = await regionalesService.list({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    activo: req.query.activo,
  });
  return res.json({ success: true, data: result });
});

const getRegional = asyncHandler(async (req, res) => {
  const item = await regionalesService.getById(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Regional no encontrada' });
  return res.json({ success: true, data: item });
});

const createRegional = asyncHandler(async (req, res) => {
  const item = await regionalesService.create(req.body);
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Regional',
    entidadId: item.id,
    detalle: { codigo: item.codigo, nombre: item.nombre },
  });
  return res.status(201).json({ success: true, data: item, message: 'Regional creada correctamente' });
});

const updateRegional = asyncHandler(async (req, res) => {
  const before = await regionalesService.getById(req.params.id);
  if (!before) return res.status(404).json({ success: false, error: 'Regional no encontrada' });
  const item = await regionalesService.update(req.params.id, req.body);
  const cambios = computeEntityChanges(before, item, REGIONAL_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Regional',
    entidadId: item.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: item, message: 'Regional actualizada correctamente' });
});

const deactivateRegional = asyncHandler(async (req, res) => {
  const item = await regionalesService.deactivate(req.params.id);
  await logAudit(req, {
    accion: 'DESACTIVAR',
    entidad: 'Regional',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Regional desactivada correctamente' });
});

const reactivateRegional = asyncHandler(async (req, res) => {
  const item = await regionalesService.reactivate(req.params.id);
  await logAudit(req, {
    accion: 'REACTIVAR',
    entidad: 'Regional',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Regional reactivada correctamente' });
});

// --- Centros ---

const listCentros = asyncHandler(async (req, res) => {
  const result = await centrosService.list({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    regionalId: req.query.regionalId,
    activo: req.query.activo,
  });
  return res.json({ success: true, data: result });
});

const getCentro = asyncHandler(async (req, res) => {
  const item = await centrosService.getById(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Centro no encontrado' });
  return res.json({ success: true, data: item });
});

const createCentro = asyncHandler(async (req, res) => {
  const item = await centrosService.create(req.body);
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Centro',
    entidadId: item.id,
    detalle: { codigo: item.codigo, nombre: item.nombre, regionalId: item.regionalId },
  });
  return res.status(201).json({ success: true, data: item, message: 'Centro creado correctamente' });
});

const updateCentro = asyncHandler(async (req, res) => {
  const before = await centrosService.getById(req.params.id);
  if (!before) return res.status(404).json({ success: false, error: 'Centro no encontrado' });
  const item = await centrosService.update(req.params.id, req.body);
  const cambios = computeEntityChanges(before, item, CENTRO_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Centro',
    entidadId: item.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: item, message: 'Centro actualizado correctamente' });
});

const deactivateCentro = asyncHandler(async (req, res) => {
  const item = await centrosService.deactivate(req.params.id);
  await logAudit(req, {
    accion: 'DESACTIVAR',
    entidad: 'Centro',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Centro desactivado correctamente' });
});

const reactivateCentro = asyncHandler(async (req, res) => {
  const item = await centrosService.reactivate(req.params.id);
  await logAudit(req, {
    accion: 'REACTIVAR',
    entidad: 'Centro',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Centro reactivado correctamente' });
});

// --- Dependencias ---

const listDependencias = asyncHandler(async (req, res) => {
  const result = await dependenciasService.list({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    centroId: req.query.centroId,
    regionalId: req.query.regionalId,
    activo: req.query.activo,
  });
  return res.json({ success: true, data: result });
});

const getDependencia = asyncHandler(async (req, res) => {
  const item = await dependenciasService.getById(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Dependencia no encontrada' });
  return res.json({ success: true, data: item });
});

const createDependencia = asyncHandler(async (req, res) => {
  const item = await dependenciasService.create(req.body);
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Dependencia',
    entidadId: item.id,
    detalle: { nombre: item.nombre, centroId: item.centroId },
  });
  return res.status(201).json({ success: true, data: item, message: 'Dependencia creada correctamente' });
});

const updateDependencia = asyncHandler(async (req, res) => {
  const before = await dependenciasService.getById(req.params.id);
  if (!before) return res.status(404).json({ success: false, error: 'Dependencia no encontrada' });
  const item = await dependenciasService.update(req.params.id, req.body);
  const cambios = computeEntityChanges(before, item, DEPENDENCIA_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Dependencia',
    entidadId: item.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: item, message: 'Dependencia actualizada correctamente' });
});

const deactivateDependencia = asyncHandler(async (req, res) => {
  const item = await dependenciasService.deactivate(req.params.id);
  await logAudit(req, {
    accion: 'DESACTIVAR',
    entidad: 'Dependencia',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Dependencia desactivada correctamente' });
});

const reactivateDependencia = asyncHandler(async (req, res) => {
  const item = await dependenciasService.reactivate(req.params.id);
  await logAudit(req, {
    accion: 'REACTIVAR',
    entidad: 'Dependencia',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Dependencia reactivada correctamente' });
});

module.exports = {
  listRegionales,
  getRegional,
  createRegional,
  updateRegional,
  deactivateRegional,
  reactivateRegional,
  listCentros,
  getCentro,
  createCentro,
  updateCentro,
  deactivateCentro,
  reactivateCentro,
  listDependencias,
  getDependencia,
  createDependencia,
  updateDependencia,
  deactivateDependencia,
  reactivateDependencia,
};
