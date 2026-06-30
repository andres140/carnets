/**
 * Servicio QR — tokens HMAC firmados y generación de imágenes.
 * El QR solo contiene la URL pública de validación (sin datos sensibles).
 */
const crypto = require('crypto');
const QRCode = require('qrcode');
const env = require('../config/env');
const { createAppError } = require('../utils/errors');

const TOKEN_RANDOM_BYTES = 16;
const SIGNATURE_LENGTH = 16;

function generateToken() {
  const random = crypto.randomBytes(TOKEN_RANDOM_BYTES).toString('hex');
  const signature = crypto
    .createHmac('sha256', env.qr.signingKey)
    .update(random)
    .digest('hex')
    .slice(0, SIGNATURE_LENGTH);
  return `${random}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [random, signature] = parts;
  if (!/^[a-f0-9]{32}$/i.test(random) || !/^[a-f0-9]{16}$/i.test(signature)) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', env.qr.signingKey)
    .update(random)
    .digest('hex')
    .slice(0, SIGNATURE_LENGTH);

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function buildValidationUrl(token) {
  const base = (env.appUrl || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/validar.html?token=${encodeURIComponent(token)}`;
}

async function generateQrDataUrl(validationUrl, size = 180) {
  return QRCode.toDataURL(validationUrl, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#003366', light: '#ffffff' },
  });
}

async function generateQrForToken(token, size = 180) {
  const url = buildValidationUrl(token);
  const dataUrl = await generateQrDataUrl(url, size);
  return { validationUrl: url, dataUrl };
}

async function generateUniqueToken(tokenExists) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const token = generateToken();
    if (!(await tokenExists(token))) return token;
  }
  throw createAppError('No se pudo generar un token QR único', 500);
}

function isLegacyPlaceholderToken(token) {
  return typeof token === 'string' && token.startsWith('qr_');
}

module.exports = {
  generateToken,
  verifyToken,
  buildValidationUrl,
  generateQrDataUrl,
  generateQrForToken,
  generateUniqueToken,
  isLegacyPlaceholderToken,
};
