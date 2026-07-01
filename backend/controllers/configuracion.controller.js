const configuracionService = require('../services/configuracion.service');
const notificacionesService = require('../services/notificaciones.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { actorFromSession, logAudit } = require('../utils/auditHelper');
const { CONFIG_KEYS } = require('../constants');
const path = require('path');
const fs = require('fs');

const get = asyncHandler(async (req, res) => {
  const data = await configuracionService.getAll();
  return res.json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const actor = actorFromSession(req);
  const cambios = await configuracionService.updateMany(req.body, actor.id);

  await logAudit(req, {
    accion: 'ACTUALIZAR_CONFIG',
    entidad: 'Configuracion',
    entidadId: 'sistema',
    detalle: { cambios },
    modulo: 'Configuración',
  });

  await notificacionesService.notifyConfigChange(actor.id, cambios);

  const data = await configuracionService.getAll();
  return res.json({ success: true, data, message: 'Configuración actualizada' });
});

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Archivo de logo requerido' });
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  await configuracionService.updateMany({ [CONFIG_KEYS.LOGO_URL]: logoUrl }, actorFromSession(req).id);

  await logAudit(req, {
    accion: 'ACTUALIZAR_LOGO',
    entidad: 'Configuracion',
    entidadId: 'logo',
    detalle: { logoUrl },
  });

  return res.json({ success: true, data: { logoUrl } });
});

module.exports = { get, update, uploadLogo };
