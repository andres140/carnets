const authService = require('../services/auth.service');
const auditoriaService = require('../services/auditoria.service');
const securityAuditService = require('../services/securityAuditService');
const { validatePassword } = require('../lib/passwordValidator');
const { sanitizeEmail, detectSqlInjection, detectXss } = require('../lib/inputSanitizer');
const { getClientIp } = require('../utils/request');
const env = require('../config/env');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const clientIp = getClientIp(req);

    if (!email || !password) {
      await securityAuditService.logSecurityEvent({
        tipo: 'LOGIN_ATTEMPT_INVALID',
        ip: clientIp,
        detalles: { razon: 'Email o contraseña faltantes' },
      });
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos',
      });
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      await securityAuditService.logSecurityEvent({
        tipo: 'LOGIN_ATTEMPT_INVALID_EMAIL',
        ip: clientIp,
        detalles: { email: email.substring(0, 20) },
      });
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
      });
    }

    if (detectSqlInjection(email) || detectSqlInjection(password)) {
      await securityAuditService.logSecurityEvent({
        tipo: 'SQL_INJECTION_ATTEMPT',
        ip: clientIp,
        detalles: { campo: 'auth' },
      });
      return res.status(400).json({ success: false, error: 'Solicitud rechazada' });
    }

    if (detectXss(email) || detectXss(password)) {
      await securityAuditService.logSecurityEvent({
        tipo: 'XSS_ATTEMPT',
        ip: clientIp,
        detalles: { campo: 'auth' },
      });
      return res.status(400).json({ success: false, error: 'Solicitud rechazada' });
    }

    const user = await authService.authenticate(sanitizedEmail, password);
    if (!user) {
      await securityAuditService.logSecurityEvent({
        tipo: 'LOGIN_FAILED',
        ip: clientIp,
        detalles: { email: sanitizedEmail },
      });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas o usuario inactivo',
      });
    }

    const passwordValidation = validatePassword(password);
    req.session.user = user;

    await auditoriaService.log({
      usuarioId: user.id,
      accion: 'LOGIN',
      entidad: 'Usuario',
      entidadId: user.id,
      ip: clientIp,
    });

    return res.json({
      success: true,
      data: user,
      message: 'Sesión iniciada',
      passwordStrength: passwordValidation.strength,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const userId = req.session?.user?.id;
    const clientIp = getClientIp(req);

    req.session.destroy(async (err) => {
      if (err) return next(err);

      if (userId) {
        await auditoriaService.log({
          usuarioId: userId,
          accion: 'LOGOUT',
          entidad: 'Usuario',
          entidadId: userId,
          ip: clientIp,
        });
      }

      res.clearCookie(env.session.name);
      return res.json({ success: true, message: 'Sesión cerrada' });
    });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  return res.json({ success: true, data: req.session.user });
}

function csrfToken(req, res) {
  if (!req.session?.csrfToken) {
    return res.status(500).json({
      success: false,
      error: 'No se pudo generar token CSRF',
    });
  }
  return res.json({
    success: true,
    data: { csrfToken: req.session.csrfToken },
  });
}

module.exports = { login, logout, me, csrfToken };
