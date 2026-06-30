/**
 * Sprint 4 — verificación del módulo de carnés vía API.
 * Flujo: usuario con foto → preview → emitir → listar → suspender → reactivar → renovar
 * Uso: node scripts/sprint4-verify-carnets.js (servidor en ejecución)
 */
const base = process.env.APP_URL || 'http://localhost:3000';

function createSession() {
  return { cookie: '', csrf: null };
}

function storeCookies(session, res) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const part = c.split(';')[0];
    if (session.cookie) session.cookie += '; ';
    session.cookie += part;
  }
}

async function fetchJson(session, path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { Accept: 'application/json', Cookie: session.cookie, ...(options.headers || {}) };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!session.csrf) {
      const csrfRes = await fetch(`${base}/api/auth/csrf-token`, {
        headers: { Accept: 'application/json', Cookie: session.cookie },
      });
      storeCookies(session, csrfRes);
      session.csrf = (await csrfRes.json()).data.csrfToken;
    }
    headers['X-CSRF-Token'] = session.csrf;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, { method, headers, body: options.body });
  storeCookies(session, res);
  let data = {};
  if ((res.headers.get('content-type') || '').includes('application/json')) data = await res.json();
  return { res, data };
}

async function login(email, password) {
  const session = createSession();
  const csrfRes = await fetch(`${base}/api/auth/csrf-token`, {
    headers: { Accept: 'application/json', Cookie: session.cookie },
  });
  storeCookies(session, csrfRes);
  session.csrf = (await csrfRes.json()).data.csrfToken;
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': session.csrf,
      Cookie: session.cookie,
    },
    body: JSON.stringify({ email, password }),
  });
  storeCookies(session, loginRes);
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) throw new Error(`Login fail: ${loginData.error}`);
  return session;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function futureDate(days = 365) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const admin = await login('admin@sena.edu.co', 'Admin123!');
  console.log('OK login admin');

  const usersRes = await fetchJson(admin, '/api/usuarios?estado=ACTIVO&limit=20');
  const userWithPhoto = usersRes.data.data.items.find((u) => u.fotoUrl);
  assert(userWithPhoto, 'Se requiere un usuario activo con fotografía en seed');

  const usuarioId = userWithPhoto.id;
  console.log('OK usuario con foto', userWithPhoto.documento);

  const previewRes = await fetchJson(
    admin,
    `/api/carnets/preview?usuarioId=${usuarioId}&fechaVencimiento=${futureDate()}`
  );
  assert(previewRes.res.ok, `Preview: ${previewRes.data.error}`);
  assert(previewRes.data.data.completo, 'Preview incompleto');
  console.log('OK vista previa');

  const existing = await fetchJson(admin, `/api/carnets?usuarioId=${usuarioId}&estado=ACTIVO`);
  if (existing.data.data.items.length) {
    const oldId = existing.data.data.items[0].id;
    await fetchJson(admin, `/api/carnets/${oldId}/revocar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo: 'Limpieza prueba sprint 4' }),
    });
    console.log('OK revocado carné previo para prueba');
  }

  const createRes = await fetchJson(admin, '/api/carnets', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, fechaVencimiento: futureDate() }),
  });
  assert(createRes.res.status === 201, `Crear carné: ${createRes.data.error}`);
  const carnetId = createRes.data.data.id;
  const codigo = createRes.data.data.codigoUnico;
  console.log('OK crear carné', codigo);

  const dupRes = await fetchJson(admin, '/api/carnets', {
    method: 'POST',
    body: JSON.stringify({ usuarioId, fechaVencimiento: futureDate() }),
  });
  assert(dupRes.res.status === 409, 'Debe fallar segundo carné activo');
  console.log('OK unicidad carné activo por usuario');

  const listRes = await fetchJson(admin, `/api/carnets?search=${encodeURIComponent(codigo)}`);
  assert(listRes.data.data.items.some((c) => c.id === carnetId), 'Listado contiene carné');
  console.log('OK listar carné');

  const histRes = await fetchJson(admin, `/api/carnets/${carnetId}/historial`);
  assert(histRes.data.data.length >= 1, 'Historial con emisión');
  console.log('OK historial');

  const suspRes = await fetchJson(admin, `/api/carnets/${carnetId}/suspender`, {
    method: 'PATCH',
    body: JSON.stringify({ motivo: 'Prueba suspensión' }),
  });
  assert(suspRes.res.ok && suspRes.data.data.estado === 'SUSPENDIDO', 'Suspender');
  console.log('OK suspender');

  const reactRes = await fetchJson(admin, `/api/carnets/${carnetId}/reactivar`, {
    method: 'PATCH',
    body: JSON.stringify({ motivo: 'Prueba reactivación' }),
  });
  assert(reactRes.res.ok && reactRes.data.data.estado === 'ACTIVO', 'Reactivar');
  console.log('OK reactivar');

  const renovRes = await fetchJson(admin, `/api/carnets/${carnetId}/renovar`, {
    method: 'PATCH',
    body: JSON.stringify({ motivo: 'Prueba renovación', fechaVencimiento: futureDate(400) }),
  });
  assert(renovRes.res.ok, `Renovar: ${renovRes.data.error}`);
  console.log('OK renovar');

  const syncRes = await fetchJson(admin, `/api/carnets/${carnetId}`, {
    method: 'PUT',
    body: JSON.stringify({ sincronizarUsuario: true }),
  });
  assert(syncRes.res.ok, `Sincronizar: ${syncRes.data.error}`);
  console.log('OK sincronizar datos usuario');

  const noAuth = await fetch(`${base}/api/carnets`, { headers: { Accept: 'application/json' } });
  assert(noAuth.status === 401, 'Sin auth 401');
  console.log('OK permisos');

  console.log('SPRINT4_CARNETS_OK');
}

main().catch((err) => {
  console.error('SPRINT4_FAIL', err.message);
  process.exit(1);
});
