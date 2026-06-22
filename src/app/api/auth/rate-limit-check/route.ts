/**
 * src/app/api/auth/rate-limit-check/route.ts
 * Endpoint para verificar estado de rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

  return NextResponse.json({
    ip,
    timestamp: new Date().toISOString(),
    message: 'Rate limit check endpoint',
  });
}
