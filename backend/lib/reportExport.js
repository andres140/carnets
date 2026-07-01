/**
 * Exportación de reportes — CSV, Excel y PDF.
 */
const XLSX = require('xlsx');
const { htmlToPdf } = require('./pdf/generator');

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  return lines.join('\n');
}

function buildXlsxBuffer(sheetName, headers, rows) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().split('T')[0];
}

function buildReportHtml(meta, headers, rows) {
  const headerCells = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '')}</td>`).join('')}</tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; margin: 24px; }
    h1 { font-size: 16px; color: #39a900; margin: 0 0 8px; }
    .meta { font-size: 9px; color: #555; margin-bottom: 16px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #39a900; color: #fff; padding: 6px 4px; text-align: left; }
    td { border-bottom: 1px solid #ddd; padding: 5px 4px; }
    tr:nth-child(even) td { background: #f8f9fa; }
    .footer { margin-top: 12px; font-size: 8px; color: #888; }
  </style>
</head>
<body>
  <h1>${escapeHtml(meta.title)}</h1>
  <div class="meta">
    <div><strong>Generado:</strong> ${escapeHtml(meta.generatedAt)}</div>
    <div><strong>Usuario:</strong> ${escapeHtml(meta.generatedBy)}</div>
    <div><strong>Alcance:</strong> ${escapeHtml(meta.scope)}</div>
    <div><strong>Filtros:</strong> ${escapeHtml(meta.filters)}</div>
    <div><strong>Total registros:</strong> ${meta.total}</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">SENA Carnés — Reporte institucional</div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function buildPdfBuffer(meta, headers, rows) {
  const html = buildReportHtml(meta, headers, rows);
  return htmlToPdf(html, {
    format: 'A4',
    margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    waitUntil: 'domcontentloaded',
  });
}

function mapUsuarioRow(row) {
  return [
    row.documento,
    row.nombre_completo,
    row.email,
    row.tipo_usuario,
    row.rol_nombre,
    row.estado,
    row.regional_nombre || '',
    row.centro_nombre || '',
    row.dependencia_nombre || '',
    formatDate(row.created_at),
  ];
}

function mapCarnetRow(row) {
  return [
    row.codigo_unico,
    row.documento,
    row.nombre_completo,
    row.tipo_usuario,
    row.estado,
    formatDate(row.fecha_expedicion),
    formatDate(row.fecha_vencimiento),
    row.regional_nombre || '',
    row.centro_nombre || '',
    row.dependencia_nombre || '',
    row.email || '',
  ];
}

function mapValidacionRow(row) {
  return [
    formatDate(row.created_at),
    row.resultado,
    row.codigo_unico || '',
    row.nombre_completo || '',
    row.documento || '',
    row.regional_nombre || '',
    row.centro_nombre || '',
    row.ip || '',
  ];
}

const EXPORT_COLUMNS = {
  usuarios: {
    headers: [
      'Documento',
      'Nombre',
      'Correo',
      'Tipo',
      'Rol',
      'Estado',
      'Regional',
      'Centro',
      'Dependencia',
      'Fecha registro',
    ],
    mapRow: mapUsuarioRow,
    sheetName: 'Usuarios',
    title: 'Reporte de usuarios',
  },
  carnets: {
    headers: [
      'Código',
      'Documento',
      'Nombre',
      'Tipo',
      'Estado',
      'Expedición',
      'Vencimiento',
      'Regional',
      'Centro',
      'Dependencia',
      'Correo',
    ],
    mapRow: mapCarnetRow,
    sheetName: 'Carnets',
    title: 'Reporte de carnés',
  },
  validaciones: {
    headers: [
      'Fecha',
      'Resultado',
      'Código carné',
      'Nombre',
      'Documento',
      'Regional',
      'Centro',
      'IP',
    ],
    mapRow: mapValidacionRow,
    sheetName: 'Validaciones',
    title: 'Reporte de validaciones QR',
  },
};

async function exportReport(tipo, format, rows, meta) {
  const config = EXPORT_COLUMNS[tipo];
  if (!config) throw new Error('Tipo de reporte no válido');

  const dataRows = rows.map(config.mapRow);
  const exportMeta = {
    title: config.title,
    generatedAt: meta.generatedAt,
    generatedBy: meta.generatedBy,
    scope: meta.scope,
    filters: meta.filters,
    total: rows.length,
  };

  const normalizedFormat = String(format || 'csv').toLowerCase();

  if (normalizedFormat === 'csv') {
    return {
      buffer: Buffer.from(buildCsv(config.headers, dataRows), 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  if (normalizedFormat === 'xlsx') {
    return {
      buffer: buildXlsxBuffer(config.sheetName, config.headers, dataRows),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  if (normalizedFormat === 'pdf') {
    return {
      buffer: await buildPdfBuffer(exportMeta, config.headers, dataRows),
      contentType: 'application/pdf',
      extension: 'pdf',
    };
  }

  throw new Error('Formato de exportación no válido. Use csv, xlsx o pdf.');
}

module.exports = {
  exportReport,
  EXPORT_COLUMNS,
  formatDate,
};
