/**
 * Script temporal Sprint 0 — ejecutar schema + seed y verificar usuarios seed.
 * Uso: node scripts/sprint0-verify-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  for (const file of ['database/schema.sql', 'database/seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    await conn.query(sql);
    console.log('OK', file);
  }

  const [users] = await conn.query(
    `SELECT id, email, rol_id, tipo_usuario, estado
     FROM sena_carnets.usuarios
     WHERE email IN (?, ?)`,
    ['admin@sena.edu.co', 'coord@sena.edu.co']
  );
  console.log('SEED_USERS', JSON.stringify(users, null, 2));

  await conn.end();
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
