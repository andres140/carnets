const express = require('express');
const reportesController = require('../controllers/reportes.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISOS } = require('../constants');

const router = express.Router();

const canViewReports = [requireAuth, requirePermission(PERMISOS.REPORTES_VER)];

router.get('/reportes/estadisticas', ...canViewReports, reportesController.estadisticas);
router.get('/reportes/usuarios', ...canViewReports, reportesController.usuarios);
router.get('/reportes/carnets', ...canViewReports, reportesController.carnets);
router.get('/reportes/validaciones', ...canViewReports, reportesController.validaciones);
router.get('/reportes/busqueda', ...canViewReports, reportesController.busqueda);

router.get('/reportes/usuarios/export', ...canViewReports, reportesController.exportUsuarios);
router.get('/reportes/carnets/export', ...canViewReports, reportesController.exportCarnets);
router.get('/reportes/validaciones/export', ...canViewReports, reportesController.exportValidaciones);

module.exports = router;
