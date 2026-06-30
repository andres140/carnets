const express = require('express');
const usersController = require('../controllers/users.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser } = require('../middleware/validate');
const { csrfProtection } = require('../middleware/csrf');
const { upload } = require('../config/upload');
const { PERMISOS } = require('../constants');

const router = express.Router();

const mutate = [csrfProtection];

router.get(
  '/usuarios',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_VER),
  usersController.list
);

router.get(
  '/usuarios/:id',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_VER),
  usersController.getOne
);

router.post(
  '/usuarios',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_CREAR),
  ...mutate,
  upload.single('foto'),
  validateCreateUser,
  usersController.create
);

router.put(
  '/usuarios/:id',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_EDITAR),
  ...mutate,
  upload.single('foto'),
  validateUpdateUser,
  usersController.update
);

router.patch(
  '/usuarios/:id/desactivar',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_DESACTIVAR),
  ...mutate,
  usersController.deactivate
);

router.patch(
  '/usuarios/:id/reactivar',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_EDITAR),
  ...mutate,
  usersController.reactivate
);

module.exports = router;
