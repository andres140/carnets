/**
 * Dashboard ejecutivo — agrega métricas, gráficas, alertas y actividad por rol.
 */
const dashboardRepository = require('../repositories/dashboard.repository');
const { hasPermission, hasAnyPermission } = require('../utils/permissions');
const { PERMISOS, ROLES } = require('../constants');

const ACCION_LABELS = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  CREAR: 'Creación',
  ACTUALIZAR: 'Actualización',
  DESACTIVAR: 'Desactivación',
  REACTIVAR: 'Reactivación',
  SUSPENDER: 'Suspensión',
  REVOCAR: 'Revocación',
  RENOVAR: 'Renovación',
  REGENERAR_QR: 'Regeneración QR',
  GENERAR_QR: 'Generación QR',
  VALIDAR_QR_EXITOSA: 'Validación QR exitosa',
  VALIDAR_QR_ESTADO: 'Validación QR (no vigente)',
  VALIDAR_QR_FALLIDA: 'Validación QR fallida',
  DESCARGAR: 'Descarga PDF',
  IMPRIMIR: 'Impresión',
  REIMPRIMIR: 'Reimpresión',
  EXPORTAR_REPORTE: 'Exportación de reporte',
};

function resolveVisibility(actor) {
  const tipo = actor?.tipoUsuario;
  const isAdmin = tipo === ROLES.ADMINISTRADOR;
  const isCoord = tipo === ROLES.COORDINADOR;
  const isStaff = hasAnyPermission(actor, [
    PERMISOS.CARNETS_GENERAR,
    PERMISOS.USUARIOS_VER,
    PERMISOS.REPORTES_VER,
  ]);

  const isPersonal = tipo === ROLES.APRENDIZ || tipo === ROLES.CONTRATISTA;

  return {
    resumenCompleto: isAdmin || isCoord || isStaff || isPersonal,
    graficas: (isAdmin || isCoord || hasPermission(actor, PERMISOS.REPORTES_VER) || hasPermission(actor, PERMISOS.CARNETS_VER)) && !isPersonal,
    alertas: (isAdmin || isCoord || hasPermission(actor, PERMISOS.CARNETS_VER)) && !isPersonal,
    actividad: (isAdmin || isCoord || hasPermission(actor, PERMISOS.AUDITORIA_VER) || isStaff || isPersonal),
    scopeLabel:
      isAdmin
        ? 'Vista nacional'
        : isCoord
          ? 'Vista regional'
          : tipo === ROLES.INSTRUCTOR
            ? 'Vista de centro'
            : 'Vista personal',
  };
}

function buildQuickActions(actor) {
  const perms = actor?.permisos || [];
  const can = (p) => perms.includes(p);
  const actions = [];

  if (can(PERMISOS.USUARIOS_CREAR)) {
    actions.push({ id: 'crear-usuario', label: 'Crear usuario', icon: 'person-plus', href: '/usuarios.html', color: 'primary' });
  }
  if (can(PERMISOS.CARNETS_GENERAR)) {
    actions.push({ id: 'emitir-carnet', label: 'Emitir carné', icon: 'card-heading', href: '/carnets.html', color: 'success' });
  }
  if (can(PERMISOS.CARNETS_VER) || can(PERMISOS.CARNETS_GENERAR)) {
    actions.push({ id: 'buscar-carnet', label: 'Buscar carné', icon: 'search', href: '/carnets.html', color: 'secondary' });
  }
  if (can(PERMISOS.VALIDAR_QR) || can(PERMISOS.CARNETS_VER) || can(PERMISOS.CARNETS_GENERAR)) {
    actions.push({ id: 'validar-qr', label: 'Validar QR', icon: 'qr-code-scan', href: '/validar.html', color: 'info' });
  }
  if (can(PERMISOS.REPORTES_VER) || actor?.tipoUsuario === ROLES.ADMINISTRADOR || actor?.tipoUsuario === ROLES.COORDINADOR) {
    actions.push({ id: 'reportes', label: 'Reportes', icon: 'bar-chart', href: '/reportes.html', color: 'warning' });
  }
  if (can(PERMISOS.AUDITORIA_VER)) {
    actions.push({ id: 'auditoria', label: 'Auditoría', icon: 'journal-text', href: '/auditoria.html', color: 'dark' });
  }
  if (
    can(PERMISOS.CONFIG_GESTIONAR)
  ) {
    actions.push({ id: 'config', label: 'Sistema', icon: 'gear', href: '/sistema.html', color: 'secondary' });
  }

  return actions;
}

function formatActividad(row) {
  let tipo = row.tipo;
  if (tipo.startsWith('VALIDAR_QR_')) {
    tipo = `Validación QR (${tipo.replace('VALIDAR_QR_', '')})`;
  } else {
    tipo = ACCION_LABELS[row.tipo] || row.tipo;
  }

  let descripcion = row.entidad || '';
  if (row.detalle) descripcion += ` · ${row.detalle}`;
  if (row.entidad === 'Carnet' && row.referenciaId) descripcion = `Carné ${row.detalle || row.referenciaId}`;

  return {
    fecha: row.created_at,
    tipo,
    usuario: row.usuario,
    entidad: row.entidad,
    descripcion: descripcion.trim() || row.entidad,
  };
}

