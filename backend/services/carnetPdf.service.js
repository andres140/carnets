/**
 * Servicio de documentos PDF del carné — generación, caché, historial e impresión.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const carnetsRepository = require('../repositories/carnets.repository');
const carnetDocumentosRepository = require('../repositories/carnetDocumentos.repository');
const usersRepository = require('../repositories/users.repository');
const templateEngine = require('../lib/carnetTemplate/engine');
const pdfGenerator = require('../lib/pdf/generator');
const { formatCarnet } = require('./carnets.service');
const { canAccessCarnet } = require('../utils/permissions');
const { resolveEstado } = require('../utils/carnetStates');
const { createAppError } = require('../utils/errors');
const { generateId } = require('../utils/helpers');
const { CARNET } = require('../constants');

function getPdfDir() {
  const dir = path.isAbsolute(env.carnet.pdfDir)
    ? env.carnet.pdfDir
    : path.join(process.cwd(), env.carnet.pdfDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getPdfFilePath(carnetId) {
  return path.join(getPdfDir(), `${carnetId}.pdf`);
}

async function loadCarnet(id, actor) {
  const row = await carnetsRepository.findById(id);
  let carnet = formatCarnet(row);
  if (!carnet) return null;
  if (!canAccessCarnet(actor, carnet)) return null;

  const resolved = resolveEstado(carnet);
  if (resolved === 'VENCIDO' && carnet.estado === 'ACTIVO') {
    await carnetsRepository.setEstado(carnet.id, 'VENCIDO');
    carnet = { ...carnet, estado: 'VENCIDO', estadoResuelto: 'VENCIDO' };
  } else {
    carnet.estadoResuelto = resolved;
  }
  return carnet;
}

async function assertValidForDocument(carnet, { requireActiveUser = true } = {}) {
  if (!carnet.nombreCompleto?.trim()) {
    throw createAppError('No se puede generar el documento: falta el nombre completo', 400);
  }
  if (!carnet.documento?.trim()) {
    throw createAppError('No se puede generar el documento: falta el documento de identidad', 400);
  }
  if (!carnet.codigoUnico) {
    throw createAppError('No se puede generar el documento: falta el código único', 400);
  }
  if (!carnet.fotoUrl) {
    throw createAppError('No se puede generar el documento: se requiere fotografía', 400);
  }
  if (!carnet.fechaExpedicion || !carnet.fechaVencimiento) {
    throw createAppError('No se puede generar el documento: fechas incompletas', 400);
  }
  if (new Date(carnet.fechaVencimiento) < new Date(carnet.fechaExpedicion)) {
    throw createAppError('La fecha de vencimiento debe ser posterior a la de expedición', 400);
  }

  if (requireActiveUser) {
    const user = await usersRepository.findById(carnet.usuarioId);
    if (!user || user.estado !== 'ACTIVO') {
      throw createAppError('El usuario debe estar activo para generar el documento', 400);
    }
  }
}

async function recordHistorial(carnetId, accion, usuarioId, detalle = null) {
  await carnetDocumentosRepository.insert({
    id: generateId(),
    carnetId,
    accion,
    usuarioId,
    detalle,
  });
}

async function invalidateCache(carnetId) {
  const filePath = getPdfFilePath(carnetId);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      /* ignorar */
    }
  }
  await carnetsRepository.clearPdfCache(carnetId);
}

async function getOrCreatePdf(carnetId, actor, { force = false, requireActiveUser = true } = {}) {
  const carnet = await loadCarnet(carnetId, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);

  await assertValidForDocument(carnet, { requireActiveUser });

  const templateId = carnet.templateId || env.carnet.templateId || options.templateId;
  const dataHash = templateEngine.computeDataHash(carnet, templateId);
  const filePath = getPdfFilePath(carnetId);

  if (!force && carnet.pdfHash === dataHash && fs.existsSync(filePath)) {
    return { filePath, carnet, cached: true, newlyGenerated: false };
  }

  const buffer = await pdfGenerator.generateCarnetPdf(carnet, { templateId });
  fs.writeFileSync(filePath, buffer);

  const pdfUrl = `/uploads/carnets/${carnetId}.pdf`;
  await carnetsRepository.updatePdfMeta(carnetId, {
    pdfUrl,
    pdfHash: dataHash,
    pdfGeneradoAt: new Date(),
    templateId,
  });

  await recordHistorial(carnetId, 'GENERAR', actor.id, { templateId, cached: false });

  const updated = await loadCarnet(carnetId, actor);
  return { filePath, carnet: updated, cached: false, newlyGenerated: true };
}

async function getPreviewHtml(carnetId, actor) {
  const carnet = await loadCarnet(carnetId, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  await assertValidForDocument(carnet, { requireActiveUser: false });
  return templateEngine.renderFullDocument(carnet);
}

async function downloadPdf(carnetId, actor) {
  const { filePath, carnet } = await getOrCreatePdf(carnetId, actor, {
    requireActiveUser: false,
  });
  await recordHistorial(carnetId, 'DESCARGAR', actor.id, { formato: 'pdf' });
  return { filePath, carnet };
}

async function reimprimir(carnetId, actor) {
  const { filePath, carnet } = await getOrCreatePdf(carnetId, actor, {
    requireActiveUser: false,
  });
  await recordHistorial(carnetId, 'REIMPRIMIR', actor.id, { formato: 'pdf' });
  await carnetsRepository.incrementReimpresiones(carnetId);
  return { filePath, carnet: await loadCarnet(carnetId, actor) };
}

async function registrarImpresion(carnetId, actor, detalle = {}) {
  const carnet = await loadCarnet(carnetId, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  await getOrCreatePdf(carnetId, actor, { requireActiveUser: false });
  await recordHistorial(carnetId, 'IMPRIMIR', actor.id, detalle);
  return loadCarnet(carnetId, actor);
}

async function regenerar(carnetId, actor) {
  await invalidateCache(carnetId);
  return getOrCreatePdf(carnetId, actor, { force: true, requireActiveUser: false });
}

function formatDocHistorial(row) {
  let detalle = null;
  if (row.detalle_json) {
    try {
      detalle = typeof row.detalle_json === 'string' ? JSON.parse(row.detalle_json) : row.detalle_json;
    } catch {
      detalle = null;
    }
  }
  return {
    id: row.id,
    accion: row.accion,
    usuarioNombre: row.usuario_nombre,
    detalle,
    createdAt: row.created_at,
  };
}

async function getDocumentoHistorial(carnetId, actor) {
  const carnet = await loadCarnet(carnetId, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);

  const [rows, resumen] = await Promise.all([
    carnetDocumentosRepository.findByCarnetId(carnetId),
    carnetDocumentosRepository.getResumen(carnetId),
  ]);

  return {
    carnetId,
    reimpresionesCount: carnet.reimpresionesCount || 0,
    pdfGeneradoAt: carnet.pdfGeneradoAt,
    templateId: carnet.templateId,
    resumen: {
      fechaGeneracion: resumen?.fecha_generacion || carnet.pdfGeneradoAt,
      fechaDescarga: resumen?.fecha_descarga || null,
      fechaImpresion: resumen?.fecha_impresion || null,
      reimpresiones: resumen?.reimpresiones || carnet.reimpresionesCount || 0,
    },
    items: rows.map(formatDocHistorial),
  };
}

module.exports = {
  invalidateCache,
  getPreviewHtml,
  getOrCreatePdf,
  downloadPdf,
  reimprimir,
  registrarImpresion,
  regenerar,
  getDocumentoHistorial,
};
