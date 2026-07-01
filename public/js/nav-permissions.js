/**
 * Visibilidad del menú lateral según permisos — compartido entre páginas autenticadas.
 */
(function () {
  function applyNavPermissions(user) {
    const perms = new Set(user?.permisos || []);
    const can = (p) => perms.has(p);
    if (can('usuarios.ver')) document.querySelectorAll('.nav-usuarios').forEach((e) => e.classList.remove('d-none'));
    if (can('carnets.ver')) document.querySelectorAll('.nav-carnets').forEach((e) => e.classList.remove('d-none'));
    if (can('reportes.ver')) document.querySelectorAll('.nav-reportes').forEach((e) => e.classList.remove('d-none'));
    if (can('auditoria.ver')) document.querySelectorAll('.nav-auditoria').forEach((e) => e.classList.remove('d-none'));
    if (can('config.gestionar')) document.querySelectorAll('.nav-sistema').forEach((e) => e.classList.remove('d-none'));
    if (can('regionales.gestionar') || can('roles.gestionar')) {
      document.querySelectorAll('.nav-organizacion').forEach((e) => e.classList.remove('d-none'));
    }
  }

  async function init() {
    if (!document.getElementById('navLinks')) return;
    try {
      const { data: user } = await API.get('/api/auth/me');
      applyNavPermissions(user);
    } catch {
      /* la página redirige si no hay sesión */
    }
  }

  if (typeof API !== 'undefined') init();
})();
