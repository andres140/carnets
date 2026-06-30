/**
 * Utilidades relacionadas con la petición HTTP.
 */

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
}

module.exports = { getClientIp };
