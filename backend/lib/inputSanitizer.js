/**
 * backend/lib/inputSanitizer.js
 * Input validation and sanitization utilities
 */

/**
 * Sanitizar email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitizar teléfono - solo dígitos
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 7 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitizar string - remover caracteres especiales peligrosos
 */
function sanitizeString(str, maxLength = 255) {
  if (!str || typeof str !== 'string') {
    return null;
  }

  // Remover tags HTML
  let cleaned = str.replace(/<[^>]*>/g, '');

  // Remover caracteres de control
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

  // Limitar longitud
  cleaned = cleaned.substring(0, maxLength).trim();

  return cleaned || null;
}

/**
 * Validar archivo - revisar MIME type y tamaño
 */
function validateFile(file, allowedMimes = [], maxSizeMb = 5) {
  if (!file) {
    return { valid: false, error: 'Archivo requerido' };
  }

  // Validar MIME type
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${allowedMimes.join(', ')}`,
    };
  }

  // Validar tamaño (en bytes)
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo es muy grande. Máximo: ${maxSizeMb}MB`,
    };
  }

  return { valid: true };
}

/**
 * Detectar ataques SQL injection
 */
function detectSqlInjection(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bselect\b.*\bfrom\b)/i,
    /(\binsert\b.*\binto\b)/i,
    /(\bupdate\b.*\bset\b)/i,
    /(\bdelete\b.*\bfrom\b)/i,
    /(\bdrop\b.*\b(table|database)\b)/i,
    /(-{2}|\/\*|\*\/)/,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detectar XSS
 */
function detectXss(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

module.exports = {
  sanitizeEmail,
  sanitizePhone,
  sanitizeString,
  validateFile,
  detectSqlInjection,
  detectXss,
};
