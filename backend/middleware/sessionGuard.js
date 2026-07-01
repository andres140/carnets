/**
 * Valida sesiones revocadas y actualiza actividad.
 */
const sesionesService = require('../services/sesiones.service');

async function sessionGuard(req, res, next) {
  if (!req.session?.user) return next();

  try {
    const valid = await sesionesService.validateSession(req);
    if (!valid) {
      return req.session.destroy(() => {
        res.status(401).json({
          success: false,
          error: 'Sesión cerrada por el administrador',
        });
      });
    }
    await sesionesService.touch(req);
  } catch {
    /* no bloquear por error de tracking */
  }

  return next();
}

module.exports = { sessionGuard };
