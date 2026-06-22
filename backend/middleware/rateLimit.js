/**
 * backend/middleware/rateLimit.js
 * Express rate limiting middleware
 */

const rateLimitStore = {};

/**
 * Crear middleware de rate limiting
 * @param {number} maxRequests - Número máximo de solicitudes
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 */
function createRateLimiter(maxRequests = 10, windowSeconds = 60) {
  return (req, res, next) => {
    const identifier =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();

    // Inicializar o recuperar registro
    if (!rateLimitStore[identifier]) {
      rateLimitStore[identifier] = {
        count: 0,
        resetTime: now + windowSeconds * 1000, 
      };
    }

    const record = rateLimitStore[identifier];

    // Limpiar si la ventana expiró
    if (now >= record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowSeconds * 1000;
    }

    // Incrementar contador
    record.count++;

    // Rechazar si se excede el límite
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes. Intente más tarde.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Middleware para login: máximo 5 intentos en 15 minutos
 */
const loginRateLimit = createRateLimiter(5, 900);

/**
 * Middleware para validación QR: máximo 100 en 1 hora
 */
const qrValidationRateLimit = createRateLimiter(100, 3600);

/**
 * Middleware para API general: máximo 1000 en 1 minuto
 */
const apiRateLimit = createRateLimiter(1000, 60);

module.exports = {
  createRateLimiter,
  loginRateLimit,
  qrValidationRateLimit,
  apiRateLimit,
};
