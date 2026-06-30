/**
 * Motor de plantillas de carné — separa diseño, datos y lógica.
 * Para cambiar el diseño: nueva carpeta en templates/carnets/{id}/ + CARNET_TEMPLATE_ID.
 */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const crypto = require('crypto');
const env = require('../../config/env');
const qrService = require('../../services/qr.service');

const TEMPLATES_ROOT = path.join(__dirname, '..', '..', 'templates', 'carnets');

function listTemplates() {
  if (!fs.existsSync(TEMPLATES_ROOT)) return [];
  return fs
    .readdirSync(TEMPLATES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function loadConfig(templateId) {
  const id = templateId || env.carnet.templateId;
  const configPath = path.join(TEMPLATES_ROOT, id, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Plantilla de carné no encontrada: ${id}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return { ...config, id };
}

function formatDateEs(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function resolvePhotoDataUrl(fotoUrl) {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('data:')) return fotoUrl;

  let filePath = fotoUrl;
  if (fotoUrl.startsWith('/')) {
    filePath = path.join(process.cwd(), 'public', fotoUrl.replace(/^\//, ''));
  } else if (!path.isAbsolute(fotoUrl)) {
    filePath = path.join(process.cwd(), fotoUrl);
  }

  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const buffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function buildViewModel(carnet, options = {}) {
  const estadoResuelto = carnet.estadoResuelto || carnet.estado;
  const qrToken = carnet.qrToken || '';

  const viewModel = {
    ...carnet,
    estadoResuelto,
    fechaExpedicionFmt: formatDateEs(carnet.fechaExpedicion),
    fechaVencimientoFmt: formatDateEs(carnet.fechaVencimiento),
    fotoDataUrl: resolvePhotoDataUrl(carnet.fotoUrl),
    qrTokenPlaceholder: !qrToken,
    validationUrl: null,
    qrDataUrl: null,
    templateId: options.templateId || carnet.templateId || env.carnet.templateId,
  };

  if (qrToken && qrService.verifyToken(qrToken)) {
    const qr = await qrService.generateQrForToken(qrToken, options.qrSize || 180);
    viewModel.validationUrl = qr.validationUrl;
    viewModel.qrDataUrl = qr.dataUrl;
    viewModel.qrTokenPlaceholder = false;
  }

  return viewModel;
}

function computeDataHash(carnet, templateId) {
  const payload = {
    templateId: templateId || carnet.templateId || env.carnet.templateId,
    codigoUnico: carnet.codigoUnico,
    nombreCompleto: carnet.nombreCompleto,
    documento: carnet.documento,
    tipoDocumento: carnet.tipoDocumento,
    tipoUsuario: carnet.tipoUsuario,
    centroNombre: carnet.centroNombre,
    regionalNombre: carnet.regionalNombre,
    dependenciaNombre: carnet.dependenciaNombre,
    fotoUrl: carnet.fotoUrl,
    fechaExpedicion: carnet.fechaExpedicion,
    fechaVencimiento: carnet.fechaVencimiento,
    estado: carnet.estadoResuelto || carnet.estado,
    qrToken: carnet.qrToken,
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function renderSide(templateId, side, viewModel) {
  const config = loadConfig(templateId);
  const templateDir = path.join(TEMPLATES_ROOT, config.id);
  const fileName = config.files?.[side];
  if (!fileName) throw new Error(`Lado de plantilla no definido: ${side}`);

  const styles = fs.readFileSync(path.join(templateDir, config.files.styles), 'utf8');
  const templatePath = path.join(templateDir, fileName);
  const template = fs.readFileSync(templatePath, 'utf8');

  return ejs.render(template, { ...viewModel, styles }, { filename: templatePath });
}

async function renderFullDocument(carnet, options = {}) {
  const templateId = options.templateId || carnet.templateId || env.carnet.templateId;
  const config = loadConfig(templateId);
  const viewModel = await buildViewModel(carnet, { templateId, qrSize: options.qrSize });
  const sides = config.sides || ['front'];

  const parts = sides.map((side) => renderSide(templateId, side, viewModel));
  const styles = fs.readFileSync(
    path.join(TEMPLATES_ROOT, config.id, config.files.styles),
    'utf8'
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Carné ${viewModel.codigoUnico}</title>
  <style>${styles}</style>
</head>
<body>
${parts
  .map((html) => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : html;
  })
  .join('\n')}
</body>
</html>`;
}

module.exports = {
  listTemplates,
  loadConfig,
  buildViewModel,
  computeDataHash,
  renderSide,
  renderFullDocument,
  resolvePhotoDataUrl,
};
