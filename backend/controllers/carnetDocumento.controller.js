const path = require('path');
const carnetPdfService = require('../services/carnetPdf.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { logAudit, actorFromSession } = require('../utils/auditHelper');

const preview = asyncHandler(async (req, res) => {
  const html = await carnetPdfService.getPreviewHtml(req.params.id, actorFromSession(req));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

const downloadPdf = asyncHandler(async (req, res) => {
  const { filePath, carnet } = await carnetPdfService.downloadPdf(
    req.params.id,
    actorFromSession(req)
  );
  await logAudit(req, {
    accion: 'DESCARGAR',
    entidad: 'CarnetDocumento',
    entidadId: carnet.id,
    detalle: { formato: 'pdf', codigoUnico: carnet.codigoUnico },
  });
  const filename = `carnet-${carnet.codigoUnico.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.sendFile(path.resolve(filePath));
});

const reimprimir = asyncHandler(async (req, res) => {
  const { filePath, carnet } = await carnetPdfService.reimprimir(
    req.params.id,
    actorFromSession(req)
  );
  await logAudit(req, {
    accion: 'REIMPRIMIR',
    entidad: 'CarnetDocumento',
    entidadId: carnet.id,
    detalle: { formato: 'pdf', codigoUnico: carnet.codigoUnico },
  });
  const filename = `carnet-${carnet.codigoUnico.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.sendFile(path.resolve(filePath));
});

const regenerar = asyncHandler(async (req, res) => {
  const { carnet } = await carnetPdfService.regenerar(req.params.id, actorFromSession(req));
  await logAudit(req, {
    accion: 'REGENERAR',
    entidad: 'CarnetDocumento',
    entidadId: carnet.id,
    detalle: { codigoUnico: carnet.codigoUnico },
  });
  return res.json({
    success: true,
    data: {
      pdfUrl: carnet.pdfUrl,
      pdfGeneradoAt: carnet.pdfGeneradoAt,
      templateId: carnet.templateId,
    },
    message: 'PDF regenerado correctamente',
  });
});

const registrarImpresion = asyncHandler(async (req, res) => {
  const carnet = await carnetPdfService.registrarImpresion(
    req.params.id,
    actorFromSession(req),
    req.body || {}
  );
  await logAudit(req, {
    accion: 'IMPRIMIR',
    entidad: 'CarnetDocumento',
    entidadId: carnet.id,
    detalle: { codigoUnico: carnet.codigoUnico },
  });
  return res.json({ success: true, message: 'Impresión registrada', data: carnet });
});

const getHistorial = asyncHandler(async (req, res) => {
  const data = await carnetPdfService.getDocumentoHistorial(
    req.params.id,
    actorFromSession(req)
  );
  return res.json({ success: true, data });
});

module.exports = {
  preview,
  downloadPdf,
  reimprimir,
  regenerar,
  registrarImpresion,
  getHistorial,
};
