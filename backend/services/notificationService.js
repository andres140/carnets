/**
 * backend/services/notificationService.js
 * Email notification service
 */

const emailService = require('../lib/emailService');
const db = require('../config/database');

/**
 * Obtener preferencias de notificación del usuario
 */
async function getUserNotificationPreferences(usuarioId) {
  try {
    const users = await db.query(
      'SELECT notifications_enabled, notification_preferences FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    const preferences = user.notification_preferences
      ? JSON.parse(user.notification_preferences)
      : {};

    return {
      enabled: user.notifications_enabled,
      preferences: {
        carnetCreated: preferences.carnetCreated !== false,
        carnetExpiring: preferences.carnetExpiring !== false,
        carnetSuspended: preferences.carnetSuspended !== false,
        passwordChanged: preferences.passwordChanged !== false,
        suspiciousLogin: preferences.suspiciousLogin !== false,
        securityAlerts: preferences.securityAlerts !== false,
        ...preferences,
      },
    };
  } catch (err) {
    console.error('Error en getUserNotificationPreferences:', err);
    return null;
  }
}

/**
 * Enviar notificación de carné creado
 */
async function notifyCarnetCreated(usuarioId, carnetInfo) {
  try {
    const users = await db.query(
      'SELECT email, nombres, apellidos FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return;
    }

    const user = users[0];
    const preferences = await getUserNotificationPreferences(usuarioId);

    if (!preferences?.enabled || !preferences.preferences.carnetCreated) {
      return;
    }

    const htmlContent = `
      <p>Tu carné institucional ha sido creado exitosamente.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Información del Carné:</strong></p>
        <p>
          Código: <strong>${carnetInfo.codigo}</strong><br>
          Tipo: <strong>${carnetInfo.tipo}</strong><br>
          Centro: <strong>${carnetInfo.centro}</strong><br>
          Vigencia: <strong>${carnetInfo.fechaExpedicion} al ${carnetInfo.fechaVencimiento}</strong>
        </p>
      </div>
      
      <p>Puedes acceder a tu carné desde el dashboard o validarlo públicamente mediante el código QR.</p>
    `;

    await emailService.sendNotification(
      user.email,
      'Tu Carné Institucional ha sido Creado',
      htmlContent,
      user.nombres
    );
  } catch (err) {
    console.error('Error en notifyCarnetCreated:', err);
  }
}

/**
 * Enviar notificación de carné próximo a vencer
 */
async function notifyCarnetExpiring(usuarioId, carnetInfo) {
  try {
    const users = await db.query(
      'SELECT email, nombres, apellidos FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return;
    }

    const user = users[0];
    const preferences = await getUserNotificationPreferences(usuarioId);

    if (!preferences?.enabled || !preferences.preferences.carnetExpiring) {
      return;
    }

    const htmlContent = `
      <p style="color: #ff6b6b;">
        ⚠️ Tu carné institucional vence en ${carnetInfo.diasRestantes} día(s).
      </p>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
        <p><strong>Información del Carné:</strong></p>
        <p>
          Código: <strong>${carnetInfo.codigo}</strong><br>
          Fecha de vencimiento: <strong>${carnetInfo.fechaVencimiento}</strong>
        </p>
      </div>
      
      <p>Por favor, contacta al centro de formación para renovar tu carné antes de que expire.</p>
    `;

    await emailService.sendNotification(
      user.email,
      'Tu Carné Institucional está Próximo a Vencer',
      htmlContent,
      user.nombres
    );
  } catch (err) {
    console.error('Error en notifyCarnetExpiring:', err);
  }
}

/**
 * Enviar notificación de cambio de contraseña
 */
async function notifyPasswordChanged(usuarioId, ipAddress) {
  try {
    const users = await db.query(
      'SELECT email, nombres, apellidos FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return;
    }

    const user = users[0];
    const preferences = await getUserNotificationPreferences(usuarioId);

    if (!preferences?.enabled || !preferences.preferences.passwordChanged) {
      return;
    }

    const htmlContent = `
      <p>Tu contraseña fue cambiada exitosamente.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Detalles del cambio:</strong></p>
        <p>
          Fecha: <strong>${new Date().toLocaleString('es-CO')}</strong><br>
          Dirección IP: <strong>${ipAddress}</strong>
        </p>
      </div>
      
      <p>Si no realizaste este cambio, contacta inmediatamente con soporte de seguridad.</p>
    `;

    await emailService.sendNotification(
      user.email,
      'Tu Contraseña ha sido Cambiada',
      htmlContent,
      user.nombres
    );
  } catch (err) {
    console.error('Error en notifyPasswordChanged:', err);
  }
}

/**
 * Enviar alerta de login sospechoso
 */
async function notifySuspiciousLogin(usuarioId, ipAddress, deviceInfo) {
  try {
    const users = await db.query(
      'SELECT email, nombres, apellidos FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (users.length === 0) {
      return;
    }

    const user = users[0];
    const preferences = await getUserNotificationPreferences(usuarioId);

    if (!preferences?.enabled || !preferences.preferences.suspiciousLogin) {
      return;
    }

    const htmlContent = `
      <p style="color: #ff6b6b;">
        ⚠️ Se detectó un inicio de sesión desde una ubicación desconocida.
      </p>
      
      <div style="background-color: #ffe0e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
        <p><strong>Detalles del acceso:</strong></p>
        <p>
          Dirección IP: <strong>${ipAddress}</strong><br>
          Dispositivo: <strong>${deviceInfo || 'Desconocido'}</strong><br>
          Fecha: <strong>${new Date().toLocaleString('es-CO')}</strong>
        </p>
      </div>
      
      <p>Si no fuiste tú, cambia tu contraseña inmediatamente y contacta con soporte de seguridad.</p>
    `;

    await emailService.sendNotification(
      user.email,
      'Alerta de Seguridad: Login Sospechoso',
      htmlContent,
      user.nombres
    );
  } catch (err) {
    console.error('Error en notifySuspiciousLogin:', err);
  }
}

module.exports = {
  getUserNotificationPreferences,
  notifyCarnetCreated,
  notifyCarnetExpiring,
  notifyPasswordChanged,
  notifySuspiciousLogin,
};
