/**
 * src/middleware/rateLimit.ts
 * Rate limiting middleware para protección contra ataques de fuerza bruta
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiter: máximo N requests en T segundos por IP/identificador
 */
export function rateLimit(
  maxRequests: number = 10,
  windowSeconds: number = 60
) {
  return (req: NextRequest) => {
    const identifier =
      req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const now = Date.now();

    // Inicializar o recuperar registro
    if (!rateLimitStore[identifier]) {
      rateLimitStore[identifier] = { count: 0, resetTime: now + windowSeconds * 1000 };
    }

    const record = rateLimitStore[identifier];

    // Limpiar si la ventana expiró
    if (now >= record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowSeconds * 1000;
    }

    // Incrementar contador
    record.count++;

    // Rechazar si se excede el límite
    if (record.count > maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    return null; // Permitir pasar
  };
}

/**
 * Limiter específico para login: máximo 5 intentos fallidos en 15 minutos
 */
export const loginRateLimit = rateLimit(5, 900);

/**
 * Limiter para validación pública QR: máximo 100 en 1 hora
 */
export const qrValidationRateLimit = rateLimit(100, 3600);

/**
 * Limiter para API general: máximo 1000 en 1 minuto
 */
export const apiRateLimit = rateLimit(1000, 60);
