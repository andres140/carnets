/**
 * Sprint 3 — aplicar cambios de BD (columna roles.activo + permisos nuevos).
 * Uso: node scripts/sprint3-setup-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sena_carnets',
    multipleStatements: true,
  });

  try {
    await conn.query(
      'ALTER TABLE roles ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER descripcion'
    );
    console.log('OK columna roles.activo');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('SKIP roles.activo ya existe');
    } else {
      throw err;
    }
  }

  const seedPath = path.join(__dirname, '../database/seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf8');
  await conn.query(seed);
  console.log('OK seed.sql ejecutado');

  await conn.end();
  console.log('SPRINT3_DB_OK');
}

main().catch((err) => {
  console.error('SPRINT3_DB_FAIL', err.message);
  process.exit(1);
});
