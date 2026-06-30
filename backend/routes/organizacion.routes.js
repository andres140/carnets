const express = require('express');
const organizacionController = require('../controllers/organizacion.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { PERMISOS } = require('../constants');

const router = express.Router();
const mutate = [csrfProtection];

const canViewRegionales = [requireAuth, requirePermission(PERMISOS.REGIONALES_VER, PERMISOS.REGIONALES_GESTIONAR)];
const canManageRegionales = [requireAuth, requirePermission(PERMISOS.REGIONALES_GESTIONAR)];
const canViewCentros = [requireAuth, requirePermission(PERMISOS.CENTROS_VER, PERMISOS.CENTROS_GESTIONAR)];
const canManageCentros = [requireAuth, requirePermission(PERMISOS.CENTROS_GESTIONAR)];
const canViewDependencias = [
  requireAuth,
  requirePermission(PERMISOS.DEPENDENCIAS_VER, PERMISOS.DEPENDENCIAS_GESTIONAR),
];
const canManageDependencias = [requireAuth, requirePermission(PERMISOS.DEPENDENCIAS_GESTIONAR)];

// Regionales
router.get('/regionales', ...canViewRegionales, organizacionController.listRegionales);
router.get('/regionales/:id', ...canViewRegionales, organizacionController.getRegional);
router.post('/regionales', ...canManageRegionales, ...mutate, organizacionController.createRegional);
router.put('/regionales/:id', ...canManageRegionales, ...mutate, organizacionController.updateRegional);
router.patch(
  '/regionales/:id/desactivar',
  ...canManageRegionales,
  ...mutate,
  organizacionController.deactivateRegional
);
router.patch(
  '/regionales/:id/reactivar',
  ...canManageRegionales,
  ...mutate,
  organizacionController.reactivateRegional
);

// Centros
router.get('/centros', ...canViewCentros, organizacionController.listCentros);
router.get('/centros/:id', ...canViewCentros, organizacionController.getCentro);
router.post('/centros', ...canManageCentros, ...mutate, organizacionController.createCentro);
router.put('/centros/:id', ...canManageCentros, ...mutate, organizacionController.updateCentro);
router.patch(
  '/centros/:id/desactivar',
  ...canManageCentros,
  ...mutate,
  organizacionController.deactivateCentro
);
router.patch(
  '/centros/:id/reactivar',
  ...canManageCentros,
  ...mutate,
  organizacionController.reactivateCentro
);

// Dependencias
router.get('/dependencias', ...canViewDependencias, organizacionController.listDependencias);
router.get('/dependencias/:id', ...canViewDependencias, organizacionController.getDependencia);
router.post('/dependencias', ...canManageDependencias, ...mutate, organizacionController.createDependencia);
router.put('/dependencias/:id', ...canManageDependencias, ...mutate, organizacionController.updateDependencia);
router.patch(
  '/dependencias/:id/desactivar',
  ...canManageDependencias,
  ...mutate,
  organizacionController.deactivateDependencia
);
router.patch(
  '/dependencias/:id/reactivar',
  ...canManageDependencias,
  ...mutate,
  organizacionController.reactivateDependencia
);

module.exports = router;
