const express = require('express');
const auditoriaController = require('../controllers/auditoria.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISOS } = require('../constants');

const router = express.Router();

router.get(
  '/auditoria',
  requireAuth,
  requirePermission(PERMISOS.AUDITORIA_VER),
  auditoriaController.list
);

router.get(
  '/auditoria/seguridad',
  requireAuth,
  requirePermission(PERMISOS.AUDITORIA_VER, PERMISOS.CONFIG_GESTIONAR),
  auditoriaController.seguridad
);

module.exports = router;
