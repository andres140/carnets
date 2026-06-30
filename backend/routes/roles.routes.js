const express = require('express');
const rolesController = require('../controllers/roles.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { PERMISOS } = require('../constants');

const router = express.Router();
const mutate = [csrfProtection];

const canViewRoles = [requireAuth, requirePermission(PERMISOS.ROLES_GESTIONAR)];
const canManageRoles = [requireAuth, requirePermission(PERMISOS.ROLES_GESTIONAR)];
const canManagePermisos = [requireAuth, requirePermission(PERMISOS.PERMISOS_GESTIONAR)];

router.get('/roles', ...canViewRoles, rolesController.listRoles);
router.get('/roles/:id', ...canViewRoles, rolesController.getRol);
router.post('/roles', ...canManageRoles, ...mutate, rolesController.createRol);
router.put('/roles/:id', ...canManageRoles, ...mutate, rolesController.updateRol);
router.patch('/roles/:id/desactivar', ...canManageRoles, ...mutate, rolesController.deactivateRol);
router.patch('/roles/:id/reactivar', ...canManageRoles, ...mutate, rolesController.reactivateRol);
router.put('/roles/:id/permisos', ...canManageRoles, ...mutate, rolesController.setRolPermisos);

router.get(
  '/permisos',
  requireAuth,
  requirePermission(PERMISOS.PERMISOS_GESTIONAR, PERMISOS.ROLES_GESTIONAR),
  rolesController.listPermisos
);
router.post('/permisos', ...canManagePermisos, ...mutate, rolesController.createPermiso);
router.put('/permisos/:id', ...canManagePermisos, ...mutate, rolesController.updatePermiso);

module.exports = router;
