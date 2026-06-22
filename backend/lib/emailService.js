/**
 * backend/lib/emailService.js
 * Email sending service using Nodemailer
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

/**
 * Inicializar transporter de email
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  // Usar configuración de .env o defaults para desarrollo
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'demo@example.com',
      pass: process.env.SMTP_PASS || 'demo_pass',
    },
  };

  transporter = nodemailer.createTransport(smtpConfig);

  // Verificar conexión en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    transporter.verify((err, success) => {
      if (err) {
        console.warn('⚠️  Email transporter verification failed:', err.message);
      } else if (success) {
        console.log('✅ Email transporter ready');
      }
    });
  }

  return transporter;
}

/**
 * Enviar email de reset de contraseña
 */
async function sendPasswordResetEmail(email, resetLink, userName) {
  try {
    const mailer = initializeTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sena-carnets.edu.co',
      to: email,
      subject: 'Recuperación de contraseña - SENA Carnés',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">SENA Carnés</h1>
          </div>
          
          <div style="padding: 30px; background-color: #fff; border: 1px solid #ddd;">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>Recibimos una solicitud para resetear tu contraseña. Si no fuiste tú, ignora este email.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Resetear Contraseña
              </a>
            </p>
            
            <p>O copia este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">
              ${resetLink}
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Este enlace expira en 30 minutos.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 11px; text-align: center;">
              © 2024 SENA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
        Hola ${userName},
        
        Recibimos una solicitud para resetear tu contraseña. Si no fuiste tú, ignora este email.
        
        Copia este enlace en tu navegador:
        ${resetLink}
        
        Este enlace expira en 30 minutos.
        
        © 2024 SENA
      `,
    };

    const result = await mailer.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Enviar email de notificación genérica
 */
async function sendNotification(email, subject, htmlContent, userName) {
  try {
    const mailer = initializeTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sena-carnets.edu.co',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">SENA Carnés</h1>
          </div>
          
          <div style="padding: 30px; background-color: #fff; border: 1px solid #ddd;">
            <p>Hola <strong>${userName}</strong>,</p>
            
            ${htmlContent}
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 11px; text-align: center;">
              © 2024 SENA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    };

    const result = await mailer.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (err) {
    console.error('Error sending notification:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  initializeTransporter,
  sendPasswordResetEmail,
  sendNotification,
};
