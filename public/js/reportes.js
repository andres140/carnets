/**
 * Centro de reportes — consultas, gráficas y exportación.
 */
(function () {
  const COLORS = ['#39A900', '#1F6B2A', '#FFC107', '#DC3545', '#0DCAF0', '#28A745'];
  const state = { user: null, charts: {}, filters: { usuarios: {}, carnets: {}, validaciones: {}, busqueda: {} }, catalogs: {} };

  function toast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0 show`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO');
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function formToQuery(form, page = 1) {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    for (const [k, v] of fd.entries()) {
      if (v && String(v).trim()) params.set(k, v);
    }
    return params;
  }

  function destroyChart(id) {
    if (state.charts[id]) {
      state.charts[id].destroy();
      delete state.charts[id];
    }
  }

  function renderChart(id, type, labels, data, label = 'Total') {
    destroyChart(id);
    const canvas = document.getElementById(id);
    if (!canvas) return;
    state.charts[id] = new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [{ label, data, backgroundColor: COLORS, borderWidth: 1 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: type === 'bar' || type === 'line' ? { y: { beginAtZero: true } } : undefined,
      },
    });
  }

  function renderPagination(containerId, pagination, onPage) {
    const el = document.getElementById(containerId);
    if (!el || !pagination) {
      if (el) el.innerHTML = '';
      return;
    }
    const { page, totalPages, total } = pagination;
    el.innerHTML = `
      <span class="small text-muted">${total} registro(s)</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Anterior</button>
        <span class="btn btn-light disabled">${page} / ${totalPages}</span>
        <button class="btn btn-outline-secondary" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Siguiente</button>
      </div>`;
    el.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
    });
  }

  function applyNavPermissions(user) {
    const perms = user.permisos || [];
    if (perms.includes('usuarios.ver')) document.querySelectorAll('.nav-usuarios').forEach((e) => e.classList.remove('d-none'));
    if (perms.some((p) => p.startsWith('regionales.') || p.startsWith('roles.'))) {
      document.querySelectorAll('.nav-organizacion').forEach((e) => e.classList.remove('d-none'));
    }
    if (perms.includes('carnets.ver') || perms.includes('carnets.generar')) {
      document.querySelectorAll('.nav-carnets').forEach((e) => e.classList.remove('d-none'));
    }
  }

  async function loadCatalogs() {
    const [regionales, centros, roles] = await Promise.all([
      API.get('/api/catalogos/regionales'),
      API.get('/api/catalogos/centros'),
      API.get('/api/catalogos/roles'),
    ]);
    state.catalogs.regionales = regionales.data || [];
    state.catalogs.centros = centros.data || [];
    state.catalogs.roles = roles.data || [];

    const tipoOpts = ['', 'APRENDIZ', 'INSTRUCTOR', 'FUNCIONARIO', 'CONTRATISTA', 'COORDINADOR', 'ADMINISTRADOR']
      .map((t) => `<option value="${t}">${t || 'Todos'}</option>`).join('');
    document.getElementById('selTipoUsuario').innerHTML = tipoOpts;

    const regionalOpts = '<option value="">Todas</option>' + state.catalogs.regionales
      .map((r) => `<option value="${r.id}">${r.nombre}</option>`).join('');

    ['selRegionalUsuarios', 'selRegionalCarnets', 'selRegionalValidaciones', 'selRegionalBusqueda'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = regionalOpts;
    });

    fillCentrosSelect('selCentroUsuarios', '');
    fillCentrosSelect('selCentroCarnets', '');
    fillCentrosSelect('selCentroBusqueda', '');
  }

  function fillCentrosSelect(selectId, regionalId) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const list = regionalId
      ? state.catalogs.centros.filter((c) => c.regional_id === regionalId || c.regionalId === regionalId)
      : state.catalogs.centros;
    el.innerHTML = '<option value="">Todos</option>' + list.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');
  }

  async function loadResumen() {
    const res = await API.get('/api/reportes/estadisticas');
    const d = res.data;
    document.getElementById('scopeLabel').textContent = d.scope;

    const kpis = [
      { label: 'Usuarios', value: d.totales.usuarios, color: 'primary' },
      { label: 'Activos', value: d.totales.usuariosActivos, color: 'success' },
      { label: 'Carnés activos', value: d.totales.carnetsActivos, color: 'success' },
      { label: 'Vencidos', value: d.totales.carnetsVencidos, color: 'warning' },
      { label: 'Suspendidos', value: d.totales.carnetsSuspendidos, color: 'info' },
      { label: 'Próx. vencer', value: d.totales.carnetsProximosVencer, color: 'danger' },
      { label: 'Emitidos mes', value: d.totales.carnetsEmitidosMes, color: 'primary' },
      { label: 'Valid. hoy', value: d.totales.validacionesHoy, color: 'info' },
    ];

    document.getElementById('kpiCards').innerHTML = kpis.map((k) => `
      <div class="col-6 col-md-3 col-xl-2">
        <div class="card border-0 shadow-sm report-kpi h-100">
          <div class="card-body py-3">
            <div class="text-muted small">${k.label}</div>
            <div class="kpi-value text-${k.color}">${k.value}</div>
          </div>
        </div>
      </div>`).join('');

    renderChart('chartCarnetsEstado', 'doughnut', d.carnetsPorEstado.map((x) => x.estado), d.carnetsPorEstado.map((x) => x.total));
    renderChart('chartUsuariosRegional', 'bar', d.usuariosPorRegional.map((x) => x.regional), d.usuariosPorRegional.map((x) => x.total));
    renderChart('chartEmisiones', 'line', d.emisionesPorPeriodo.map((x) => x.periodo), d.emisionesPorPeriodo.map((x) => x.total));
    renderChart('chartValidaciones', 'bar', d.validacionesPorDia.map((x) => fmtDate(x.fecha)), d.validacionesPorDia.map((x) => x.total));
  }

  async function loadUsuarios(page = 1) {
    const form = document.getElementById('formFiltrosUsuarios');
    const params = formToQuery(form, page);
    state.filters.usuarios = params.toString();
    const res = await API.get(`/api/reportes/usuarios?${params}`);
    const d = res.data;

    document.getElementById('statsUsuarios').textContent =
      `Total: ${d.estadisticas.total} · Activos: ${d.estadisticas.activos} · Inactivos: ${d.estadisticas.inactivos} · ${d.filtrosLabel}`;

    document.getElementById('tbodyUsuarios').innerHTML = d.items.length
      ? d.items.map((u) => `<tr>
          <td>${u.documento}</td><td>${u.nombreCompleto}</td><td>${u.email}</td>
          <td><span class="badge bg-secondary-subtle text-secondary">${u.tipoUsuario}</span></td>
          <td>${u.estado}</td><td>${u.regionalNombre || '—'}</td><td>${fmtDate(u.fechaRegistro)}</td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="text-center text-muted py-4">Sin resultados</td></tr>';

    renderPagination('pagUsuarios', d.pagination, loadUsuarios);
  }

  async function loadCarnets(page = 1) {
    const form = document.getElementById('formFiltrosCarnets');
    const params = formToQuery(form, page);
    if (form.querySelector('[name=proximosVencer]')?.checked) params.set('proximosVencer', '1');
    state.filters.carnets = params.toString();
    const res = await API.get(`/api/reportes/carnets?${params}`);
    const d = res.data;

    const estados = (d.estadisticas.porEstado || []).map((e) => `${e.estado}: ${e.total}`).join(' · ');
    document.getElementById('statsCarnets').textContent = `Total: ${d.estadisticas.total} · ${estados}`;

    document.getElementById('tbodyCarnets').innerHTML = d.items.length
      ? d.items.map((c) => `<tr>
          <td><code>${c.codigoUnico}</code></td><td>${c.documento}</td><td>${c.nombreCompleto}</td>
          <td>${c.estado}</td><td>${fmtDate(c.fechaExpedicion)}</td><td>${fmtDate(c.fechaVencimiento)}</td>
          <td>${c.regionalNombre || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="text-center text-muted py-4">Sin resultados</td></tr>';

    renderPagination('pagCarnets', d.pagination, loadCarnets);
  }

  async function loadValidaciones(page = 1) {
    const form = document.getElementById('formFiltrosValidaciones');
    const params = formToQuery(form, page);
    state.filters.validaciones = params.toString();
    const res = await API.get(`/api/reportes/validaciones?${params}`);
    const d = res.data;

    document.getElementById('valExitosas').textContent = d.estadisticas.exitosas;
    document.getElementById('valFallidas').textContent = d.estadisticas.fallidas;
    document.getElementById('valTotal').textContent = d.estadisticas.total;

    document.getElementById('tbodyValidaciones').innerHTML = d.items.length
      ? d.items.map((v) => `<tr>
          <td>${fmtDateTime(v.fecha)}</td>
          <td><span class="badge ${v.resultado === 'VALIDO' ? 'bg-success' : 'bg-danger'}">${v.resultado}</span></td>
          <td>${v.codigoUnico || '—'}</td><td>${v.nombreCompleto || '—'}</td><td>${v.regionalNombre || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="text-center text-muted py-4">Sin resultados</td></tr>';

    document.getElementById('listMasConsultados').innerHTML = (d.estadisticas.masConsultados || []).length
      ? d.estadisticas.masConsultados.map((m) =>
          `<li class="list-group-item d-flex justify-content-between small"><span>${m.nombre || m.codigo}</span><span class="badge bg-primary">${m.total}</span></li>`
        ).join('')
      : '<li class="list-group-item text-muted small">Sin datos</li>';

    const horas = d.estadisticas.porHora || [];
    renderChart('chartHorasValidacion', 'bar', horas.map((h) => h.hora), horas.map((h) => h.total), 'Escaneos');

    renderPagination('pagValidaciones', d.pagination, loadValidaciones);
  }

  async function loadBusqueda(page = 1) {
    const form = document.getElementById('formBusqueda');
    const params = formToQuery(form, page);
    state.filters.busqueda = params.toString();
    const res = await API.get(`/api/reportes/busqueda?${params}`);
    const d = res.data;
    document.getElementById('busquedaMeta').textContent = `${d.tipo} · ${d.estadisticas?.total ?? d.pagination?.total ?? 0} resultado(s) · ${d.filtrosLabel || ''}`;

    if (d.tipo === 'usuarios') {
      document.getElementById('theadBusqueda').innerHTML = '<tr><th>Documento</th><th>Nombre</th><th>Correo</th><th>Estado</th><th>Regional</th></tr>';
      document.getElementById('tbodyBusqueda').innerHTML = d.items.map((u) =>
        `<tr><td>${u.documento}</td><td>${u.nombreCompleto}</td><td>${u.email}</td><td>${u.estado}</td><td>${u.regionalNombre || '—'}</td></tr>`
      ).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">Sin resultados</td></tr>';
    } else if (d.tipo === 'validaciones') {
      document.getElementById('theadBusqueda').innerHTML = '<tr><th>Fecha</th><th>Resultado</th><th>Código</th><th>Nombre</th></tr>';
      document.getElementById('tbodyBusqueda').innerHTML = d.items.map((v) =>
        `<tr><td>${fmtDateTime(v.fecha)}</td><td>${v.resultado}</td><td>${v.codigoUnico || '—'}</td><td>${v.nombreCompleto || '—'}</td></tr>`
      ).join('') || '<tr><td colspan="4" class="text-center text-muted py-4">Sin resultados</td></tr>';
    } else {
      document.getElementById('theadBusqueda').innerHTML = '<tr><th>Código</th><th>Documento</th><th>Nombre</th><th>Estado</th><th>Vencimiento</th></tr>';
      document.getElementById('tbodyBusqueda').innerHTML = d.items.map((c) =>
        `<tr><td>${c.codigoUnico}</td><td>${c.documento}</td><td>${c.nombreCompleto}</td><td>${c.estado}</td><td>${fmtDate(c.fechaVencimiento)}</td></tr>`
      ).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">Sin resultados</td></tr>';
    }

    renderPagination('pagBusqueda', d.pagination, loadBusqueda);
  }

  async function exportReport(tipo, format) {
    const filterKey = tipo === 'usuarios' ? 'usuarios' : tipo === 'validaciones' ? 'validaciones' : 'carnets';
    const qs = state.filters[filterKey] || 'limit=20';
    const url = `/api/reportes/${tipo}/export?format=${format}&${qs.replace(/page=\d+&?/, '')}`;
    try {
      toast('Generando exportación…', 'primary');
      await API.downloadExport(url);
      toast('Exportación descargada', 'success');
    } catch (err) {
      toast(err.message || 'Error al exportar', 'danger');
    }
  }

  function bindEvents() {
    document.getElementById('btnLogout').addEventListener('click', async () => {
      await API.post('/api/auth/logout', {});
      window.location.href = '/login.html';
    });

    document.getElementById('formFiltrosUsuarios').addEventListener('submit', (e) => {
      e.preventDefault();
      loadUsuarios(1);
    });
    document.getElementById('formFiltrosCarnets').addEventListener('submit', (e) => {
      e.preventDefault();
      loadCarnets(1);
    });
    document.getElementById('formFiltrosValidaciones').addEventListener('submit', (e) => {
      e.preventDefault();
      loadValidaciones(1);
    });
    document.getElementById('formBusqueda').addEventListener('submit', (e) => {
      e.preventDefault();
      loadBusqueda(1);
    });

    document.querySelectorAll('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const form = document.getElementById(btn.dataset.reset);
        form.reset();
      });
    });

    document.querySelectorAll('.btn-export').forEach((btn) => {
      btn.addEventListener('click', () => exportReport(btn.dataset.tipo, btn.dataset.format));
    });

    document.getElementById('selRegionalUsuarios')?.addEventListener('change', (e) => fillCentrosSelect('selCentroUsuarios', e.target.value));
    document.getElementById('selRegionalCarnets')?.addEventListener('change', (e) => fillCentrosSelect('selCentroCarnets', e.target.value));
    document.getElementById('selRegionalBusqueda')?.addEventListener('change', (e) => fillCentrosSelect('selCentroBusqueda', e.target.value));

    document.querySelectorAll('#reportTabs button[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener('shown.bs.tab', (e) => {
        const target = e.target.getAttribute('data-bs-target');
        if (target === '#tabUsuarios' && !state.loadedUsuarios) { state.loadedUsuarios = true; loadUsuarios(); }
        if (target === '#tabCarnets' && !state.loadedCarnets) { state.loadedCarnets = true; loadCarnets(); }
        if (target === '#tabValidaciones' && !state.loadedVal) { state.loadedVal = true; loadValidaciones(); }
      });
    });
  }

  async function init() {
    try {
      const me = await API.get('/api/auth/me');
      state.user = me.data;
      if (!state.user.permisos?.includes('reportes.ver')) {
        window.location.href = '/dashboard.html';
        return;
      }
      document.getElementById('userName').textContent = state.user.nombreCompleto;
      applyNavPermissions(state.user);
      NotificacionesUI.mountNavbar();
      NotificacionesUI.refresh();
      await loadCatalogs();
      bindEvents();
      await loadResumen();
    } catch {
      window.location.href = '/login.html';
    }
  }

  init();
})();
