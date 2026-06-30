/**
 * Sprint 2 — verificación del módulo de usuarios vía API.
 * Uso: node scripts/sprint2-verify-usuarios.js (servidor en ejecución)
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

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: options.body,
  });
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
  if (!csrfRes.ok || !csrfData.data?.csrfToken) {
    throw new Error(`CSRF fail ${email}: ${csrfData.error || csrfRes.status}`);
  }
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
    throw new Error(`Login fail ${email}: ${loginData.error || loginRes.status}`);
  }

  return session;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const admin = await login('admin@sena.edu.co', 'Admin123!');
  console.log('OK login admin');

  const listRes = await fetchJson(admin, '/api/usuarios?page=1&limit=5');
  assert(listRes.res.ok && listRes.data.success, 'Listar usuarios');
  assert(Array.isArray(listRes.data.data.items), 'Items en listado');
  console.log('OK listar usuarios', listRes.data.data.pagination.total, 'total');

  const filterRes = await fetchJson(
    admin,
    '/api/usuarios?estado=ACTIVO&tipoUsuario=ADMINISTRADOR&limit=5'
  );
  assert(filterRes.res.ok, 'Filtros combinados');
  console.log('OK filtros combinados');

  const unique = Date.now();
  const createBody = new FormData();
  createBody.append('tipoDocumento', 'CC');
  createBody.append('documento', `TEST${unique}`);
  createBody.append('nombres', 'Usuario');
  createBody.append('apellidos', 'Prueba Sprint2');
  createBody.append('email', `test${unique}@sena.edu.co`);
  createBody.append('password', 'Test123!');
  createBody.append('rolId', 'rol-func');
  createBody.append('estado', 'ACTIVO');

  const createRes = await fetchJson(admin, '/api/usuarios', {
    method: 'POST',
    body: createBody,
  });
  assert(createRes.res.status === 201, `Crear usuario: ${createRes.data.error}`);
  const userId = createRes.data.data.id;
  console.log('OK crear usuario', userId);

  const dupRes = await fetchJson(admin, '/api/usuarios', {
    method: 'POST',
    body: createBody,
  });
  assert(dupRes.res.status === 409, 'Documento/correo duplicado debe fallar');
  console.log('OK validación duplicados');

  const updateBody = new FormData();
  updateBody.append('nombres', 'Usuario');
  updateBody.append('apellidos', 'Actualizado');
  updateBody.append('email', `test${unique}@sena.edu.co`);
  updateBody.append('documento', `TEST${unique}`);
  updateBody.append('rolId', 'rol-func');
  updateBody.append('telefono', '3001234567');

  const updateRes = await fetchJson(admin, `/api/usuarios/${userId}`, {
    method: 'PUT',
    body: updateBody,
  });
  assert(updateRes.res.ok, `Actualizar: ${updateRes.data.error}`);
  assert(
    updateRes.data.data.apellidos === 'Actualizado',
    'Apellidos actualizados'
  );
  console.log('OK actualizar usuario');

  const searchRes = await fetchJson(
    admin,
    `/api/usuarios?search=TEST${unique}`
  );
  assert(
    searchRes.data.data.items.some((u) => u.id === userId),
    'Búsqueda por documento'
  );
  console.log('OK búsqueda');

  const deactivateRes = await fetchJson(admin, `/api/usuarios/${userId}/desactivar`, {
    method: 'PATCH',
  });
  assert(deactivateRes.res.ok, `Desactivar: ${deactivateRes.data.error}`);
  assert(deactivateRes.data.data.estado === 'INACTIVO', 'Estado inactivo');
  console.log('OK desactivar');

  const reactivateRes = await fetchJson(admin, `/api/usuarios/${userId}/reactivar`, {
    method: 'PATCH',
  });
  assert(reactivateRes.res.ok, `Reactivar: ${reactivateRes.data.error}`);
  assert(reactivateRes.data.data.estado === 'ACTIVO', 'Estado activo');
  console.log('OK reactivar');

  const badDocRes = await fetchJson(admin, '/api/usuarios', {
    method: 'POST',
    body: (() => {
      const fd = new FormData();
      fd.append('documento', '123');
      fd.append('nombres', 'X');
      fd.append('apellidos', 'Y');
      fd.append('email', 'bad@test.com');
      fd.append('password', 'Test123!');
      fd.append('rolId', 'rol-func');
      return fd;
    })(),
  });
  assert(badDocRes.res.status === 400, 'Documento corto debe fallar');
  console.log('OK validación documento');

  const noAuthRes = await fetch(`${base}/api/usuarios`, {
    headers: { Accept: 'application/json' },
  });
  assert(noAuthRes.status === 401, 'Sin sesión debe devolver 401');
  console.log('OK permisos sin autenticación');

  console.log('SPRINT2_USUARIOS_OK');
}

main().catch((err) => {
  console.error('SPRINT2_FAIL', err.message);
  process.exit(1);
});
