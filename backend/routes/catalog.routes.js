const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISOS } = require('../constants');

const router = express.Router();

const canUseCatalog = [
  requireAuth,
  requirePermission(
    PERMISOS.USUARIOS_VER,
    PERMISOS.USUARIOS_CREAR,
    PERMISOS.USUARIOS_EDITAR,
    PERMISOS.REGIONALES_VER,
    PERMISOS.REGIONALES_GESTIONAR,
    PERMISOS.CENTROS_VER,
    PERMISOS.CENTROS_GESTIONAR,
    PERMISOS.DEPENDENCIAS_VER,
    PERMISOS.DEPENDENCIAS_GESTIONAR,
    PERMISOS.ROLES_GESTIONAR,
    PERMISOS.REPORTES_VER
  ),
];

router.get('/roles', ...canUseCatalog, catalogController.getRoles);
router.get('/regionales', ...canUseCatalog, catalogController.getRegionales);
router.get('/centros', ...canUseCatalog, catalogController.getCentros);
router.get('/dependencias', ...canUseCatalog, catalogController.getDependencias);

module.exports = router;
