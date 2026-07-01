const authService = require('../services/auth.service');
const auditoriaService = require('../services/auditoria.service');
const securityAuditService = require('../services/securityAuditService');
const sesionesService = require('../services/sesiones.service');
const configuracionService = require('../services/configuracion.service');
const { validatePassword } = require('../lib/passwordValidator');
const { sanitizeEmail, detectSqlInjection, detectXss } = require('../lib/inputSanitizer');
const { getClientIp, getUserAgent } = require('../utils/request');
const { MODULOS } = require('../constants');
const env = require('../config/env');

async function logAuthEvent(params) {
  try {
    await auditoriaService.log({
      ...params,
      entidad: 'Usuario',
      modulo: MODULOS.AUTH,
    });
  } catch (err) {
    console.error('Error en auditoría auth:', err.message);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const clientIp = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!email || !password) {
      await securityAuditService.logSecurityEvent({
        tipo: 'LOGIN_ATTEMPT_INVALID',
        ip: clientIp,
        detalles: { razon: 'Email o contraseña faltantes' },
      }).catch(() => {});
      await logAuthEvent({
        accion: 'LOGIN_INTENTO_INVALIDO',
        resultado: 'ERROR',
        detalle: { razon: 'Campos faltantes' },
        ip: clientIp,
        userAgent,
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
      }).catch(() => {});
      await logAuthEvent({
        accion: 'LOGIN_EMAIL_INVALIDO',
        resultado: 'ERROR',
        detalle: { email: email.substring(0, 30) },
        ip: clientIp,
        userAgent,
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
      }).catch(() => {});
      return res.status(400).json({ success: false, error: 'Solicitud rechazada' });
    }

    if (detectXss(email) || detectXss(password)) {
      await securityAuditService.logSecurityEvent({
        tipo: 'XSS_ATTEMPT',
        ip: clientIp,
        detalles: { campo: 'auth' },
      }).catch(() => {});
      return res.status(400).json({ success: false, error: 'Solicitud rechazada' });
    }

    const user = await authService.authenticate(sanitizedEmail, password);
    if (!user) {
      await securityAuditService.logSecurityEvent({
        tipo: 'LOGIN_FAILED',
        ip: clientIp,
        detalles: { email: sanitizedEmail },
      }).catch(() => {});
      await logAuthEvent({
        accion: 'LOGIN_FALLIDO',
        resultado: 'ERROR',
        detalle: { email: sanitizedEmail },
        ip: clientIp,
        userAgent,
      });
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas o usuario inactivo',
      });
    }

    const passwordValidation = validatePassword(password);
    req.session.user = user;

    const maxAge = await configuracionService.get('session_max_age_ms');
    if (maxAge && req.session.cookie) {
      req.session.cookie.maxAge = Number(maxAge) || env.session.maxAge;
    }

    await sesionesService.registerLogin(req, user);

    await logAuthEvent({
      usuarioId: user.id,
      rolNombre: user.rolNombre,
      accion: 'LOGIN',
      resultado: 'EXITO',
      entidadId: user.id,
      ip: clientIp,
      userAgent,
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
    const user = req.session?.user;
    const clientIp = getClientIp(req);
    const userAgent = getUserAgent(req);

    await sesionesService.closeSession(req);

    req.session.destroy(async (err) => {
      if (err) return next(err);

      if (userId) {
        await logAuthEvent({
          usuarioId: userId,
          rolNombre: user?.rolNombre,
          accion: 'LOGOUT',
          resultado: 'EXITO',
          entidadId: userId,
          ip: clientIp,
          userAgent,
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
