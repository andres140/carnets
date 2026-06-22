/**
 * backend/middleware/csrf.js
 * CSRF protection middleware for Express
 */

const crypto = require('crypto');

/**
 * Generar token CSRF
 */
function generateCsrfToken(req) {
  if (!req.session) {
    throw new Error('Session required for CSRF protection');
  }

  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  req.session.csrfTokenTime = Date.now();

  return token;
}

/**
 * Validar token CSRF
 */
function validateCsrfToken(req, token) {
  if (!req.session || !req.session.csrfToken) {
    return false;
  }

  // Verificar expiración (1 hora)
  const tokenAge = Date.now() - (req.session.csrfTokenTime || 0);
  if (tokenAge > 3600000) {
    delete req.session.csrfToken;
    delete req.session.csrfTokenTime;
    return false;
  }

  return req.session.csrfToken === token;
}

/**
 * Middleware para verificar CSRF token en POST/PUT/PATCH/DELETE
 */
function csrfProtection(req, res, next) {
  // Skip GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Obtener token del header, body o query
  const token =
    req.headers['x-csrf-token'] ||
    req.body?.csrfToken ||
    req.query?.csrfToken;

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'Token CSRF requerido',
    });
  }

  if (!validateCsrfToken(req, token)) {
    return res.status(403).json({
      success: false,
      error: 'Token CSRF inválido o expirado',
    });
  }

  next();
}

/**
 * Middleware para inyectar token CSRF en las respuestas
 */
function csrfTokenMiddleware(req, res, next) {
  // Generar token si no existe
  if (!req.session.csrfToken) {
    generateCsrfToken(req);
  }

  // Inyectar token en locals para usar en plantillas
  res.locals.csrfToken = req.session.csrfToken;

  next();
}

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  csrfProtection,
  csrfTokenMiddleware,
};
