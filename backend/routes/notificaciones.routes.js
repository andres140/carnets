const express = require('express');
const notificacionesController = require('../controllers/notificaciones.controller');
const { requireAuth } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');

const router = express.Router();

router.get('/notificaciones', requireAuth, notificacionesController.list);
router.patch('/notificaciones/:id/leer', requireAuth, csrfProtection, notificacionesController.markRead);
router.post('/notificaciones/leer-todas', requireAuth, csrfProtection, notificacionesController.markAllRead);

module.exports = router;
