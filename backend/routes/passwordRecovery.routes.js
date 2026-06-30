/**
 * backend/routes/passwordRecovery.routes.js
 * Password recovery and reset routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const passwordRecoveryService = require('../services/passwordRecoveryService');
const emailService = require('../lib/emailService');
const { sanitizeEmail } = require('../lib/inputSanitizer');
const { validatePassword } = require('../lib/passwordValidator');
const { loginRateLimit } = require('../middleware/rateLimit');
const { getClientIp } = require('../utils/request');
const db = require('../config/database');

const router = express.Router();

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/forgot-password', loginRateLimit, async (req, res, next) => {
  try {
    const { email } = req.body;
    const ipAddress = getClientIp(req);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido',
      });
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
    }

    const result = await passwordRecoveryService.requestPasswordReset(
      sanitizedEmail,
      ipAddress
    );

    // Buscar usuario para enviar email
    const users = await db.query(
      'SELECT id, nombre_completo FROM usuarios WHERE email = ?',
      [sanitizedEmail]
    );

    if (users.length > 0) {
      const user = users[0];
      const resetToken = result.token;
      const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

      emailService
        .sendPasswordResetEmail(sanitizedEmail, resetLink, user.nombre_completo)
        .catch((err) => console.error('Error enviando email:', err));
    }

    return res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones de reset',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/validate-reset-token
 * Validar token de reset
 */
router.post('/validate-reset-token', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido',
      });
    }

    const validation = await passwordRecoveryService.validateResetToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Devolver información del usuario (sin sensibles)
    return res.json({
      success: true,
      email: validation.data.email,
      userName: validation.data.nombre,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 * Resetear contraseña con token
 */
router.post('/reset-password', loginRateLimit, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = getClientIp(req);

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token y contraseña son requeridos',
      });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña no válida',
        details: passwordValidation.errors,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await passwordRecoveryService.resetPassword(token, passwordHash, ipAddress);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/password-recovery/status
 * Obtener estado de tokens pendientes (para admin)
 */
router.get('/status', async (req, res, next) => {
  try {
    // Verificar autenticación
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }

    // Solo administradores
    if (req.session.user.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
      });
    }

    const query = `
      SELECT COUNT(*) as pendientes FROM password_reset_tokens
      WHERE used_at IS NULL AND expires_at > NOW()
    `;

    const results = await db.query(query);

    return res.json({
      success: true,
      tokensPendientes: results[0].pendientes,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
