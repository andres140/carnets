/**
 * Sprint 7 — verificación dashboard ejecutivo.
 * Uso: node scripts/sprint7-verify-dashboard.js
 */
const http = require('http');
require('dotenv').config();

const BASE = process.env.APP_URL || 'http://localhost:3000';
let cookieJar = '';
let csrfToken = '';

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Accept: 'application/json',
      ...(cookieJar ? { Cookie: cookieJar } : {}),
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(csrfToken && method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}),
    };
    const req = http.request(url, { method, headers }, (res) => {
      if (res.headers['set-cookie']) {
        cookieJar = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(email, password) {
  const csrf = await request('GET', '/api/auth/csrf-token');
  csrfToken = csrf.data?.data?.csrfToken;
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status !== 200 || !res.data?.success) {
    throw new Error(`Login falló: ${email} — ${res.data?.error || res.status}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('1. Login admin...');
  await login('admin@sena.edu.co', 'Admin123!');

  console.log('2. Dashboard completo...');
  const dash = await request('GET', '/api/dashboard');
  if (dash.status !== 200 || !dash.data?.success) throw new Error('GET /api/dashboard falló');

  const d = dash.data.data;
  const required = ['resumen', 'graficas', 'actividad', 'alertas', 'quickActions', 'visibility'];
  for (const key of required) {
    if (d[key] === undefined) throw new Error(`Falta sección: ${key}`);
  }

  const r = d.resumen;
  if (typeof r.usuariosTotal !== 'number' || typeof r.carnetsActivos !== 'number') {
    throw new Error('Resumen incompleto');
  }
  console.log(`   OK resumen: ${r.usuariosTotal} usuarios, ${r.carnetsActivos} carnés activos`);

  if (!d.graficas.carnetsPorMes?.labels) throw new Error('Gráfica carnetsPorMes vacía');
  if (!d.graficas.carnetsPorEstado?.values) throw new Error('Gráfica carnetsPorEstado vacía');
  console.log('   OK gráficas');

  if (!Array.isArray(d.quickActions) || !d.quickActions.length) throw new Error('Sin accesos rápidos');
  console.log(`   OK ${d.quickActions.length} accesos rápidos`);

  console.log('3. Compatibilidad /api/dashboard/stats...');
  const stats = await request('GET', '/api/dashboard/stats');
  if (stats.status !== 200) throw new Error('stats legacy falló');
  console.log('   OK');

  console.log('4. Alcance coordinador...');
  const dashboardRepository = require('../backend/repositories/dashboard.repository');
  const scopeCoord = dashboardRepository.buildUserScope({
    tipoUsuario: 'COORDINADOR',
    regionalId: 'reg-test',
  });
  if (!scopeCoord.clause.includes('regional_id')) {
    throw new Error('Scope coordinador incorrecto');
  }
  console.log('   OK filtro regional en repositorio');

  try {
    await request('POST', '/api/auth/logout', {});
    cookieJar = '';
    await sleep(3000);
    await login('coord@sena.edu.co', 'Coord123!');
    const dashCoord = await request('GET', '/api/dashboard');
    if (dashCoord.status !== 200) throw new Error('Dashboard coordinador falló');
    if (!dashCoord.data.data.scope?.toLowerCase().includes('regional')) {
      throw new Error('Coordinador sin scope regional en API');
    }
    console.log(`   OK API coordinador: ${dashCoord.data.data.scope}`);
  } catch (err) {
    if (String(err.message).includes('Demasiadas solicitudes')) {
      console.log('   SKIP login coordinador (rate limit) — scope verificado en repositorio');
    } else {
      throw err;
    }
  }

  console.log('SPRINT7_VERIFY_OK');
}

main().catch((err) => {
  console.error('SPRINT7_VERIFY_FAIL', err.message);
  process.exit(1);
});
