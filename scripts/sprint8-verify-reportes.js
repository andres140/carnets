/**
 * Sprint 8 — verificación módulo de reportes.
 * Uso: node scripts/sprint8-verify-reportes.js (servidor en ejecución)
 */
require('dotenv').config();

const http = require('http');
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
let cookieJar = '';

function request(method, urlPath, binary = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.request(
      url,
      {
        method,
        headers: {
          Accept: binary ? '*/*' : 'application/json',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
      },
      (res) => {
        if (res.headers['set-cookie']) {
          cookieJar = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const ct = res.headers['content-type'] || '';
          if (!binary && ct.includes('application/json')) {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body.toString('utf8')), raw: body });
            } catch {
              resolve({ status: res.statusCode, data: {}, raw: body });
            }
          } else {
            resolve({ status: res.statusCode, data: {}, raw: body, contentType: ct });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function login(email, password) {
  let csrfToken = '';
  const csrf = await request('GET', '/api/auth/csrf-token');
  csrfToken = csrf.data?.data?.csrfToken;

  const http = require('http');
  const url = new URL('/api/auth/login', BASE_URL);
  const payload = JSON.stringify({ email, password });

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-CSRF-Token': csrfToken,
          Cookie: cookieJar,
          Accept: 'application/json',
        },
      },
      (res) => {
        if (res.headers['set-cookie']) {
          cookieJar = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve({ status: res.statusCode, data });
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('1. Login admin...');
  const auth = await login('admin@sena.edu.co', 'Admin123!');
  if (auth.status !== 200 || !auth.data.success) throw new Error('Login admin falló');

  console.log('2. Estadísticas...');
  const stats = await request('GET', '/api/reportes/estadisticas');
  if (stats.status !== 200 || !stats.data.success) throw new Error('GET estadisticas falló');
  if (typeof stats.data.data.totales.usuarios !== 'number') throw new Error('KPI usuarios inválido');
  console.log(`   OK ${stats.data.data.totales.usuarios} usuarios, ${stats.data.data.totales.carnetsActivos} carnés activos`);

  console.log('3. Reporte usuarios...');
  const usu = await request('GET', '/api/reportes/usuarios?limit=5&estado=ACTIVO');
  if (usu.status !== 200 || !usu.data.success) throw new Error('GET usuarios falló');
  console.log(`   OK ${usu.data.data.pagination.total} usuarios activos (filtrado)`);

  console.log('4. Reporte carnés...');
  const car = await request('GET', '/api/reportes/carnets?limit=5');
  if (car.status !== 200 || !car.data.success) throw new Error('GET carnets falló');
  console.log(`   OK ${car.data.data.pagination.total} carnés`);

  console.log('5. Reporte validaciones...');
  const val = await request('GET', '/api/reportes/validaciones?limit=5');
  if (val.status !== 200 || !val.data.success) throw new Error('GET validaciones falló');
  console.log(`   OK ${val.data.data.pagination.total} validaciones`);

  console.log('6. Búsqueda avanzada...');
  const bus = await request('GET', '/api/reportes/busqueda?tipo=carnets&limit=5');
  if (bus.status !== 200 || !bus.data.success) throw new Error('GET busqueda falló');
  console.log('   OK búsqueda carnés');

  console.log('7. Export CSV usuarios...');
  const csv = await request('GET', '/api/reportes/usuarios/export?format=csv&limit=10', true);
  if (csv.status !== 200 || !csv.raw.length) throw new Error('Export CSV falló');
  if (!csv.raw.toString('utf8').includes('Documento')) throw new Error('CSV sin encabezados');
  console.log(`   OK CSV (${csv.raw.length} bytes)`);

  console.log('8. Export XLSX carnés...');
  const xlsx = await request('GET', '/api/reportes/carnets/export?format=xlsx&limit=10', true);
  if (xlsx.status !== 200 || xlsx.raw.length < 100) throw new Error('Export XLSX falló');
  console.log(`   OK XLSX (${xlsx.raw.length} bytes)`);

  console.log('9. Export PDF validaciones...');
  const pdf = await request('GET', '/api/reportes/validaciones/export?format=pdf&limit=10', true);
  if (pdf.status !== 200 || !pdf.raw.length) throw new Error('Export PDF falló');
  if (pdf.raw.slice(0, 4).toString('ascii') !== '%PDF') throw new Error('Export PDF inválido');
  console.log(`   OK PDF (${pdf.raw.length} bytes)`);

  console.log('10. Permisos sin auth...');
  cookieJar = '';
  const denied = await request('GET', '/api/reportes/estadisticas');
  if (denied.status !== 401) throw new Error('Debería rechazar sin sesión');
  console.log('   OK 401 sin sesión');

  console.log('11. Alcance coordinador...');
  await login('coord@sena.edu.co', 'Coord123!');
  const coordStats = await request('GET', '/api/reportes/estadisticas');
  if (coordStats.data.data.scope !== 'Vista regional') throw new Error('Alcance coord incorrecto');
  console.log('   OK vista regional');

  console.log('SPRINT8_REPORTES_OK');
}

main().catch((err) => {
  console.error('SPRINT8_VERIFY_FAIL', err.message);
  process.exit(1);
});
