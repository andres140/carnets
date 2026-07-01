const reportesService = require('../services/reportes.service');
const notificacionesService = require('../services/notificaciones.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession, logAudit } = require('../utils/auditHelper');

const estadisticas = asyncHandler(async (req, res) => {
  const data = await reportesService.getEstadisticas(actorFromSession(req));
  return res.json({ success: true, data });
});

const usuarios = asyncHandler(async (req, res) => {
  const data = await reportesService.getReporteUsuarios(req.query, actorFromSession(req));
  return res.json({ success: true, data });
});

const carnets = asyncHandler(async (req, res) => {
  const data = await reportesService.getReporteCarnets(req.query, actorFromSession(req));
  return res.json({ success: true, data });
});

const validaciones = asyncHandler(async (req, res) => {
  const data = await reportesService.getReporteValidaciones(req.query, actorFromSession(req));
  return res.json({ success: true, data });
});

const busqueda = asyncHandler(async (req, res) => {
  const data = await reportesService.busquedaAvanzada(req.query, actorFromSession(req));
  return res.json({ success: true, data });
});

async function handleExport(req, res, tipo) {
  const format = req.query.format || 'csv';
  const actor = actorFromSession(req);
  const result = await reportesService.exportarReporte(tipo, format, req.query, actor);

  await logAudit(req, {
    accion: 'EXPORTAR_REPORTE',
    entidad: 'Reporte',
    entidadId: tipo,
    detalle: result.meta,
  });

  try {
    await notificacionesService.notifyExportComplete(actor.id, result.meta);
  } catch {
    /* no bloquear exportación */
  }

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('Content-Length', result.buffer.length);
  return res.end(result.buffer);
}

const exportUsuarios = asyncHandler((req, res) => handleExport(req, res, 'usuarios'));
const exportCarnets = asyncHandler((req, res) => handleExport(req, res, 'carnets'));
const exportValidaciones = asyncHandler((req, res) => handleExport(req, res, 'validaciones'));

module.exports = {
  estadisticas,
  usuarios,
  carnets,
  validaciones,
  busqueda,
  exportUsuarios,
  exportCarnets,
  exportValidaciones,
};
