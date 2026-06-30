const {
  EMAIL_REGEX,
  ESTADOS_USUARIO,
  TIPOS_DOCUMENTO,
  DOCUMENTO,
  UPLOAD,
} = require('../constants');

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

function isValidEstadoUsuario(estado) {
  return ESTADOS_USUARIO.includes(estado);
}

function minPasswordLength(password, min = 6) {
  return typeof password === 'string' && password.length >= min;
}

function isValidDocumento(documento) {
  if (!documento || typeof documento !== 'string') return false;
  const trimmed = documento.trim();
  return (
    trimmed.length >= DOCUMENTO.MIN_LENGTH &&
    trimmed.length <= DOCUMENTO.MAX_LENGTH &&
    /^[A-Za-z0-9.-]+$/.test(trimmed)
  );
}

function isValidTipoDocumento(tipo) {
  return TIPOS_DOCUMENTO.includes(tipo);
}

function isValidTelefono(telefono) {
  if (!telefono || typeof telefono !== 'string') return true;
  const cleaned = telefono.trim();
  if (!cleaned) return true;
  return /^[\d\s+()-]{7,30}$/.test(cleaned);
}

function validatePhotoFile(file) {
  if (!file) return { valid: true };

  if (!UPLOAD.ALLOWED_MIMES.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Formato no permitido. Use JPEG, PNG o WebP.',
    };
  }

  const maxBytes = UPLOAD.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `La foto no puede superar ${UPLOAD.MAX_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}

module.exports = {
  isValidEmail,
  isValidEstadoUsuario,
  minPasswordLength,
  isValidDocumento,
  isValidTipoDocumento,
  isValidTelefono,
  validatePhotoFile,
};
