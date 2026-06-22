function isApiRequest(req) {
  return (
    req.originalUrl.startsWith('/api') ||
    req.get('Accept')?.includes('application/json') ||
    req.get('X-Requested-With') === 'XMLHttpRequest'
  );
}

function requireAuth(req, res, next) {
  if (req.session?.user) return next();

  if (isApiRequest(req)) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
  return res.redirect('/login.html');
}

function requirePermission(...permisos) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const userPermisos = req.session.user.permisos || [];
    const allowed = permisos.some((p) => userPermisos.includes(p));

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
