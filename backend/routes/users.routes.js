const express = require('express');
const usersController = require('../controllers/users.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser } = require('../middleware/validate');
const { upload } = require('../config/upload');

const router = express.Router();

const adminOrCoord = [requireAuth, requireRole('ADMINISTRADOR', 'COORDINADOR')];

router.get('/catalogos/roles', ...adminOrCoord, usersController.getRoles);
router.get('/catalogos/regionales', ...adminOrCoord, usersController.getRegionales);
router.get('/catalogos/centros', ...adminOrCoord, usersController.getCentros);
router.get('/catalogos/dependencias', ...adminOrCoord, usersController.getDependencias);

router.get('/usuarios', ...adminOrCoord, usersController.list);
router.get('/usuarios/:id', ...adminOrCoord, usersController.getOne);

router.post(
  '/usuarios',
  ...adminOrCoord,
  upload.single('foto'),
  validateCreateUser,
  usersController.create
);

router.put(
  '/usuarios/:id',
  ...adminOrCoord,
  upload.single('foto'),
  validateUpdateUser,
  usersController.update
);

router.patch('/usuarios/:id/desactivar', ...adminOrCoord, usersController.deactivate);
router.patch('/usuarios/:id/reactivar', ...adminOrCoord, usersController.reactivate);

module.exports = router;
