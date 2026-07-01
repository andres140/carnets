/**
 * Campana de notificaciones — incluir en páginas autenticadas.
 */
const NOTIF_NAV_HTML = `
  <div class="dropdown notif-dropdown">
    <button class="btn btn-link notif-trigger position-relative p-0" type="button" data-bs-toggle="dropdown" aria-label="Notificaciones">
      <i class="bi bi-bell fs-5"></i>
      <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" id="notifBadge">0</span>
    </button>
    <div class="dropdown-menu dropdown-menu-end shadow notif-dropdown-menu">
      <div class="dropdown-header d-flex justify-content-between align-items-center">
        <span>Notificaciones</span>
        <a href="/sistema.html#tabNotif" class="small text-decoration-none">Ver todas</a>
      </div>
      <div id="notifDropdownList" class="notif-dropdown-list"></div>
    </div>
  </div>`;

const NotificacionesUI = {
  mountNavbar(containerSelector = '#notifNavSlot') {
    const slot = document.querySelector(containerSelector);
    if (!slot || slot.dataset.notifMounted) return;
    slot.innerHTML = NOTIF_NAV_HTML;
    slot.dataset.notifMounted = '1';
    const dropdown = slot.querySelector('[data-bs-toggle="dropdown"]');
    dropdown?.addEventListener('show.bs.dropdown', () => {
      this.refresh().then((data) => this.renderList('notifDropdownList', data?.items || []));
    });
  },

  async refresh(badgeId = 'notifBadge') {
    try {
      const res = await API.get('/api/notificaciones?soloNoLeidas=true&limit=5');
      const badge = document.getElementById(badgeId);
      if (badge) {
        const n = res.data?.noLeidas || 0;
        badge.textContent = n > 99 ? '99+' : String(n);
        badge.classList.toggle('d-none', n === 0);
      }
      return res.data;
    } catch {
      return null;
    }
  },

  renderList(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items?.length) {
      el.innerHTML = '<div class="text-muted small p-3">Sin notificaciones</div>';
      return;
    }
    el.innerHTML = items
      .map(
        (n) => `
      <div class="notif-item p-3 border-bottom ${n.leida ? '' : 'unread'}" data-id="${n.id}">
        <div class="fw-semibold small">${n.titulo}</div>
        <div class="small text-muted">${n.mensaje}</div>
        <div class="text-muted" style="font-size:0.7rem">${new Date(n.fecha).toLocaleString('es-CO')}</div>
      </div>`
      )
      .join('');

    el.querySelectorAll('[data-id]').forEach((node) => {
      node.addEventListener('click', async () => {
        try {
          await API.patch(`/api/notificaciones/${node.dataset.id}/leer`, {});
          node.classList.remove('unread');
          await NotificacionesUI.refresh();
        } catch {
          /* ignore */
        }
      });
    });
  },
};