function mapChartRows(rows, labelKey = 'etiqueta', valueKey = 'total') {
  return {
    labels: rows.map((r) => r[labelKey] || r.nombre || r.estado || r.fecha || r.periodo),
    values: rows.map((r) => Number(r[valueKey]) || 0),
  };
}

async function getDashboard(actor) {
  const visibility = resolveVisibility(actor);

  const [
    usuarios,
    carnets,
    validacionesHoy,
    carnetsPorMes,
    usuariosPorTipo,
    usuariosPorRegional,
    carnetsPorEstado,
    validacionesPorDia,
    emisionesPorCentro,
    actividad,
    alertas,
  ] = await Promise.all([
    dashboardRepository.getUsuariosResumen(actor),
    dashboardRepository.getCarnetsResumen(actor),
    dashboardRepository.getValidacionesHoy(actor),
    visibility.graficas ? dashboardRepository.getCarnetsPorMes(actor) : Promise.resolve([]),
    visibility.graficas ? dashboardRepository.getUsuariosPorTipo(actor) : Promise.resolve([]),
    visibility.graficas ? dashboardRepository.getUsuariosPorRegional(actor) : Promise.resolve([]),
    visibility.graficas ? dashboardRepository.getCarnetsPorEstado(actor) : Promise.resolve([]),
    visibility.graficas ? dashboardRepository.getValidacionesPorDia(actor) : Promise.resolve([]),
    visibility.graficas ? dashboardRepository.getEmisionesPorCentro(actor) : Promise.resolve([]),
    visibility.actividad ? dashboardRepository.getActividadReciente(actor) : Promise.resolve([]),
    visibility.alertas ? dashboardRepository.getAlertas(actor) : Promise.resolve({ proximosVencer: [], usuariosSinFoto: [], carnetsSuspendidos: [] }),
  ]);

  return {
    actualizadoEn: new Date().toISOString(),
    scope: visibility.scopeLabel,
    visibility,
    quickActions: buildQuickActions(actor),
    resumen: {
      usuariosTotal: Number(usuarios.total) || 0,
      usuariosActivos: Number(usuarios.activos) || 0,
      usuariosInactivos: Number(usuarios.inactivos) || 0,
      usuariosSinFoto: Number(usuarios.sinFoto) || 0,
      carnetsActivos: Number(carnets.activos) || 0,
      carnetsVencidos: Number(carnets.vencidos) || 0,
      carnetsSuspendidos: Number(carnets.suspendidos) || 0,
      carnetsRevocados: Number(carnets.revocados) || 0,
      carnetsEmitidosHoy: Number(carnets.emitidosHoy) || 0,
      carnetsEmitidosMes: Number(carnets.emitidosMes) || 0,
      carnetsProximosVencer: Number(carnets.proximosVencer) || 0,
      validacionesQrHoy: Number(validacionesHoy) || 0,
    },
    graficas: {
      carnetsPorMes: mapChartRows(carnetsPorMes, 'etiqueta'),
      usuariosPorTipo: mapChartRows(usuariosPorTipo, 'tipo'),
      usuariosPorRegional: mapChartRows(usuariosPorRegional, 'nombre'),
      carnetsPorEstado: mapChartRows(carnetsPorEstado, 'estado'),
      validacionesPorDia: {
        labels: validacionesPorDia.map((r) => r.fecha),
        total: validacionesPorDia.map((r) => Number(r.total) || 0),
        validas: validacionesPorDia.map((r) => Number(r.validas) || 0),
      },
      emisionesPorCentro: mapChartRows(emisionesPorCentro, 'nombre'),
    },
    actividad: actividad.map(formatActividad),
    alertas: {
      proximosVencer: alertas.proximosVencer.map((r) => ({
        id: r.id,
        codigo: r.codigo_unico,
        nombre: r.nombre_completo,
        fechaVencimiento: r.fecha_vencimiento,
      })),
      usuariosSinFoto: alertas.usuariosSinFoto.map((r) => ({
        id: r.id,
        nombre: r.nombre_completo,
      })),
      carnetsSuspendidos: alertas.carnetsSuspendidos.map((r) => ({
        id: r.id,
        codigo: r.codigo_unico,
        nombre: r.nombre_completo,
      })),
    },
  };
}

/** Compatibilidad Sprint 6 */
async function getStats(actor) {
  const dash = await getDashboard(actor);
  return {
    usuarios: dash.resumen.usuariosActivos,
    carnets: {
      activos: dash.resumen.carnetsActivos,
      vencidos: dash.resumen.carnetsVencidos,
      suspendidos: dash.resumen.carnetsSuspendidos,
      revocados: dash.resumen.carnetsRevocados,
      proximosVencer: dash.resumen.carnetsProximosVencer,
    },
    validaciones: {
      hoy: dash.resumen.validacionesQrHoy,
      fallidasHoy: 0,
      recientes: dash.actividad
        .filter((a) => a.tipo.includes('Validación QR'))
        .slice(0, 8)
        .map((a) => ({
          resultado: a.tipo,
          codigoUnico: a.descripcion,
          createdAt: a.fecha,
        })),
    },
  };
}

module.exports = { getDashboard, getStats };
