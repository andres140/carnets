const express = require('express');
const configuracionController = require('../controllers/configuracion.controller');
const monitoreoController = require('../controllers/monitoreo.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { PERMISOS } = require('../constants');
const multer = require('multer');
const path = require('path');
const env = require('../config/env');

const router = express.Router();

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.upload.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `logo-institucional${ext}`);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const adminOnly = [requireAuth, requirePermission(PERMISOS.CONFIG_GESTIONAR)];

router.get('/configuracion/sistema', ...adminOnly, configuracionController.get);
router.put('/configuracion/sistema', ...adminOnly, csrfProtection, configuracionController.update);
router.post(
  '/configuracion/sistema/logo',
  ...adminOnly,
  csrfProtection,
  logoUpload.single('logo'),
  configuracionController.uploadLogo
);

router.get('/monitoreo/estado', ...adminOnly, monitoreoController.estado);
router.get('/monitoreo/seguridad', ...adminOnly, monitoreoController.seguridad);

module.exports = router;
