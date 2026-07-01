const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const catalogRoutes = require('./catalog.routes');
const organizacionRoutes = require('./organizacion.routes');
const rolesRoutes = require('./roles.routes');
const carnetsRoutes = require('./carnets.routes');
const validacionRoutes = require('./validacion.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportesRoutes = require('./reportes.routes');
const auditoriaRoutes = require('./auditoria.routes');
const sistemaRoutes = require('./sistema.routes');
const notificacionesRoutes = require('./notificaciones.routes');
const sesionesRoutes = require('./sesiones.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/catalogos', catalogRoutes);
router.use('/', organizacionRoutes);
router.use('/', rolesRoutes);
router.use('/', carnetsRoutes);
router.use('/', usersRoutes);
router.use('/', validacionRoutes);
router.use('/', dashboardRoutes);
router.use('/', reportesRoutes);
router.use('/', auditoriaRoutes);
router.use('/', sistemaRoutes);
router.use('/', notificacionesRoutes);
router.use('/', sesionesRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SENA Carnés API',
  });
});

module.exports = router;
