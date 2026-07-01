(function () {
  function fmtDt(d) {
    return new Date(d).toLocaleString('es-CO');
  }

  function renderPagination(pagination, onPage) {
    const el = document.getElementById('pagAudit');
    if (!pagination) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <span class="small text-muted">${pagination.total} evento(s)</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" ${pagination.page <= 1 ? 'disabled' : ''} data-p="${pagination.page - 1}">Anterior</button>
        <span class="btn btn-light disabled">${pagination.page}/${pagination.totalPages}</span>
        <button class="btn btn-outline-secondary" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} data-p="${pagination.page + 1}">Siguiente</button>
      </div>`;
    el.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => onPage(Number(b.dataset.p))));
  }

  function formQuery(page = 1) {
    const fd = new FormData(document.getElementById('formFiltros'));
    const p = new URLSearchParams();
    p.set('page', page);
    p.set('limit', '25');
    for (const [k, v] of fd.entries()) if (v) p.set(k, v);
    return p;
  }

  async function load(page = 1) {
    const res = await API.get(`/api/auditoria?${formQuery(page)}`);
    const d = res.data;

    const selAccion = document.getElementById('selAccion');
    const selModulo = document.getElementById('selModulo');
    if (selAccion.options.length === 1 && d.filtros?.acciones) {
      d.filtros.acciones.forEach((a) => {
        const o = document.createElement('option');
        o.value = a; o.textContent = a;
        selAccion.appendChild(o);
      });
    }
    if (selModulo.options.length === 1 && d.filtros?.modulos) {
      d.filtros.modulos.forEach((m) => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        selModulo.appendChild(o);
      });
    }

    document.getElementById('tbodyAudit').innerHTML = d.items.length
      ? d.items.map((r) => `
        <tr>
          <td class="small">${fmtDt(r.fecha)}</td>
          <td>${r.usuarioNombre}</td>
          <td><span class="badge bg-secondary-subtle text-secondary">${r.rolNombre || '—'}</span></td>
          <td>${r.modulo}</td>
          <td><code class="small">${r.accion}</code></td>
          <td><span class="badge ${r.resultado === 'EXITO' ? 'badge-exito' : 'badge-error'}">${r.resultado}</span></td>
          <td class="small">${r.ip || '—'}</td>
          <td class="audit-detail small" title="${r.detalle ? JSON.stringify(r.detalle) : ''}">${r.detalle ? JSON.stringify(r.detalle) : '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="8" class="text-center text-muted py-4">Sin registros</td></tr>';

    renderPagination(d.pagination, load);
  }

  async function loadSeguridad() {
    try {
      const res = await API.get('/api/auditoria/seguridad');
      const ev = res.data?.eventos || [];
      if (!ev.length) return;
      document.getElementById('cardSeguridad').classList.remove('d-none');
      document.getElementById('listSeguridad').innerHTML = ev.map((e) =>
        `<li class="list-group-item small d-flex justify-content-between">
          <span><strong>${e.accion}</strong> — ${e.usuario} · ${e.ip || ''}</span>
          <span class="text-muted">${fmtDt(e.fecha)}</span>
        </li>`
      ).join('');
    } catch { /* sin permiso o tabla ausente */ }
  }

  async function init() {
    const me = await API.get('/api/auth/me');
    if (!me.data.permisos?.includes('auditoria.ver')) {
      window.location.href = '/dashboard.html';
      return;
    }
    document.getElementById('userName').textContent = me.data.nombreCompleto;
    if (me.data.permisos.includes('config.gestionar')) {
      document.querySelector('.nav-sistema')?.classList.remove('d-none');
    }
    NotificacionesUI.mountNavbar();
    NotificacionesUI.refresh();

    document.getElementById('formFiltros').addEventListener('submit', (e) => { e.preventDefault(); load(1); });
    document.getElementById('btnLimpiar').onclick = () => { document.getElementById('formFiltros').reset(); load(1); };
    document.getElementById('btnLogout').onclick = async () => { await API.post('/api/auth/logout', {}); location.href = '/login.html'; };

    await load(1);
    await loadSeguridad();
  }

  init().catch(() => { location.href = '/login.html'; });
})();
