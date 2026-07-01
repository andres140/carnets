/**
 * Sidebar móvil — solo interacción de layout, sin lógica de negocio.
 */
(function () {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarClose');

  if (!sidebar || !overlay) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-visible');
    overlay.removeAttribute('hidden');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    overlay.setAttribute('hidden', '');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle?.addEventListener('click', () => {
    if (sidebar.classList.contains('is-open')) closeSidebar();
    else openSidebar();
  });

  closeBtn?.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) closeSidebar();
  });
})();
