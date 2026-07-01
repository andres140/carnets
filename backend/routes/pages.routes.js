const express = require('express');
const path = require('path');
const { requireAuth, redirectIfAuthenticated, requirePermission } = require('../middleware/auth');
const { PERMISOS } = require('../constants');

const router = express.Router();
const pagesDir = path.join(__dirname, '../../public/pages');

const canOrganizacion = [
  requireAuth,
  requirePermission(
    PERMISOS.REGIONALES_GESTIONAR,
    PERMISOS.CENTROS_GESTIONAR,
    PERMISOS.DEPENDENCIAS_GESTIONAR,
    PERMISOS.ROLES_GESTIONAR,
    PERMISOS.PERMISOS_GESTIONAR
  ),
];

router.get('/login.html', redirectIfAuthenticated, (_req, res) => {
  res.sendFile(path.join(pagesDir, 'login.html'));
});

router.get('/login', redirectIfAuthenticated, (_req, res) => {
  res.redirect('/login.html');
});

router.get('/dashboard.html', requireAuth, (_req, res) => {
  res.sendFile(path.join(pagesDir, 'dashboard.html'));
});

router.get(
  '/usuarios.html',
  requireAuth,
  requirePermission(PERMISOS.USUARIOS_VER),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'usuarios.html'));
  }
);

router.get('/organizacion.html', ...canOrganizacion, (_req, res) => {
  res.sendFile(path.join(pagesDir, 'organizacion.html'));
});

router.get(
  '/carnets.html',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'carnets.html'));
  }
);

router.get(
  '/reportes.html',
  requireAuth,
  requirePermission(PERMISOS.REPORTES_VER),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'reportes.html'));
  }
);

router.get(
  '/auditoria.html',
  requireAuth,
  requirePermission(PERMISOS.AUDITORIA_VER),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'auditoria.html'));
  }
);

router.get(
  '/sistema.html',
  requireAuth,
  requirePermission(PERMISOS.CONFIG_GESTIONAR),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'sistema.html'));
  }
);

module.exports = router;
