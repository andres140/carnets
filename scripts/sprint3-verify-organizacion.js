/**
 * Sprint 3 — verificación módulo organizacional vía API.
 * Uso: node scripts/sprint3-verify-organizacion.js (servidor en ejecución)
 */
const base = process.env.APP_URL || 'http://localhost:3000';

function createSession() {
  return { cookie: '', csrf: null };
}

function storeCookies(session, res) {
  const setCookie = res.headers.getSetCookie?.() || [];
  for (const c of setCookie) {
    const part = c.split(';')[0];
    if (session.cookie) session.cookie += '; ';
    session.cookie += part;
  }
}

async function fetchJson(session, path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    Cookie: session.cookie,
    ...(options.headers || {}),
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!session.csrf) {
      const csrfRes = await fetch(`${base}/api/auth/csrf-token`, {
        headers: { Accept: 'application/json', Cookie: session.cookie },
      });
      storeCookies(session, csrfRes);
      const csrfData = await csrfRes.json();
      if (!csrfRes.ok || !csrfData.data?.csrfToken) {
        throw new Error(`CSRF fail: ${csrfData.error || csrfRes.status}`);
      }
      session.csrf = csrfData.data.csrfToken;
    }
    headers['X-CSRF-Token'] = session.csrf;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, { method, headers, body: options.body });
  storeCookies(session, res);

  let data = {};
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await res.json();
  return { res, data };
}

async function login(email, password) {
  const session = createSession();
  const csrfRes = await fetch(`${base}/api/auth/csrf-token`, {
    headers: { Accept: 'application/json', Cookie: session.cookie },
  });
  storeCookies(session, csrfRes);
  const csrfData = await csrfRes.json();
  session.csrf = csrfData.data.csrfToken;

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
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login fail: ${loginData.error || loginRes.status}`);
  }
  return session;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const admin = await login('admin@sena.edu.co', 'Admin123!');
  console.log('OK login admin');

  const unique = Date.now().toString().slice(-6);

  // Regionales
  const regCreate = await fetchJson(admin, '/api/regionales', {
    method: 'POST',
    body: JSON.stringify({ codigo: `T${unique}`, nombre: `Regional Test ${unique}` }),
  });
  assert(regCreate.res.status === 201, `Crear regional: ${regCreate.data.error}`);
  const regId = regCreate.data.data.id;
  console.log('OK crear regional', regId);

  const regDup = await fetchJson(admin, '/api/regionales', {
    method: 'POST',
    body: JSON.stringify({ codigo: `T${unique}`, nombre: 'Duplicado' }),
  });
  assert(regDup.res.status === 409, 'Código regional duplicado');
  console.log('OK duplicado regional');

  const regUpdate = await fetchJson(admin, `/api/regionales/${regId}`, {
    method: 'PUT',
    body: JSON.stringify({ codigo: `T${unique}`, nombre: `Regional Actualizada ${unique}` }),
  });
  assert(regUpdate.res.ok, `Actualizar regional: ${regUpdate.data.error}`);
  console.log('OK actualizar regional');

  // Centros
  const cenCreate = await fetchJson(admin, '/api/centros', {
    method: 'POST',
    body: JSON.stringify({
      codigo: `C${unique}`,
      nombre: `Centro Test ${unique}`,
      regionalId: regId,
    }),
  });
  assert(cenCreate.res.status === 201, `Crear centro: ${cenCreate.data.error}`);
  const cenId = cenCreate.data.data.id;
  console.log('OK crear centro', cenId);

  // Dependencias
  const depCreate = await fetchJson(admin, '/api/dependencias', {
    method: 'POST',
    body: JSON.stringify({ nombre: `Dependencia Test ${unique}`, centroId: cenId }),
  });
  assert(depCreate.res.status === 201, `Crear dependencia: ${depCreate.data.error}`);
  const depId = depCreate.data.data.id;
  console.log('OK crear dependencia', depId);

  // Roles
  const rolCreate = await fetchJson(admin, '/api/roles', {
    method: 'POST',
    body: JSON.stringify({ nombre: `ROL_TEST_${unique}`, descripcion: 'Rol de prueba sprint 3' }),
  });
  assert(rolCreate.res.status === 201, `Crear rol: ${rolCreate.data.error}`);
  const rolId = rolCreate.data.data.id;
  console.log('OK crear rol', rolId);

  const permList = await fetchJson(admin, '/api/permisos?all=1');
  assert(permList.res.ok && permList.data.data.length > 0, 'Listar permisos');
  const permIds = permList.data.data.slice(0, 3).map((p) => p.id);

  const setPerm = await fetchJson(admin, `/api/roles/${rolId}/permisos`, {
    method: 'PUT',
    body: JSON.stringify({ permisoIds: permIds }),
  });
  assert(setPerm.res.ok, `Asignar permisos: ${setPerm.data.error}`);
  assert(setPerm.data.data.permisos.length === 3, 'Permisos asignados');
  console.log('OK asignar permisos a rol');

  // Catálogos integración usuarios
  const catReg = await fetchJson(admin, '/api/catalogos/regionales');
  assert(catReg.data.data.some((r) => r.id === regId), 'Regional en catálogo');
  const catCen = await fetchJson(admin, `/api/catalogos/centros?regionalId=${regId}`);
  assert(catCen.data.data.some((c) => c.id === cenId), 'Centro en catálogo');
  const catDep = await fetchJson(admin, `/api/catalogos/dependencias?centroId=${cenId}`);
  assert(catDep.data.data.some((d) => d.id === depId), 'Dependencia en catálogo');
  console.log('OK integración catálogos');

  // Desactivar en cascada inversa
  const depOff = await fetchJson(admin, `/api/dependencias/${depId}/desactivar`, { method: 'PATCH' });
  assert(depOff.res.ok, `Desactivar dependencia: ${depOff.data.error}`);
  const cenOff = await fetchJson(admin, `/api/centros/${cenId}/desactivar`, { method: 'PATCH' });
  assert(cenOff.res.ok, `Desactivar centro: ${cenOff.data.error}`);
  const regOff = await fetchJson(admin, `/api/regionales/${regId}/desactivar`, { method: 'PATCH' });
  assert(regOff.res.ok, `Desactivar regional: ${regOff.data.error}`);
  console.log('OK desactivar entidades');

  const rolOff = await fetchJson(admin, `/api/roles/${rolId}/desactivar`, { method: 'PATCH' });
  assert(rolOff.res.ok, `Desactivar rol: ${rolOff.data.error}`);
  console.log('OK desactivar rol');

  // Sin permisos
  const noAuth = await fetch(`${base}/api/regionales`, { headers: { Accept: 'application/json' } });
  assert(noAuth.status === 401, 'Sin auth debe ser 401');
  console.log('OK control acceso sin sesión');

  console.log('SPRINT3_ORGANIZACION_OK');
}

main().catch((err) => {
  console.error('SPRINT3_FAIL', err.message);
  process.exit(1);
});
