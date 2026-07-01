/**
 * Parseo de filtros de reportes desde query string.
 */
const { ESTADOS_USUARIO, ESTADOS_CARNET, TIPOS_USUARIO } = require('../constants');

function trimOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const s = String(value).trim();
  return s || null;
}

function parseDateOrNull(value) {
  const s = trimOrNull(value);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function parseReportFilters(query = {}) {
  const estado = trimOrNull(query.estado);
  const tipoUsuario = trimOrNull(query.tipoUsuario);

  return {
    nombre: trimOrNull(query.nombre),
    documento: trimOrNull(query.documento),
    email: trimOrNull(query.email),
    rolId: trimOrNull(query.rolId),
    tipoUsuario: tipoUsuario && TIPOS_USUARIO.includes(tipoUsuario) ? tipoUsuario : null,
    regionalId: trimOrNull(query.regionalId),
    centroId: trimOrNull(query.centroId),
    dependenciaId: trimOrNull(query.dependenciaId),
    estado:
      estado && (ESTADOS_USUARIO.includes(estado) || ESTADOS_CARNET.includes(estado))
        ? estado
        : null,
    fechaRegistroDesde: parseDateOrNull(query.fechaRegistroDesde),
    fechaRegistroHasta: parseDateOrNull(query.fechaRegistroHasta),
    fechaExpedicionDesde: parseDateOrNull(query.fechaExpedicionDesde),
    fechaExpedicionHasta: parseDateOrNull(query.fechaExpedicionHasta),
    fechaVencimientoDesde: parseDateOrNull(query.fechaVencimientoDesde),
    fechaVencimientoHasta: parseDateOrNull(query.fechaVencimientoHasta),
    fechaDesde: parseDateOrNull(query.fechaDesde),
    fechaHasta: parseDateOrNull(query.fechaHasta),
    resultado: trimOrNull(query.resultado),
    proximosVencer: query.proximosVencer === 'true' || query.proximosVencer === '1',
    soloActivos: query.soloActivos === 'true' || query.soloActivos === '1',
    soloInactivos: query.soloInactivos === 'true' || query.soloInactivos === '1',
    search: trimOrNull(query.search),
  };
}

function filtersToLabel(filters) {
  const parts = [];
  const labels = {
    nombre: 'Nombre',
    documento: 'Documento',
    email: 'Correo',
    rolId: 'Rol',
    tipoUsuario: 'Tipo',
    regionalId: 'Regional',
    centroId: 'Centro',
    dependenciaId: 'Dependencia',
    estado: 'Estado',
    fechaRegistroDesde: 'Registro desde',
    fechaRegistroHasta: 'Registro hasta',
    fechaExpedicionDesde: 'Expedición desde',
    fechaExpedicionHasta: 'Expedición hasta',
    fechaVencimientoDesde: 'Vencimiento desde',
    fechaVencimientoHasta: 'Vencimiento hasta',
    fechaDesde: 'Desde',
    fechaHasta: 'Hasta',
    resultado: 'Resultado',
    proximosVencer: 'Próximos a vencer',
    soloActivos: 'Solo activos',
    soloInactivos: 'Solo inactivos',
    search: 'Búsqueda',
  };

  for (const [key, label] of Object.entries(labels)) {
    const val = filters[key];
    if (val === true) parts.push(label);
    else if (val) parts.push(`${label}: ${val}`);
  }

  return parts.length ? parts.join(' · ') : 'Sin filtros';
}

module.exports = { parseReportFilters, filtersToLabel };
