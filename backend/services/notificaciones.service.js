const notificacionesRepository = require('../repositories/notificaciones.repository');
const { NOTIFICACION_TIPOS, REPORT } = require('../constants');
const dashboardRepository = require('../repositories/dashboard.repository');
const auditoriaRepository = require('../repositories/auditoria.repository');

async function notify(entry) {
  return notificacionesRepository.create(entry);
}

async function listForUser(usuarioId, queryParams = {}) {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, parseInt(queryParams.limit, 10) || 20);
  const offset = (page - 1) * limit;

  const [items, noLeidas] = await Promise.all([
    notificacionesRepository.findForUser(usuarioId, {
      limit,
      offset,
      soloNoLeidas: queryParams.soloNoLeidas === 'true',
    }),
    notificacionesRepository.countUnread(usuarioId),
  ]);

  return {
    items: items.map(mapRow),
    noLeidas,
    pagination: { page, limit, total: items.length },
  };
}

async function markRead(id, usuarioId) {
  return notificacionesRepository.markRead(id, usuarioId);
}

async function markAllRead(usuarioId) {
  await notificacionesRepository.markAllRead(usuarioId);
}

async function generateSystemAlerts(actor) {
  const created = [];
  const userId = actor?.id || null;
  const isAdmin = actor?.tipoUsuario === 'ADMINISTRADOR' || actor?.permisos?.includes('config.gestionar');

  const alertas = await dashboardRepository.getAlertas(actor || {});

  if (isAdmin && alertas.proximosVencer?.length) {
    const exists = await notificacionesRepository.existsRecent(
      NOTIFICACION_TIPOS.CARNET_VENCER,
      null,
      12
    );
    if (!exists) {
      const id = await notify({
        usuarioId: null,
        tipo: NOTIFICACION_TIPOS.CARNET_VENCER,
        titulo: 'Carnés próximos a vencer',
        mensaje: `${alertas.proximosVencer.length} carné(s) vencen en los próximos ${REPORT.PROXIMOS_VENCER_DIAS} días.`,
        metadata: { count: alertas.proximosVencer.length },
      });
      created.push(id);
    }
  }

  if (isAdmin && alertas.usuariosSinFoto?.length) {
    const exists = await notificacionesRepository.existsRecent(NOTIFICACION_TIPOS.SIN_FOTO, null, 24);
    if (!exists) {
      const id = await notify({
        usuarioId: null,
        tipo: NOTIFICACION_TIPOS.SIN_FOTO,
        titulo: 'Usuarios sin fotografía',
        mensaje: `${alertas.usuariosSinFoto.length} usuario(s) activo(s) sin foto registrada.`,
        metadata: { count: alertas.usuariosSinFoto.length },
      });
      created.push(id);
    }
  }

  const eventosSeg = await auditoriaRepository.countSeguridadReciente(1);
  if (isAdmin && eventosSeg >= 5) {
    const exists = await notificacionesRepository.existsRecent(
      NOTIFICACION_TIPOS.ACCESO_SOSPECHOSO,
      null,
      1
    );
    if (!exists) {
      const id = await notify({
        usuarioId: null,
        tipo: NOTIFICACION_TIPOS.ACCESO_SOSPECHOSO,
        titulo: 'Actividad sospechosa detectada',
        mensaje: `${eventosSeg} evento(s) de seguridad en la última hora.`,
        metadata: { count: eventosSeg },
      });
      created.push(id);
    }
  }

  if (userId) {
    const unread = await notificacionesRepository.countUnread(userId);
    return { generated: created.length, noLeidas: unread };
  }

  return { generated: created.length };
}

async function notifyExportComplete(usuarioId, meta) {
  return notify({
    usuarioId,
    tipo: NOTIFICACION_TIPOS.EXPORTACION,
    titulo: 'Exportación completada',
    mensaje: `Reporte ${meta.tipo} exportado en formato ${meta.format}.`,
    metadata: meta,
  });
}

async function notifyConfigChange(usuarioId, cambios) {
  return notify({
    usuarioId: null,
    tipo: NOTIFICACION_TIPOS.CONFIG_CAMBIO,
    titulo: 'Configuración del sistema actualizada',
    mensaje: `Se modificaron ${cambios.length} parámetro(s) del sistema.`,
    metadata: { cambios, por: usuarioId },
  });
}

function mapRow(row) {
  let metadata = null;
  if (row.metadata) {
    try {
      metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      metadata = row.metadata;
    }
  }
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    mensaje: row.mensaje,
    leida: Boolean(row.leida),
    metadata,
    fecha: row.created_at,
  };
}

module.exports = {
  notify,
  listForUser,
  markRead,
  markAllRead,
  generateSystemAlerts,
  notifyExportComplete,
  notifyConfigChange,
};
