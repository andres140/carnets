/**
 * backend/services/passwordRecoveryService.js
 * Password recovery and reset service
 */

const crypto = require('crypto');
const db = require('../config/database');
const auditoriaService = require('./auditoriaService');

/**
 * Generar token de reset de contraseña
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash del token para almacenamiento seguro
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Solicitar recuperación de contraseña
 */
async function requestPasswordReset(email, ipAddress) {
  try {
    // Buscar usuario por email
    const userQuery = 'SELECT id, email FROM usuarios WHERE email = ?';
    const users = await db.query(userQuery, [email]);

    if (users.length === 0) {
      // No revelar si el email existe o no (seguridad)
      return {
        success: true,
        message: 'Si el email existe en el sistema, recibirá instrucciones de reset',
      };
    }

    const user = users[0];
    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    const tokenId = crypto.randomUUID();

    // Guardar token en BD
    const insertQuery = `
      INSERT INTO password_reset_tokens
      (id, usuario_id, token, token_hash, email, expires_at, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      tokenId,
      user.id,
      token,
      tokenHash,
      email,
      expiresAt,
      ipAddress,
    ]);

    // Registrar en auditoría
    await auditoriaService.log({
      usuarioId: user.id,
      accion: 'PASSWORD_RESET_REQUESTED',
      entidad: 'Usuario',
      entidadId: user.id,
      ip: ipAddress,
    });

    return {
      success: true,
      token, // Devolver token para testing, en producción se envía por email
      message: 'Instrucciones de reset enviadas al email',
    };
  } catch (err) {
    console.error('Error en requestPasswordReset:', err);
    throw err;
  }
}

/**
 * Validar y usar token de reset
 */
async function validateResetToken(token) {
  try {
    const tokenHash = hashToken(token);

    const query = `
      SELECT prt.*, u.email, u.id as usuario_id
      FROM password_reset_tokens prt
      JOIN usuarios u ON prt.usuario_id = u.id
      WHERE prt.token_hash = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL
      LIMIT 1
    `;

    const results = await db.query(query, [tokenHash]);

    if (results.length === 0) {
      return {
        valid: false,
        error: 'Token inválido, expirado o ya utilizado',
      };
    }

    return {
      valid: true,
      data: results[0],
    };
  } catch (err) {
    console.error('Error en validateResetToken:', err);
    throw err;
  }
}

/**
 * Reset de contraseña con token
 */
async function resetPassword(token, newPasswordHash, ipAddress) {
  try {
    const validation = await validateResetToken(token);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const { id: tokenId, usuario_id } = validation.data;

    // Actualizar contraseña del usuario
    const updateQuery = 'UPDATE usuarios SET password_hash = ? WHERE id = ?';
    await db.query(updateQuery, [newPasswordHash, usuario_id]);

    // Marcar token como usado
    const markUsedQuery = 'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?';
    await db.query(markUsedQuery, [tokenId]);

    // Registrar en auditoría
    await auditoriaService.log({
      usuarioId: usuario_id,
      accion: 'PASSWORD_RESET_COMPLETED',
      entidad: 'Usuario',
      entidadId: usuario_id,
      ip: ipAddress,
    });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  } catch (err) {
    console.error('Error en resetPassword:', err);
    throw err;
  }
}

/**
 * Limpiar tokens expirados
 */
async function cleanupExpiredTokens() {
  try {
    const query = 'DELETE FROM password_reset_tokens WHERE expires_at < NOW()';
    await db.query(query);
  } catch (err) {
    console.error('Error en cleanupExpiredTokens:', err);
    throw err;
  }
}

module.exports = {
  generateResetToken,
  hashToken,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanupExpiredTokens,
};
