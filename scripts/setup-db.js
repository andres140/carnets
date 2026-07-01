/**
 * Instalación completa de base de datos — RC1
 * Ejecuta schema.sql, seed.sql y migraciones incrementales.
 * Uso: node scripts/setup-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

function stripSqlComments(sql) {
  return sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

function parseStatements(sql) {
  return stripSqlComments(sql)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function tryQuery(conn, sql, skipCodes = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERR']) {
  try {
    await conn.query(sql);
    return true;
  } catch (err) {
    if (skipCodes.includes(err.code)) return false;
    throw err;
  }
}

async function execFile(conn, filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP ${label} (no encontrado)`);
    return;
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  await conn.query(sql);
  console.log(`OK ${label}`);
}

async function execMigrationFile(conn, filePath) {
  if (!fs.existsSync(filePath)) return;
  const statements = parseStatements(fs.readFileSync(filePath, 'utf8'));
  for (const stmt of statements) {
    if (/^USE\s/i.test(stmt)) continue;
    if (/^ALTER TABLE auditoria\s+ADD COLUMN IF NOT EXISTS/i.test(stmt)) continue;
    if (/^ALTER TABLE carnets ADD COLUMN IF NOT EXISTS/i.test(stmt)) {
      const normalized = stmt.replace(/IF NOT EXISTS\s+/gi, '');
      await tryQuery(conn, normalized);
      continue;
    }
    if (/ADD COLUMN IF NOT EXISTS/i.test(stmt)) {
      const table = stmt.match(/ALTER TABLE\s+(\w+)/i)?.[1] || 'usuarios';
      const cols = stmt.split(/ADD COLUMN IF NOT EXISTS/i).slice(1);
      for (const raw of cols) {
        const def = raw.replace(/,\s*$/, '').trim();
        if (def) await tryQuery(conn, `ALTER TABLE ${table} ADD COLUMN ${def}`);
      }
      continue;
    }
    if (/^ALTER TABLE auditoria/i.test(stmt)) {
      await tryQuery(conn, stmt.replace(/IF NOT EXISTS\s+/gi, ''));
      continue;
    }
    if (/SET @/i.test(stmt) || /^PREPARE/i.test(stmt) || /^EXECUTE/i.test(stmt) || /^DEALLOCATE/i.test(stmt)) {
      try {
        await conn.query(stmt);
      } catch {
        /* migraciones condicionales opcionales */
      }
      continue;
    }
    await tryQuery(conn, stmt);
  }
  console.log(`OK migración ${path.basename(filePath)}`);
}

async function main() {
  const root = path.join(__dirname, '..');
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  };

  console.log('1. Conectando a MySQL…');
  const bootstrap = await mysql.createConnection(config);
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'sena_carnets'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  const conn = await mysql.createConnection({
    ...config,
    database: process.env.DB_NAME || 'sena_carnets',
  });

  console.log('2. Esquema base…');
  await execFile(conn, path.join(root, 'database/schema.sql'), 'schema.sql');

  console.log('3. Datos iniciales…');
  await execFile(conn, path.join(root, 'database/seed.sql'), 'seed.sql');

  console.log('4. Migraciones incrementales…');
  const migrations = [
    'database/migrations/004_sprint3_roles_activo.sql',
    'database/migrations/005_sprint4_carnets_snapshot.sql',
    'database/migrations/006_sprint5_carnet_pdf.sql',
    'database/migrations/007_sprint6_validacion_qr.sql',
    'migrations/002_security_audit.sql',
    'migrations/003_password_recovery_2fa.sql',
    'database/migrations/008_sprint9_sistema.sql',
  ];

  const auditoriaCols = [
    'ADD COLUMN rol_nombre VARCHAR(100) NULL AFTER usuario_id',
    'ADD COLUMN modulo VARCHAR(100) NULL AFTER accion',
    "ADD COLUMN resultado VARCHAR(20) NOT NULL DEFAULT 'EXITO' AFTER modulo",
    'ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip',
  ];
  for (const col of auditoriaCols) {
    await tryQuery(conn, `ALTER TABLE auditoria ${col}`);
  }

  for (const rel of migrations) {
    await execMigrationFile(conn, path.join(root, rel));
  }

  await conn.end();
  console.log('SETUP_DB_OK');
}

main().catch((err) => {
  console.error('SETUP_DB_FAIL', err.message);
  process.exit(1);
});
