/**
 * Variables de entorno centralizadas
 */
require('dotenv').config();

const httpPort = parseInt(process.env.PORT || '3000', 10);
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

if (httpPort === dbPort) {
  console.warn(
    `⚠️  ADVERTENCIA: PORT (${httpPort}) coincide con DB_PORT. ` +
      'El servidor HTTP debe usar un puerto distinto a MySQL (ej. PORT=3000, DB_PORT=3306).'
  );
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: httpPort,
  appUrl: process.env.APP_URL || `http://localhost:${httpPort}`,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: dbPort,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'sena_carnets',
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  },

  session: {
    secret: process.env.SESSION_SECRET || 'cambiar-session-secret-en-produccion',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || String(8 * 60 * 60 * 1000), 10),
    name: 'sena_carnets_sid',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'public/uploads',
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_MB || '5', 10),
  },

  carnet: {
    templateId: process.env.CARNET_TEMPLATE_ID || 'default',
    pdfDir: process.env.CARNET_PDF_DIR || 'public/uploads/carnets',
  },

  qr: {
    signingKey: process.env.QR_SIGNING_KEY || 'cambiar-qr-key-en-produccion',
  },
};

if (env.nodeEnv === 'production') {
  const required = [
    ['SESSION_SECRET', process.env.SESSION_SECRET],
    ['QR_SIGNING_KEY', process.env.QR_SIGNING_KEY],
  ];
  for (const [name, value] of required) {
    if (!value || value.length < 32) {
      throw new Error(
        `${name} debe definirse en producción con al menos 32 caracteres aleatorios.`
      );
    }
  }
}

module.exports = env;
