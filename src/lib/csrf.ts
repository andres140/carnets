/**
 * src/lib/csrf.ts
 * CSRF protection utilities
 */

import crypto from 'crypto';

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Generar token CSRF único
 */
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 3600000; // 1 hora

  csrfTokens.set(sessionId, { token, expiresAt });
  return token;
}

/**
 * Validar token CSRF
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

/**
 * Limpiar tokens expirados (ejecutar periódicamente)
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  for (const [sessionId, { expiresAt }] of csrfTokens.entries()) {
    if (now > expiresAt) {
      csrfTokens.delete(sessionId);
    }
  }
}
