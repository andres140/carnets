/**
 * Servicio de reportes institucionales — consultas, estadísticas y exportación.
 */
const reportesRepository = require('../repositories/reportes.repository');
const dashboardRepository = require('../repositories/dashboard.repository');
const { exportReport } = require('../lib/reportExport');
const { parseReportFilters, filtersToLabel } = require('../utils/reportFilters');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { REPORT, ROLES } = require('../constants');

function resolveScopeLabel(actor) {
  if (!actor) return 'Sin alcance';
  if (actor.tipoUsuario === ROLES.ADMINISTRADOR) return 'Vista nacional';
  if (actor.tipoUsuario === ROLES.COORDINADOR) return 'Vista regional';
  if (actor.tipoUsuario === ROLES.INSTRUCTOR) return 'Vista de centro';
  return 'Vista personal';
}

function parseReportPagination(query, forExport = false) {
  if (forExport) {
    return { limit: REPORT.EXPORT_MAX_ROWS, offset: 0, page: 1 };
  }
  const base = parsePagination(query);
  const limit = Math.min(REPORT.MAX_PAGE_LIMIT, base.limit);
  return { ...base, limit, offset: (base.page - 1) * limit };
}

async function getEstadisticas(actor) {
  const [usuarios, carnets, validacionesHoy, usuariosPorTipo, usuariosPorRegional, carnetsPorEstado, carnetsPorMes, validacionesPorDia] =
    await Promise.all([
      dashboardRepository.getUsuariosResumen(actor),
      dashboardRepository.getCarnetsResumen(actor),
      dashboardRepository.getValidacionesHoy(actor),
      dashboardRepository.getUsuariosPorTipo(actor),
      dashboardRepository.getUsuariosPorRegional(actor),
      dashboardRepository.getCarnetsPorEstado(actor),
      dashboardRepository.getCarnetsPorMes(actor),
      dashboardRepository.getValidacionesPorDia(actor, 14),
    ]);

  return {
    actualizadoEn: new Date().toISOString(),
    scope: resolveScopeLabel(actor),
    totales: {
      usuarios: Number(usuarios.total) || 0,
      usuariosActivos: Number(usuarios.activos) || 0,
      usuariosInactivos: Number(usuarios.inactivos) || 0,
      carnetsActivos: Number(carnets.activos) || 0,
      carnetsVencidos: Number(carnets.vencidos) || 0,
      carnetsSuspendidos: Number(carnets.suspendidos) || 0,
      carnetsRevocados: Number(carnets.revocados) || 0,
      carnetsProximosVencer: Number(carnets.proximosVencer) || 0,
      carnetsEmitidosMes: Number(carnets.emitidosMes) || 0,
      validacionesHoy: Number(validacionesHoy) || 0,
    },
    usuariosPorRol: usuariosPorTipo.map((r) => ({ rol: r.tipo, total: Number(r.total) })),
    usuariosPorRegional: usuariosPorRegional.map((r) => ({
      regional: r.nombre,
      total: Number(r.total),
    })),
    carnetsPorEstado: carnetsPorEstado.map((r) => ({ estado: r.estado, total: Number(r.total) })),
    emisionesPorPeriodo: carnetsPorMes.map((r) => ({
      periodo: r.etiqueta || r.periodo,
      total: Number(r.total),
    })),
    validacionesPorDia: validacionesPorDia.map((r) => ({
      fecha: r.fecha,
      total: Number(r.total),
      exitosas: Number(r.validas) || 0,
    })),
  };
}

