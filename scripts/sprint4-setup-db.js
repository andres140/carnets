/**
 * Sprint 4 — aplicar cambios de BD en carnets.
 * Uso: node scripts/sprint4-setup-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function tryAlter(conn, sql, skipCode) {
  try {
    await conn.query(sql);
    return true;
  } catch (err) {
    if (err.code === skipCode) return false;
    throw err;
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sena_carnets',
    multipleStatements: true,
  });

  if (
    await tryAlter(
      conn,
      "ALTER TABLE carnets ADD COLUMN tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CC' AFTER documento",
      'ER_DUP_FIELDNAME'
    )
  ) {
    console.log('OK carnets.tipo_documento');
  } else {
    console.log('SKIP carnets.tipo_documento');
  }

  if (
    await tryAlter(
      conn,
      'ALTER TABLE carnets ADD COLUMN dependencia_nombre VARCHAR(200) NULL AFTER regional_nombre',
      'ER_DUP_FIELDNAME'
    )
  ) {
    console.log('OK carnets.dependencia_nombre');
  } else {
    console.log('SKIP carnets.dependencia_nombre');
  }

  const fs = require('fs');
  const path = require('path');
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const placeholder = path.join(uploadDir, 'placeholder-avatar.png');
  if (!fs.existsSync(placeholder)) {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(placeholder, png);
    console.log('OK placeholder-avatar.png');
  }

  await conn.query(
    "UPDATE usuarios SET foto_url = '/uploads/placeholder-avatar.png' WHERE email = 'aprendiz1@sena.edu.co' AND (foto_url IS NULL OR foto_url = '')"
  );
  console.log('OK foto demo aprendiz');

  await conn.end();
  console.log('SPRINT4_DB_OK');
}

main().catch((err) => {
  console.error('SPRINT4_DB_FAIL', err.message);
  process.exit(1);
});
