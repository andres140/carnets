const auditoriaRepository = require('../repositories/auditoria.repository');
const { MODULOS } = require('../constants');

const ENTIDAD_MODULO = {
  Usuario: MODULOS.USUARIOS,
  Carnet: MODULOS.CARNETS,
  Regional: MODULOS.ORGANIZACION,
  Centro: MODULOS.ORGANIZACION,
  Dependencia: MODULOS.ORGANIZACION,
  Rol: MODULOS.ORGANIZACION,
  Reporte: MODULOS.REPORTES,
  Configuracion: MODULOS.CONFIG,
  ValidacionQR: MODULOS.VALIDACION,
  Sesion: MODULOS.AUTH,
};

function resolveModulo(entidad, modulo) {
  if (modulo) return modulo;
  return ENTIDAD_MODULO[entidad] || entidad;
}

async function log(params) {
  return auditoriaRepository.insert({
    usuarioId: params.usuarioId,
    rolNombre: params.rolNombre,
    accion: params.accion,
    modulo: resolveModulo(params.entidad, params.modulo),
    resultado: params.resultado || 'EXITO',
    entidad: params.entidad,
    entidadId: params.entidadId,
    detalle: params.detalle,
    ip: params.ip,
    userAgent: params.userAgent,
  });
}

async function list(query, actor) {
  const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
  const { page, limit, offset } = parsePagination(query);

  const filters = {
    usuarioId: query.usuarioId,
    rolNombre: query.rol,
    modulo: query.modulo,
    accion: query.accion,
    resultado: query.resultado,
    ip: query.ip,
    fechaDesde: query.fechaDesde,
    fechaHasta: query.fechaHasta,
    search: query.search,
  };

  const [total, items, acciones, modulos] = await Promise.all([
    auditoriaRepository.count(filters, actor),
    auditoriaRepository.findMany(filters, actor, { limit, offset }),
    auditoriaRepository.getAccionesDistinct(actor),
    auditoriaRepository.getModulosDistinct(actor),
  ]);

  return {
    items: items.map(mapRow),
    pagination: buildPaginationMeta(page, limit, total),
    filtros: { acciones: acciones.map((r) => r.accion), modulos: modulos.map((r) => r.modulo) },
  };
}

async function getSeguridadReciente() {
  const [eventos, total24h] = await Promise.all([
    auditoriaRepository.findSeguridadReciente(15),
    auditoriaRepository.countSeguridadReciente(24),
  ]);

  return {
    total24h,
    eventos: eventos.map((e) => ({
      id: e.id,
      accion: e.accion,
      usuario: e.usuario_nombre || 'Anónimo',
      ip: e.ip,
      detalle: e.detalles,
      fecha: e.created_at,
      modulo: MODULOS.SEGURIDAD,
      resultado: 'ERROR',
    })),
  };
}

function mapRow(row) {
  let detalle = null;
  if (row.detalle_json) {
    try {
      detalle = typeof row.detalle_json === 'string' ? JSON.parse(row.detalle_json) : row.detalle_json;
    } catch {
      detalle = row.detalle_json;
    }
  }

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    usuarioNombre: row.usuario_nombre,
    usuarioEmail: row.usuario_email,
    rolNombre: row.rol_nombre_actual || row.rol_nombre,
    accion: row.accion,
    modulo: row.modulo || row.entidad,
    resultado: row.resultado || 'EXITO',
    entidad: row.entidad,
    entidadId: row.entidad_id,
    detalle,
    ip: row.ip,
    userAgent: row.user_agent,
    fecha: row.created_at,
  };
}

module.exports = { log, list, getSeguridadReciente, resolveModulo };
