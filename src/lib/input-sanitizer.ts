/**
 * src/lib/input-sanitizer.ts
 * Sanitización de entrada de datos
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizar string de entrada
 */
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No permitir tags HTML
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitizar email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitizar teléfono (números y caracteres permitidos)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\-\+\(\)\s]/g, '').trim();
}

/**
 * Sanitizar número
 */
export function sanitizeNumber(num: unknown): number | null {
  const parsed = Number(num);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validar MIME type permitido
 */
export function isValidMimeType(
  mimeType: string,
  allowed: string[]
): boolean {
  return allowed.includes(mimeType);
}

/**
 * Validar tamaño de archivo
 */
export function isValidFileSize(
  bytes: number,
  maxMB: number
): boolean {
  return bytes <= maxMB * 1024 * 1024;
}

/**
 * Sanitizar nombre de archivo
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^\w.\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}
