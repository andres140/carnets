const carnetsService = require('../services/carnets.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { logAudit, actorFromSession } = require('../utils/auditHelper');
const { computeEntityChanges } = require('../utils/diff');

const CARNET_FIELDS = [
  'fechaVencimiento',
  'fotoUrl',
  'nombreCompleto',
  'estado',
  'estadoResuelto',
];

const list = asyncHandler(async (req, res) => {
  const result = await carnetsService.list(
    {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      estado: req.query.estado,
      usuarioId: req.query.usuarioId,
      tipoUsuario: req.query.tipoUsuario,
    },
    actorFromSession(req)
  );
  return res.json({ success: true, data: result });
});

const preview = asyncHandler(async (req, res) => {
  const data = await carnetsService.preview(
    req.query.usuarioId,
    req.query.fechaVencimiento,
    actorFromSession(req)
  );
  return res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.getById(req.params.id, actorFromSession(req));
  if (!carnet) {
    return res.status(404).json({ success: false, error: 'Carné no encontrado' });
  }
  return res.json({ success: true, data: carnet });
});

const getHistorial = asyncHandler(async (req, res) => {
  const historial = await carnetsService.getHistorial(req.params.id, actorFromSession(req));
  return res.json({ success: true, data: historial });
});

const create = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.create(req.body, actorFromSession(req));
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: { codigoUnico: carnet.codigoUnico, usuarioId: carnet.usuarioId },
  });
  return res.status(201).json({
    success: true,
    data: carnet,
    message: 'Carné emitido correctamente',
  });
});

const update = asyncHandler(async (req, res) => {
  const before = await carnetsService.getById(req.params.id, actorFromSession(req));
  if (!before) return res.status(404).json({ success: false, error: 'Carné no encontrado' });

  const carnet = await carnetsService.update(req.params.id, req.body, actorFromSession(req));
  const cambios = computeEntityChanges(before, carnet, CARNET_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: carnet, message: 'Carné actualizado correctamente' });
});

const suspender = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.suspender(
    req.params.id,
    req.body?.motivo,
    actorFromSession(req)
  );
  await logAudit(req, {
    accion: 'SUSPENDER',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: { motivo: req.body?.motivo, estado: carnet.estado },
  });
  return res.json({ success: true, data: carnet, message: 'Carné suspendido correctamente' });
});

const revocar = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.revocar(
    req.params.id,
    req.body?.motivo,
    actorFromSession(req)
  );
  await logAudit(req, {
    accion: 'REVOCAR',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: { motivo: req.body?.motivo, estado: carnet.estado },
  });
  return res.json({ success: true, data: carnet, message: 'Carné revocado correctamente' });
});

const reactivar = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.reactivar(
    req.params.id,
    req.body?.motivo,
    actorFromSession(req)
  );
  await logAudit(req, {
    accion: 'REACTIVAR',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: { motivo: req.body?.motivo, estado: carnet.estado },
  });
  return res.json({ success: true, data: carnet, message: 'Carné reactivado correctamente' });
});

const renovar = asyncHandler(async (req, res) => {
  const carnet = await carnetsService.renovar(req.params.id, req.body || {}, actorFromSession(req));
  await logAudit(req, {
    accion: 'RENOVAR',
    entidad: 'Carnet',
    entidadId: carnet.id,
    detalle: {
      motivo: req.body?.motivo,
      fechaVencimiento: carnet.fechaVencimiento,
      sincronizarUsuario: Boolean(req.body?.sincronizarUsuario),
    },
  });
  return res.json({ success: true, data: carnet, message: 'Carné renovado correctamente' });
});

const getQr = asyncHandler(async (req, res) => {
  const data = await carnetsService.getQrInfo(req.params.id, actorFromSession(req));
  return res.json({ success: true, data });
});

const regenerarQr = asyncHandler(async (req, res) => {
  const data = await carnetsService.regenerarQr(req.params.id, actorFromSession(req));
  await logAudit(req, {
    accion: 'REGENERAR_QR',
    entidad: 'CarnetQR',
    entidadId: req.params.id,
    detalle: { codigoUnico: data.codigoUnico },
  });
  return res.json({ success: true, data, message: 'Código QR regenerado correctamente' });
});

module.exports = {
  list,
  preview,
  getOne,
  getHistorial,
  create,
  update,
  suspender,
  revocar,
  reactivar,
  renovar,
  getQr,
  regenerarQr,
};
