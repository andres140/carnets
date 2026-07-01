const express = require('express');
const sesionesController = require('../controllers/sesiones.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { PERMISOS } = require('../constants');

const router = express.Router();

const adminOnly = [requireAuth, requirePermission(PERMISOS.CONFIG_GESTIONAR)];

router.get('/sesiones', ...adminOnly, sesionesController.list);
router.post('/sesiones/:id/revoke', ...adminOnly, csrfProtection, sesionesController.revoke);
router.get('/sesiones/mis-accesos', requireAuth, sesionesController.misAccesos);

module.exports = router;