async function getReporteUsuarios(query, actor) {
  const filters = parseReportFilters(query);
  const { page, limit, offset } = parseReportPagination(query);

  const [total, items, estadisticas] = await Promise.all([
    reportesRepository.countUsuarios(filters, actor),
    reportesRepository.findUsuarios(filters, actor, { limit, offset }),
    reportesRepository.aggregateUsuarios(filters, actor),
  ]);

  return {
    scope: resolveScopeLabel(actor),
    filtros: filters,
    filtrosLabel: filtersToLabel(filters),
    estadisticas: {
      total,
      activos: estadisticas.porEstado.find((r) => r.estado === 'ACTIVO')?.total || 0,
      inactivos: estadisticas.porEstado
        .filter((r) => r.estado !== 'ACTIVO')
        .reduce((s, r) => s + Number(r.total), 0),
      porTipo: estadisticas.porTipo,
      porRegional: estadisticas.porRegional,
      porRol: estadisticas.porRol,
    },
    items: items.map(mapUsuarioDto),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getReporteCarnets(query, actor) {
  const filters = parseReportFilters(query);
  const { page, limit, offset } = parseReportPagination(query);

  const [total, items, estadisticas] = await Promise.all([
    reportesRepository.countCarnets(filters, actor),
    reportesRepository.findCarnets(filters, actor, { limit, offset }),
    reportesRepository.aggregateCarnets(filters, actor),
  ]);

  return {
    scope: resolveScopeLabel(actor),
    filtros: filters,
    filtrosLabel: filtersToLabel(filters),
    estadisticas: {
      total,
      porEstado: estadisticas.porEstado,
      porRegional: estadisticas.porRegional,
      porCentro: estadisticas.porCentro,
      porMes: estadisticas.porMes,
    },
    items: items.map(mapCarnetDto),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getReporteValidaciones(query, actor) {
  const filters = parseReportFilters(query);
  const { page, limit, offset } = parseReportPagination(query);

  const [total, items, estadisticas] = await Promise.all([
    reportesRepository.countValidaciones(filters, actor),
    reportesRepository.findValidaciones(filters, actor, { limit, offset }),
    reportesRepository.aggregateValidaciones(filters, actor),
  ]);

  const exitosas = estadisticas.porResultado.find((r) => r.resultado === 'VALIDO')?.total || 0;
  const fallidas = estadisticas.porResultado
    .filter((r) => r.resultado !== 'VALIDO')
    .reduce((s, r) => s + Number(r.total), 0);

  return {
    scope: resolveScopeLabel(actor),
    filtros: filters,
    filtrosLabel: filtersToLabel(filters),
    estadisticas: {
      total,
      exitosas: Number(exitosas),
      fallidas: Number(fallidas),
      porResultado: estadisticas.porResultado,
      porFecha: estadisticas.porFecha,
      porRegional: estadisticas.porRegional,
      masConsultados: estadisticas.masConsultados,
      porHora: estadisticas.porHora.map((r) => ({
        hora: `${String(r.hora).padStart(2, '0')}:00`,
        total: Number(r.total),
      })),
    },
    items: items.map(mapValidacionDto),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function busquedaAvanzada(query, actor) {
  const tipo = String(query.tipo || 'carnets').toLowerCase();
  if (tipo === 'usuarios') return { tipo, ...(await getReporteUsuarios(query, actor)) };
  if (tipo === 'validaciones') return { tipo, ...(await getReporteValidaciones(query, actor)) };
  return { tipo: 'carnets', ...(await getReporteCarnets(query, actor)) };
}

async function exportarReporte(tipo, format, query, actor) {
  const filters = parseReportFilters(query);
  const pagination = parseReportPagination(query, true);
  let rows = [];

  if (tipo === 'usuarios') {
    rows = await reportesRepository.findUsuarios(filters, actor, pagination);
  } else if (tipo === 'carnets') {
    rows = await reportesRepository.findCarnets(filters, actor, pagination);
  } else if (tipo === 'validaciones') {
    rows = await reportesRepository.findValidaciones(filters, actor, pagination);
  } else {
    throw new Error('Tipo de reporte no válido');
  }

  const meta = {
    generatedAt: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    generatedBy: actor?.nombreCompleto || actor?.email || 'Usuario',
    scope: resolveScopeLabel(actor),
    filters: filtersToLabel(filters),
  };

  const result = await exportReport(tipo, format, rows, meta);
  const dateStamp = new Date().toISOString().split('T')[0];

  return {
    ...result,
    filename: `reporte-${tipo}-${dateStamp}.${result.extension}`,
    meta: { ...meta, total: rows.length, tipo, format },
  };
}

function mapUsuarioDto(row) {
  return {
    id: row.id,
    documento: row.documento,
    nombreCompleto: row.nombre_completo,
    email: row.email,
    tipoUsuario: row.tipo_usuario,
    rolNombre: row.rol_nombre,
    estado: row.estado,
    regionalNombre: row.regional_nombre,
    centroNombre: row.centro_nombre,
    dependenciaNombre: row.dependencia_nombre,
    telefono: row.telefono,
    fechaRegistro: row.created_at,
  };
}

function mapCarnetDto(row) {
  return {
    id: row.id,
    codigoUnico: row.codigo_unico,
    documento: row.documento,
    nombreCompleto: row.nombre_completo,
    tipoUsuario: row.tipo_usuario,
    estado: row.estado,
    fechaExpedicion: row.fecha_expedicion,
    fechaVencimiento: row.fecha_vencimiento,
    regionalNombre: row.regional_nombre,
    centroNombre: row.centro_nombre,
    dependenciaNombre: row.dependencia_nombre,
    email: row.email,
    fechaEmision: row.created_at,
  };
}

function mapValidacionDto(row) {
  return {
    id: row.id,
    resultado: row.resultado,
    fecha: row.created_at,
    codigoUnico: row.codigo_unico,
    nombreCompleto: row.nombre_completo,
    documento: row.documento,
    regionalNombre: row.regional_nombre,
    centroNombre: row.centro_nombre,
    ip: row.ip,
  };
}

module.exports = {
  getEstadisticas,
  getReporteUsuarios,
  getReporteCarnets,
  getReporteValidaciones,
  busquedaAvanzada,
  exportarReporte,
};
