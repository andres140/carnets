/**
 * backend/services/twoFactorAuthService.js
 * Two-factor authentication service (TOTP)
 */

const crypto = require('crypto');
const db = require('../config/database');

/**
 * Generar secret para TOTP
 */
function generateTotpSecret() {
  // RFC 4648 Base32 encoding
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';

  for (let i = 0; i < 32; i++) {
    secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
  }

  return secret;
}

/**
 * Generar URL de QR para Google Authenticator
 */
function generateQrCodeUrl(email, secret, appName = 'SENA Carnés') {
  const encodedEmail = encodeURIComponent(email);
  const encodedSecret = encodeURIComponent(secret);
  const encodedAppName = encodeURIComponent(appName);

  return `otpauth://totp/${encodedAppName}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedAppName}`;
}

/**
 * Verificar código TOTP
 */
function verifyTotp(secret, token, timeWindow = 30) {
  if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
    return false;
  }

  const tokenNumber = parseInt(token);
  const now = Math.floor(Date.now() / 1000);

  // Verificar el código actual y los dos anteriores (tolerancia de ±30 segundos)
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor((now + i * timeWindow) / timeWindow);
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(Buffer.alloc(8));

    const offset = hmac.digest()[19] & 0xf;
    const code =
      (hmac.digest().readUInt32BE(offset) & 0x7fffffff) % 1000000;

    if (code === tokenNumber) {
      return true;
    }
  }

  return false;
}

/**
 * Generar códigos de respaldo
 */
function generateBackupCodes(count = 10) {
  const codes = [];

  for (let i = 0; i < count; i++) {
    const code = crypto
      .randomBytes(4)
      .readUInt32BE(0)
      .toString()
      .padStart(8, '0')
      .substring(0, 8);
    codes.push(code);
  }

  return codes;
}

/**
 * Configurar 2FA para usuario
 */
async function setupTwoFactor(usuarioId, method = 'TOTP') {
  try {
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes();

    // Hashear códigos de respaldo antes de guardar
    const hashedBackupCodes = backupCodes.map((code) =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    const query = `
      UPDATE usuarios
      SET
        two_factor_enabled = TRUE,
        two_factor_method = ?,
        two_factor_secret = ?,
        two_factor_backup_codes = ?
      WHERE id = ?
    `;

    await db.query(query, [method, secret, JSON.stringify(hashedBackupCodes), usuarioId]);

    const qrCodeUrl = generateQrCodeUrl(
      (await db.query('SELECT email FROM usuarios WHERE id = ?', [usuarioId]))[0].email,
      secret
    );

    return {
      success: true,
      secret,
      qrCodeUrl,
      backupCodes,
    };
  } catch (err) {
    console.error('Error en setupTwoFactor:', err);
    throw err;
  }
}

/**
 * Verificar 2FA y completar setup
 */
async function verifyAndCompleteTwoFactor(usuarioId, token) {
  try {
    const users = await db.query('SELECT two_factor_secret FROM usuarios WHERE id = ?', [
      usuarioId,
    ]);

    if (users.length === 0 || !users[0].two_factor_secret) {
      return {
        success: false,
        error: '2FA no está configurado',
      };
    }

    if (!verifyTotp(users[0].two_factor_secret, token)) {
      return {
        success: false,
        error: 'Token 2FA inválido',
      };
    }

    // Marcar 2FA como verificado
    const query = `
      UPDATE usuarios
      SET two_factor_verified_at = NOW()
      WHERE id = ?
    `;

    await db.query(query, [usuarioId]);

    return {
      success: true,
      message: '2FA configurado exitosamente',
    };
  } catch (err) {
    console.error('Error en verifyAndCompleteTwoFactor:', err);
    throw err;
  }
}

/**
 * Verificar token 2FA durante login
 */
async function verifyTwoFactorLogin(usuarioId, token) {
  try {
    const users = await db.query(
      'SELECT two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0 || !users[0].two_factor_enabled) {
      return {
        success: false,
        error: '2FA no está habilitado',
      };
    }

    const user = users[0];

    // Intentar verificar TOTP
    if (verifyTotp(user.two_factor_secret, token)) {
      return {
        success: true,
        message: 'Token 2FA válido',
      };
    }

    // Intentar verificar código de respaldo
    if (user.two_factor_backup_codes) {
      const backupCodes = JSON.parse(user.two_factor_backup_codes);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      for (let i = 0; i < backupCodes.length; i++) {
        if (backupCodes[i] === tokenHash) {
          // Remover código usado
          backupCodes.splice(i, 1);
          await db.query(
            'UPDATE usuarios SET two_factor_backup_codes = ? WHERE id = ?',
            [JSON.stringify(backupCodes), usuarioId]
          );

          return {
            success: true,
            message: 'Código de respaldo válido',
          };
        }
      }
    }

    return {
      success: false,
      error: 'Token 2FA inválido',
    };
  } catch (err) {
    console.error('Error en verifyTwoFactorLogin:', err);
    throw err;
  }
}

/**
 * Deshabilitar 2FA
 */
async function disableTwoFactor(usuarioId) {
  try {
    const query = `
      UPDATE usuarios
      SET
        two_factor_enabled = FALSE,
        two_factor_method = 'NONE',
        two_factor_secret = NULL,
        two_factor_backup_codes = NULL,
        two_factor_verified_at = NULL
      WHERE id = ?
    `;

    await db.query(query, [usuarioId]);

    return {
      success: true,
      message: '2FA deshabilitado',
    };
  } catch (err) {
    console.error('Error en disableTwoFactor:', err);
    throw err;
  }
}

module.exports = {
  generateTotpSecret,
  generateQrCodeUrl,
  verifyTotp,
  generateBackupCodes,
  setupTwoFactor,
  verifyAndCompleteTwoFactor,
  verifyTwoFactorLogin,
  disableTwoFactor,
};
