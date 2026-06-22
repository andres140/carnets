/**
 * Validaciones de entrada
 */
function sendValidationErrors(res, errors) {
  return res.status(400).json({ success: false, error: errors.join('. ') });
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('El email es requerido');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('El email no es válido');
  }

  if (!password || typeof password !== 'string') {
    errors.push('La contraseña es requerida');
  } else if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

function validateCreateUser(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (!body.documento?.trim()) errors.push('El documento es obligatorio');
  if (!body.nombres?.trim()) errors.push('Los nombres son obligatorios');
  if (!body.apellidos?.trim()) errors.push('Los apellidos son obligatorios');
  if (!body.email?.trim()) {
    errors.push('El correo es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('El formato del correo no es válido');
  }
  if (!body.password || body.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  if (!body.rolId) errors.push('El rol es obligatorio');

  const estados = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
  if (body.estado && !estados.includes(body.estado)) {
    errors.push('Estado no válido');
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

function validateUpdateUser(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (body.documento !== undefined && !body.documento?.trim()) {
    errors.push('El documento no puede estar vacío');
  }
  if (body.nombres !== undefined && !body.nombres?.trim()) {
    errors.push('Los nombres no pueden estar vacíos');
  }
  if (body.apellidos !== undefined && !body.apellidos?.trim()) {
    errors.push('Los apellidos no pueden estar vacíos');
  }
  if (body.email !== undefined) {
    if (!body.email?.trim()) {
      errors.push('El correo no puede estar vacío');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      errors.push('El formato del correo no es válido');
    }
  }
  if (body.password && body.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  const estados = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];
  if (body.estado && !estados.includes(body.estado)) {
    errors.push('Estado no válido');
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

module.exports = { validateLogin, validateCreateUser, validateUpdateUser };
