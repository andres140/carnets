/**
 * backend/routes/twoFactorAuth.routes.js
 * Two-factor authentication routes
 */

const express = require('express');
const twoFactorAuthService = require('../services/twoFactorAuthService');
const { requireAuth } = require('../middleware/auth');
const auditoriaService = require('../services/auditoriaService');

const router = express.Router();

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

/**
 * POST /api/auth/2fa/setup
 * Iniciar setup de 2FA
 */
router.post('/setup', requireAuth, async (req, res, next) => {
  try {
    const usuarioId = req.session.user.id;
    const ipAddress = getClientIp(req);

    const result = await twoFactorAuthService.setupTwoFactor(usuarioId, 'TOTP');

    await auditoriaService.log({
      usuarioId,
      accion: '2FA_SETUP_INITIATED',
      entidad: 'Usuario',
      entidadId: usuarioId,
      ip: ipAddress,
    });

    return res.json({
      success: true,
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
      backupCodes: result.backupCodes,
      message: 'Escanea el código QR o ingresa el código manualmente',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verificar y completar setup de 2FA
 */
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const { token } = req.body;
    const usuarioId = req.session.user.id;
    const ipAddress = getClientIp(req);

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido',
      });
    }

    const result = await twoFactorAuthService.verifyAndCompleteTwoFactor(usuarioId, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    await auditoriaService.log({
      usuarioId,
      accion: '2FA_SETUP_COMPLETED',
      entidad: 'Usuario',
      entidadId: usuarioId,
      ip: ipAddress,
    });

    return res.json({
      success: true,
      message: '2FA configurado exitosamente',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/2fa/verify-login
 * Verificar token 2FA durante login
 */
router.post('/verify-login', async (req, res, next) => {
  try {
    const { usuarioId, token } = req.body;

    if (!usuarioId || !token) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y token requeridos',
      });
    }

    const result = await twoFactorAuthService.verifyTwoFactorLogin(usuarioId, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Completar login
    const users = await require('../config/database').query(
      'SELECT * FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length > 0) {
      req.session.user = users[0];

      await auditoriaService.log({
        usuarioId,
        accion: 'LOGIN_2FA_VERIFIED',
        entidad: 'Usuario',
        entidadId: usuarioId,
        ip: getClientIp(req),
      });
    }

    return res.json({
      success: true,
      message: '2FA verificado, sesión iniciada',
      user: users[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/2fa/disable
 * Deshabilitar 2FA
 */
router.post('/disable', requireAuth, async (req, res, next) => {
  try {
    const usuarioId = req.session.user.id;
    const ipAddress = getClientIp(req);

    const result = await twoFactorAuthService.disableTwoFactor(usuarioId);

    await auditoriaService.log({
      usuarioId,
      accion: '2FA_DISABLED',
      entidad: 'Usuario',
      entidadId: usuarioId,
      ip: ipAddress,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/2fa/status
 * Obtener estado de 2FA
 */
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const usuarioId = req.session.user.id;
    const db = require('../config/database');

    const users = await db.query(
      'SELECT two_factor_enabled, two_factor_method, two_factor_verified_at FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const user = users[0];

    return res.json({
      success: true,
      enabled: user.two_factor_enabled,
      method: user.two_factor_method,
      verifiedAt: user.two_factor_verified_at,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
