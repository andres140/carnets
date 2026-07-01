/**
 * Sprint 10 RC1 — verificación integral del sistema.
 * Requiere servidor en ejecución (npm run dev).
 * Uso: node scripts/sprint10-verify-rc1.js
 */
require('dotenv').config();

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPTS = [
  'sprint0-verify-auth.js',
  'sprint2-verify-usuarios.js',
  'sprint3-verify-organizacion.js',
  'sprint4-verify-carnets.js',
  'sprint5-verify-pdf.js',
  'sprint6-verify-qr.js',
  'sprint7-verify-dashboard.js',
  'sprint8-verify-reportes.js',
  'sprint9-verify-sistema.js',
];

function run(name) {
  const file = path.join(__dirname, name);
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, [file], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
  if (result.status !== 0) {
    throw new Error(`${name} falló (código ${result.status})`);
  }
}

async function smokeHealth() {
  const http = require('http');
  const base = process.env.APP_URL || 'http://localhost:3000';
  return new Promise((resolve, reject) => {
    http.get(`${base}/api/health`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode !== 200 || !json.success) reject(new Error('Health check falló'));
          else resolve();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Sprint 10 RC1 — Verificación integral');
  console.log('Servidor:', process.env.APP_URL || 'http://localhost:3000');

  await smokeHealth();
  console.log('OK /api/health');

  for (const script of SCRIPTS) {
    run(script);
  }

  console.log('\nRC1_VERIFY_OK');
  console.log('Versión 1.0.0 — Release Candidate validada');
}

main().catch((err) => {
  console.error('\nRC1_VERIFY_FAIL', err.message);
  process.exit(1);
});
