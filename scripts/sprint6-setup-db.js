/**
 * Sprint 6 — migración validaciones QR y tokens seguros.
 * Uso: node scripts/sprint6-setup-db.js
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function tryAlter(conn, sql, skipCodes = ['ER_DUP_FIELDNAME']) {
  try {
    await conn.query(sql);
    return true;
  } catch (err) {
    if (skipCodes.includes(err.code)) return false;
    throw err;
  }
}

async function main() {
  const qrService = require(path.join(__dirname, '../backend/services/qr.service'));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sena_carnets',
    multipleStatements: true,
  });

  if (await tryAlter(conn, 'ALTER TABLE validaciones_qr MODIFY carnet_id VARCHAR(36) NULL')) {
    console.log('OK validaciones_qr.carnet_id nullable');
  } else {
    console.log('SKIP validaciones_qr.carnet_id');
  }

  if (
    await tryAlter(
      conn,
      'ALTER TABLE validaciones_qr ADD COLUMN token_intentado VARCHAR(255) NULL AFTER carnet_id'
    )
  ) {
    console.log('OK validaciones_qr.token_intentado');
  } else {
    console.log('SKIP validaciones_qr.token_intentado');
  }

  const [rows] = await conn.query('SELECT id, qr_token FROM carnets');
  let migrados = 0;
  for (const row of rows) {
    const needsMigration =
      qrService.isLegacyPlaceholderToken(row.qr_token) || !qrService.verifyToken(row.qr_token);
    if (!needsMigration) continue;

    let token;
    let exists = true;
    while (exists) {
      token = qrService.generateToken();
      const [check] = await conn.query('SELECT id FROM carnets WHERE qr_token = ? LIMIT 1', [token]);
      exists = check.length > 0;
    }
    await conn.query('UPDATE carnets SET qr_token = ?, pdf_hash = NULL, pdf_url = NULL WHERE id = ?', [
      token,
      row.id,
    ]);
    migrados++;
  }
  console.log(`OK tokens QR migrados: ${migrados}`);

  await conn.end();
  console.log('SPRINT6_DB_OK');
}

main().catch((err) => {
  console.error('SPRINT6_DB_FAIL', err.message);
  process.exit(1);
});
