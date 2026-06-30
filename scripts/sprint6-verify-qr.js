/**
 * Sprint 6 — verificación QR y validación pública.
 * Uso: node scripts/sprint6-verify-qr.js
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
      const setCookie = res.headers['set-cookie'];
      if (setCookie) cookieJar = setCookie.map((c) => c.split(';')[0]).join('; ');
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let data = {};
        try {
          data = JSON.parse(buf.toString('utf8'));
        } catch {
          data = {};
        }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login() {
  const csrf = await request('GET', '/api/auth/csrf-token');
  csrfToken = csrf.data?.data?.csrfToken;
  const res = await request('POST', '/api/auth/login', { email: 'admin@sena.edu.co', password: 'Admin123!' });
  if (res.status !== 200) throw new Error('Login falló');
}

async function main() {
  console.log('1. Login...');
  await login();

  console.log('2. Obtener carné...');
  const list = await request('GET', '/api/carnets?limit=1');
  const carnet = list.data?.data?.items?.[0];
  if (!carnet) throw new Error('No hay carnés');
  const id = carnet.id;
  const one = await request('GET', `/api/carnets/${id}`);
  const token = one.data?.data?.qrToken;
  console.log('3. QR del carné...');
  const qrRes = await request('GET', `/api/carnets/${id}/qr`);
  if (qrRes.status !== 200 || !qrRes.data?.data?.dataUrl?.startsWith('data:image')) {
    throw new Error('QR image endpoint falló');
  }
  if (!token || !token.includes('.')) throw new Error('Token QR no seguro');

  console.log('4. Validación pública (válido)...');
  const valid = await request('GET', `/api/validar/${encodeURIComponent(token)}`);
  if (valid.status !== 200 || !valid.data?.data?.carnet) {
    throw new Error('Validación pública falló');
  }
  if (!valid.data.data.carnet.nombreCompleto) throw new Error('Falta nombre en respuesta pública');
  if (valid.data.data.carnet.email !== undefined) throw new Error('No debe exponer email');
  console.log(`   OK estado: ${valid.data.data.estado}`);

  console.log('5. Token inválido...');
  const bad = await request('GET', '/api/validar/token-falso-123');
  if (bad.status !== 200 || bad.data?.data?.valido !== false) {
    throw new Error('Token inválido no manejado');
  }
  console.log('   OK mensaje seguro');

  console.log('6. Token inexistente (formato válido)...');
  const fake = 'a'.repeat(32) + '.' + 'b'.repeat(16);
  const missing = await request('GET', `/api/validar/${fake}`);
  if (missing.data?.data?.valido !== false) throw new Error('Token inexistente no manejado');
  console.log('   OK');

  console.log('7. Dashboard stats...');
  const stats = await request('GET', '/api/dashboard/stats');
  if (stats.status !== 200 || stats.data?.data?.validaciones === undefined) {
    throw new Error('Dashboard stats falló');
  }
  console.log(`   OK validaciones hoy: ${stats.data.data.validaciones.hoy}`);

  console.log('8. PDF con QR (regenerar)...');
  const regen = await request('POST', `/api/carnets/${id}/documento/regenerar`, {});
  if (regen.status !== 200) throw new Error('Regenerar PDF falló');
  const pdf = await request('GET', `/api/carnets/${id}/documento/pdf`);
  if (pdf.status !== 200) throw new Error('PDF tras QR falló');
  console.log('   OK PDF');

  console.log('SPRINT6_VERIFY_OK');
}

main().catch((err) => {
  console.error('SPRINT6_VERIFY_FAIL', err.message);
  process.exit(1);
});
