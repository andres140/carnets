/**
 * Script temporal Sprint 0 — verificar login admin y coordinador vía API.
 * Uso: node scripts/sprint0-verify-auth.js (servidor en ejecución)
 */
const base = process.env.APP_URL || 'http://localhost:3000';

async function login(email, password) {
  const jar = { cookie: '' };

  function storeCookies(res) {
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      const part = c.split(';')[0];
      if (jar.cookie) jar.cookie += '; ';
      jar.cookie += part;
    }
  }

  const csrfRes = await fetch(`${base}/api/auth/csrf-token`, {
    headers: { Accept: 'application/json', Cookie: jar.cookie },
  });
  storeCookies(csrfRes);
  const csrfData = await csrfRes.json();
  if (!csrfRes.ok || !csrfData.data?.csrfToken) {
    throw new Error(`CSRF fail ${email}: ${csrfData.error || csrfRes.status}`);
  }

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfData.data.csrfToken,
      Cookie: jar.cookie,
    },
    body: JSON.stringify({ email, password }),
  });
  storeCookies(loginRes);
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login fail ${email}: ${loginData.error || loginRes.status}`);
  }

  const meRes = await fetch(`${base}/api/auth/me`, {
    headers: { Accept: 'application/json', Cookie: jar.cookie },
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.success) {
    throw new Error(`Me fail ${email}: ${meData.error || meRes.status}`);
  }

  return meData.data;
}

async function main() {
  const admin = await login('admin@sena.edu.co', 'Admin123!');
  console.log('LOGIN_ADMIN_OK', admin.email, admin.rolNombre);

  const coord = await login('coord@sena.edu.co', 'Coord123!');
  console.log('LOGIN_COORD_OK', coord.email, coord.rolNombre);
}

main().catch((err) => {
  console.error('AUTH_FAIL', err.message);
  process.exit(1);
});
