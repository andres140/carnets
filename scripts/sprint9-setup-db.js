/**
 * Sprint 9 — migración BD: auditoría ampliada, configuración, notificaciones, sesiones.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function tryQuery(conn, sql, skipCode = 'ER_DUP_FIELDNAME') {
  try {
    await conn.query(sql);
    return true;
  } catch (err) {
    if (err.code === skipCode || err.code === 'ER_DUP_KEYNAME') return false;
    throw err;
  }
}

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
    .filter((s) => s && !/^USE\s/i.test(s));
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

  const cols = [
    'ADD COLUMN rol_nombre VARCHAR(100) NULL AFTER usuario_id',
    'ADD COLUMN modulo VARCHAR(100) NULL AFTER accion',
    "ADD COLUMN resultado VARCHAR(20) NOT NULL DEFAULT 'EXITO' AFTER modulo",
    'ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip',
  ];

  for (const col of cols) {
    const ok = await tryQuery(conn, `ALTER TABLE auditoria ${col}`);
    console.log(ok ? `OK auditoria ${col.split(' ')[2]}` : `SKIP ${col.split(' ')[2]}`);
  }

  const migration = fs.readFileSync(
    path.join(__dirname, '../database/migrations/008_sprint9_sistema.sql'),
    'utf8'
  );
  const statements = parseStatements(migration);

  for (const stmt of statements) {
    if (/^ALTER TABLE auditoria\s+ADD COLUMN IF NOT EXISTS/i.test(stmt)) continue;
    if (/^ALTER TABLE auditoria/i.test(stmt)) {
      const ok = await tryQuery(conn, stmt.replace(/IF NOT EXISTS\s+/gi, ''));
      console.log(ok ? `OK índice auditoría` : `SKIP índice auditoría`);
      continue;
    }
    await conn.query(stmt);
    const label = stmt.slice(0, 40).replace(/\s+/g, ' ');
    console.log(`OK ${label}…`);
  }
  console.log('OK tablas sprint 9');

  const secMigration = path.join(__dirname, '../migrations/002_security_audit.sql');
  if (fs.existsSync(secMigration)) {
    const secStatements = parseStatements(fs.readFileSync(secMigration, 'utf8')).filter(
      (s) => !/^ALTER TABLE carnets/i.test(s)
    );
    for (const stmt of secStatements) {
      await tryQuery(conn, stmt);
      console.log(`OK ${stmt.slice(0, 45).replace(/\s+/g, ' ')}…`);
    }
  }

  await conn.end();
  console.log('SPRINT9_DB_OK');
}

main().catch((err) => {
  console.error('SPRINT9_DB_FAIL', err.message);
  process.exit(1);
});
