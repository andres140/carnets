/**
 * Utilidades relacionadas con la petición HTTP.
 */

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
}

function getUserAgent(req) {
  const ua = req.headers['user-agent'];
  return ua ? String(ua).substring(0, 500) : null;
}

function parseDeviceLabel(userAgent) {
  if (!userAgent) return 'Desconocido';
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Móvil';
  if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Navegador web';
}

module.exports = { getClientIp, getUserAgent, parseDeviceLabel };
