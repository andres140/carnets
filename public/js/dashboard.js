document.addEventListener('DOMContentLoaded', async () => {
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const btnLogout = document.getElementById('btnLogout');

  try {
    const { data: user } = await API.get('/api/auth/me');
    userName.textContent = user.nombreCompleto;
    userRole.textContent = `${user.rolNombre} · ${user.tipoUsuario}`;
  } catch {
    window.location.href = '/login.html';
    return;
  }

  btnLogout.addEventListener('click', async () => {
    try {
      await API.post('/api/auth/logout', {});
    } finally {
      window.location.href = '/login.html';
    }
  });
});
