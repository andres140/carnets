/**
 * Validaciones de entrada HTTP — delega reglas a utils/validators y constants.
 */
const {
  isValidEmail,
  isValidEstadoUsuario,
  minPasswordLength,
  isValidDocumento,
  isValidTipoDocumento,
  isValidTelefono,
  validatePhotoFile,
} = require('../utils/validators');

function sendValidationErrors(res, errors) {
  return res.status(400).json({ success: false, error: errors.join('. ') });
}

function validateUserFields(body, { requirePassword = false } = {}) {
  const errors = [];

  if (body.documento !== undefined) {
    if (!body.documento?.trim()) {
      errors.push('El documento es obligatorio');
    } else if (!isValidDocumento(body.documento)) {
      errors.push(
        'El documento debe tener entre 5 y 50 caracteres alfanuméricos'
      );
    }
  }

  if (body.nombres !== undefined && !body.nombres?.trim()) {
    errors.push('Los nombres son obligatorios');
  }

  if (body.apellidos !== undefined && !body.apellidos?.trim()) {
    errors.push('Los apellidos son obligatorios');
  }

  if (body.email !== undefined) {
    if (!body.email?.trim()) {
      errors.push('El correo es obligatorio');
    } else if (!isValidEmail(body.email)) {
      errors.push('El formato del correo no es válido');
    }
  }

  if (body.tipoDocumento && !isValidTipoDocumento(body.tipoDocumento)) {
    errors.push('Tipo de documento no válido');
  }

  if (body.telefono !== undefined && !isValidTelefono(body.telefono)) {
    errors.push('El teléfono no tiene un formato válido');
  }

  if (requirePassword && !minPasswordLength(body.password)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  } else if (body.password && !minPasswordLength(body.password)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (!requirePassword && body.rolId !== undefined && !body.rolId) {
    errors.push('El rol es obligatorio');
  }
  if (requirePassword && !body.rolId) {
    errors.push('El rol es obligatorio');
  }

  if (body.estado && !isValidEstadoUsuario(body.estado)) {
    errors.push('Estado no válido');
  }

  return errors;
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('El email es requerido');
  } else if (!isValidEmail(email)) {
    errors.push('El email no es válido');
  }

  if (!minPasswordLength(password)) {
    errors.push('La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

function validateCreateUser(req, res, next) {
  const errors = validateUserFields(req.body || {}, { requirePassword: true });

  if (req.file) {
    const photoCheck = validatePhotoFile(req.file);
    if (!photoCheck.valid) errors.push(photoCheck.error);
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

function validateUpdateUser(req, res, next) {
  const errors = validateUserFields(req.body || {}, { requirePassword: false });

  if (req.file) {
    const photoCheck = validatePhotoFile(req.file);
    if (!photoCheck.valid) errors.push(photoCheck.error);
  }

  if (errors.length > 0) return sendValidationErrors(res, errors);
  next();
}

module.exports = { validateLogin, validateCreateUser, validateUpdateUser };
