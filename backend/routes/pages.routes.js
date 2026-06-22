const express = require('express');
const path = require('path');
const { requireAuth, redirectIfAuthenticated, requireRole } = require('../middleware/auth');

const router = express.Router();
const pagesDir = path.join(__dirname, '../../public/pages');

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
  requireRole('ADMINISTRADOR', 'COORDINADOR'),
  (_req, res) => {
    res.sendFile(path.join(pagesDir, 'usuarios.html'));
  }
);

module.exports = router;
