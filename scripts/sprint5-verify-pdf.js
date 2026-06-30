/**
 * Sprint 5 — verificación PDF, descarga, impresión y reimpresión.
 * Uso: node scripts/sprint5-verify-pdf.js
 */
const fs = require('fs');
const path = require('path');
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

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
          cookieJar = setCookie.map((c) => c.split(';')[0]).join('; ');
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const ct = res.headers['content-type'] || '';
          let data = buf;
          if (ct.includes('application/json')) {
            try {
              data = JSON.parse(buf.toString('utf8'));
            } catch {
              data = {};
            }
          }
          resolve({ status: res.statusCode, headers: res.headers, data, raw: buf });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(email, password) {
  const csrf = await request('GET', '/api/auth/csrf-token');
  csrfToken = csrf.data?.data?.csrfToken;
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status !== 200 || !res.data.success) {
    throw new Error(`Login falló: ${res.data?.error || res.status}`);
  }
  return res.data.data;
}

async function main() {
  console.log('1. Login admin...');
  await login('admin@sena.edu.co', 'Admin123!');

  console.log('2. Listar carnés...');
  const list = await request('GET', '/api/carnets?limit=5');
  if (!list.data?.data?.items?.length) {
    throw new Error('No hay carnés. Ejecute sprint4-verify-carnets.js primero.');
  }
  const carnet = list.data.data.items[0];
  const id = carnet.id;
  console.log(`   Carné: ${carnet.codigoUnico} (${id})`);

  console.log('3. Vista previa HTML...');
  const preview = await request('GET', `/api/carnets/${id}/documento/preview`);
  if (preview.status !== 200) throw new Error(`Preview HTTP ${preview.status}`);
  const html = preview.raw.toString('utf8');
  if (!html.includes('carnet-page') || !html.includes(carnet.codigoUnico)) {
    throw new Error('HTML de preview incompleto');
  }
  console.log('   OK preview HTML');

  console.log('4. Descargar PDF...');
  const pdfRes = await request('GET', `/api/carnets/${id}/documento/pdf`);
  if (pdfRes.status !== 200) throw new Error(`PDF HTTP ${pdfRes.status}: ${pdfRes.data?.error}`);
  if (!pdfRes.raw.slice(0, 5).toString().startsWith('%PDF')) {
    throw new Error('La respuesta no es un PDF válido');
  }
  const pdfPath = path.join(__dirname, '../public/uploads/carnets', `${id}.pdf`);
  if (!fs.existsSync(pdfPath)) throw new Error('PDF no guardado en caché');
  console.log(`   OK PDF (${pdfRes.raw.length} bytes)`);

  console.log('5. Segunda descarga (caché)...');
  const pdf2 = await request('GET', `/api/carnets/${id}/documento/pdf`);
  if (pdf2.status !== 200) throw new Error('Segunda descarga falló');
  console.log('   OK caché reutilizada');

  console.log('6. Registrar impresión...');
  const print = await request('POST', `/api/carnets/${id}/documento/registrar-impresion`, {});
  if (print.status !== 200) throw new Error(print.data?.error || 'Registro impresión falló');
  console.log('   OK impresión registrada');

  console.log('7. Reimprimir...');
  const reprint = await request('POST', `/api/carnets/${id}/documento/reimprimir`, {});
  if (reprint.status !== 200) throw new Error('Reimpresión falló');
  console.log('   OK reimpresión');

  console.log('8. Historial documento...');
  const hist = await request('GET', `/api/carnets/${id}/documento/historial`);
  if (!hist.data?.data?.items?.length) throw new Error('Historial documento vacío');
  const acciones = hist.data.data.items.map((i) => i.accion);
  for (const a of ['GENERAR', 'DESCARGAR', 'IMPRIMIR', 'REIMPRIMIR']) {
    if (!acciones.includes(a)) throw new Error(`Falta acción ${a} en historial`);
  }
  console.log(`   OK historial (${acciones.length} eventos)`);

  console.log('SPRINT5_VERIFY_OK');
}

main().catch((err) => {
  console.error('SPRINT5_VERIFY_FAIL', err.message);
  process.exit(1);
});
