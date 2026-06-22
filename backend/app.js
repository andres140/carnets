const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const { createSessionMiddleware } = require('./config/session');
const apiRoutes = require('./routes');
const pageRoutes = require('./routes/pages.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { securityHeadersMiddleware } = require('./middleware/securityHeaders');
const { apiRateLimit } = require('./middleware/rateLimit');
const { csrfTokenMiddleware } = require('./middleware/csrf');

const app = express();
const publicDir = path.join(__dirname, '../public');

// CORS: permitir origen de la app con credenciales de sesión
app.use(
  cors({
    origin: env.appUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Security headers
app.use(securityHeadersMiddleware);

// Rate limiting para API general
app.use('/api', apiRateLimit);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(createSessionMiddleware());

// CSRF token middleware
app.use(csrfTokenMiddleware);

// Archivos estáticos (css, js, uploads)
app.use(express.static(publicDir));

// Página de inicio — verificación de servidor
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// API REST bajo /api
app.use('/api', apiRoutes);

// Páginas HTML (login, dashboard)
app.use(pageRoutes);

// 404 y errores
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
