/**
 * Sprint 9 — verificación auditoría, configuración, notificaciones, sesiones y monitoreo.
 * Uso: node scripts/sprint9-verify-sistema.js (servidor en ejecución)
 */
require('dotenv').config();

const http = require('http');
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
let cookieJar = '';
let csrfToken = '';

function request(method, urlPath, body = null, binary = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          Accept: binary ? '*/*' : 'application/json',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'X-CSRF-Token': csrfToken,
              }
            : {}),
        },
      },
      (res) => {
        if (res.headers['set-cookie']) {
          cookieJar = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          const ct = res.headers['content-type'] || '';
          if (!binary && ct.includes('application/json')) {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(raw.toString('utf8')), raw });
            } catch {
              resolve({ status: res.statusCode, data: {}, raw });
            }
          } else {
            resolve({ status: res.statusCode, data: {}, raw, contentType: ct });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchCsrf() {
  const csrf = await request('GET', '/api/auth/csrf-token');
  csrfToken = csrf.data?.data?.csrfToken || '';
  return csrfToken;
}

async function login(email, password) {
  await fetchCsrf();
  const auth = await request('POST', '/api/auth/login', { email, password });
  if (auth.status !== 200 || !auth.data.success) throw new Error(`Login falló: ${email}`);
  return auth;
}

async function main() {
  console.log('1. Login admin...');
  await login('admin@sena.edu.co', 'Admin123!');

  console.log('2. Bitácora auditoría...');
  const audit = await request('GET', '/api/auditoria?limit=10');
  if (audit.status !== 200 || !audit.data.success) throw new Error('GET auditoria falló');
  const loginEvent = audit.data.data.items.find((i) => i.accion === 'LOGIN');
  if (!loginEvent) throw new Error('No hay evento LOGIN en auditoría');
  console.log(`   OK ${audit.data.data.pagination.total} eventos, LOGIN registrado`);

  console.log('3. Filtro auditoría por acción...');
  const filt = await request('GET', '/api/auditoria?accion=LOGIN&limit=5');
  if (filt.status !== 200 || !filt.data.data.items.every((i) => i.accion === 'LOGIN')) {
    throw new Error('Filtro acción falló');
  }
  console.log('   OK filtro acción');

  console.log('4. Configuración del sistema...');
  const cfg = await request('GET', '/api/configuracion/sistema');
  if (cfg.status !== 200 || !cfg.data.data.institucion_nombre) throw new Error('GET config falló');
  console.log(`   OK institución: ${cfg.data.data.institucion_nombre.valor}`);

  console.log('5. Actualizar configuración...');
  await fetchCsrf();
  const upd = await request('PUT', '/api/configuracion/sistema', {
    institucion_nombre: 'SENA Carnés — Prueba Sprint 9',
  });
  if (upd.status !== 200 || !upd.data.success) throw new Error('PUT config falló');
  console.log('   OK configuración actualizada');

  console.log('6. Notificaciones...');
  const notif = await request('GET', '/api/notificaciones?limit=10');
  if (notif.status !== 200 || !notif.data.success) throw new Error('GET notificaciones falló');
  console.log(`   OK ${notif.data.data.noLeidas} no leídas`);

  console.log('7. Sesiones activas...');
  const ses = await request('GET', '/api/sesiones');
  if (ses.status !== 200 || !Array.isArray(ses.data.data)) throw new Error('GET sesiones falló');
  if (!ses.data.data.length) throw new Error('Debería haber al menos una sesión activa');
  console.log(`   OK ${ses.data.data.length} sesión(es) activa(s)`);

  console.log('8. Monitoreo...');
  const mon = await request('GET', '/api/monitoreo/estado');
  if (mon.status !== 200 || mon.data.data.servicios.mysql.estado !== 'OK') {
    throw new Error('Monitoreo MySQL no OK');
  }
  console.log(`   OK MySQL ${mon.data.data.servicios.mysql.latenciaMs}ms, ${mon.data.data.almacenamiento.uploadsMb} MB uploads`);

  console.log('9. Diagnóstico seguridad...');
  const seg = await request('GET', '/api/monitoreo/seguridad');
  if (seg.status !== 200 || !seg.data.data.rutasCriticas?.length) throw new Error('GET seguridad falló');
  console.log('   OK rutas críticas verificadas');

  console.log('10. Mis accesos...');
  const acc = await request('GET', '/api/sesiones/mis-accesos');
  if (acc.status !== 200 || !Array.isArray(acc.data.data)) throw new Error('GET mis-accesos falló');
  console.log(`   OK ${acc.data.data.length} acceso(s) reciente(s)`);

  console.log('11. Export genera auditoría...');
  await fetchCsrf();
  const exp = await request('GET', '/api/reportes/usuarios/export?format=csv&limit=5');
  if (exp.status !== 200) throw new Error('Export CSV falló');
  const auditExp = await request('GET', '/api/auditoria?accion=EXPORTAR_REPORTE&limit=1');
  if (!auditExp.data.data.items.length) throw new Error('Export sin registro en auditoría');
  console.log('   OK exportación auditada');

  console.log('12. Permisos sin auth...');
  cookieJar = '';
  csrfToken = '';
  const denied = await request('GET', '/api/auditoria');
  if (denied.status !== 401) throw new Error('Debería rechazar sin sesión');
  console.log('   OK 401 sin sesión');

  console.log('13. Coordinador sin config...');
  await login('coord@sena.edu.co', 'Coord123!');
  const deniedCfg = await request('GET', '/api/configuracion/sistema');
  if (deniedCfg.status !== 403) throw new Error('Coord no debería acceder a config');
  const auditCoord = await request('GET', '/api/auditoria?limit=5');
  if (auditCoord.status !== 200) throw new Error('Coord debería ver auditoría');
  console.log('   OK permisos por rol');

  console.log('SPRINT9_SISTEMA_OK');
}

main().catch((err) => {
  console.error('SPRINT9_VERIFY_FAIL', err.message);
  process.exit(1);
});
