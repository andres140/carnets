const { hasPermission } = require('../utils/permissions');

function isApiRequest(req) {
  return (
    req.originalUrl.startsWith('/api') ||
    req.get('Accept')?.includes('application/json') ||
    req.get('X-Requested-With') === 'XMLHttpRequest'
  );
}

function assertActiveUser(user, res, isApi) {
  if (!user) return false;
  if (user.estado && user.estado !== 'ACTIVO') {
    if (isApi) {
      res.status(403).json({ success: false, error: 'Usuario inactivo o suspendido' });
    } else {
      res.status(403).send('Acceso denegado');
    }
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    if (isApiRequest(req)) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    return res.redirect('/login.html');
  }

  if (!assertActiveUser(req.session.user, res, isApiRequest(req))) return;
  next();
}

function requirePermission(...permisos) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!assertActiveUser(req.session.user, res, true)) return;

    const allowed = permisos.some((p) => hasPermission(req.session.user, p));

    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Sin permisos' });
    }

    next();
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      if (isApiRequest(req)) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      return res.redirect('/login.html');
    }

    if (!assertActiveUser(req.session.user, res, isApiRequest(req))) return;

    const userRole = req.session.user.rolNombre;
    if (!roles.includes(userRole)) {
      if (isApiRequest(req)) {
        return res.status(403).json({ success: false, error: 'Rol no autorizado' });
      }
      return res.status(403).send('Acceso denegado');
    }

    next();
  };
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user) {
    return res.redirect('/dashboard.html');
  }
  next();
}

module.exports = {
  requireAuth,
  requirePermission,
  requireRole,
  redirectIfAuthenticated,
  isApiRequest,
};
