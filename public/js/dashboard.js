/**
 * Dashboard ejecutivo — datos dinámicos, gráficas Chart.js y auto-refresh.
 */
(function () {
  const REFRESH_MS = 60000;
  const SENA_COLORS = ['#0066cc', '#39a900', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997'];

  const state = { charts: {}, user: null, timer: null };

  const STAT_DEFS = [
    { key: 'usuariosTotal', label: 'Usuarios registrados', icon: 'people', color: 'primary' },
    { key: 'usuariosActivos', label: 'Usuarios activos', icon: 'person-check', color: 'success' },
    { key: 'usuariosInactivos', label: 'Usuarios inactivos', icon: 'person-x', color: 'secondary' },
    { key: 'carnetsActivos', label: 'Carnés activos', icon: 'check-circle', color: 'success' },
    { key: 'carnetsVencidos', label: 'Carnés vencidos', icon: 'exclamation-triangle', color: 'warning' },
    { key: 'carnetsSuspendidos', label: 'Carnés suspendidos', icon: 'pause-circle', color: 'info' },
    { key: 'carnetsRevocados', label: 'Carnés revocados', icon: 'x-circle', color: 'danger' },
    { key: 'carnetsEmitidosHoy', label: 'Emitidos hoy', icon: 'calendar-day', color: 'primary' },
    { key: 'carnetsEmitidosMes', label: 'Emitidos este mes', icon: 'calendar-month', color: 'primary' },
    { key: 'validacionesQrHoy', label: 'Validaciones QR hoy', icon: 'qr-code-scan', color: 'info' },
    { key: 'carnetsProximosVencer', label: 'Próximos a vencer', icon: 'clock-history', color: 'danger' },
  ];

  function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO');
  }

  function destroyCharts() {
    Object.values(state.charts).forEach((c) => c.destroy());
    state.charts = {};
  }

  function upsertChart(id, type, labels, datasets, options = {}) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (state.charts[id]) state.charts[id].destroy();
    state.charts[id] = new Chart(canvas, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        ...options,
      },
    });
  }

  function renderStatCards(resumen) {
    const container = document.getElementById('statCards');
    container.innerHTML = STAT_DEFS.map(
      (s) => `
      <div class="col-6 col-md-4 col-xl-3">
        <div class="card stat-card stat-card-compact border-0 shadow-sm">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="text-muted small mb-1">${s.label}</p>
                <p class="stat-value fw-bold mb-0 text-${s.color}">${resumen[s.key] ?? 0}</p>
              </div>
              <div class="stat-icon bg-${s.color}-subtle text-${s.color}">
                <i class="bi bi-${s.icon}"></i>
              </div>
            </div>
          </div>
        </div>
      </div>`
    ).join('');
  }

  function renderQuickActions(actions) {
    const container = document.getElementById('quickActions');
    if (!actions?.length) {
      document.getElementById('seccionAccesos').classList.add('d-none');
      return;
    }
    container.innerHTML = actions
      .map(
        (a) => `
      <div class="col-6 col-md-4 col-lg-3 col-xl-2">
        <a href="${a.href}" class="btn btn-outline-${a.color} quick-action-btn w-100">
          <i class="bi bi-${a.icon}"></i>
          <span class="small fw-medium">${a.label}</span>
        </a>
      </div>`
      )
      .join('');
  }

  function renderCharts(graficas) {
    if (!graficas) return;

    upsertChart(
      'chartCarnetsMes',
      'line',
      graficas.carnetsPorMes.labels,
      [{ label: 'Carnés', data: graficas.carnetsPorMes.values, borderColor: '#0066cc', backgroundColor: 'rgba(0,102,204,0.1)', fill: true, tension: 0.3 }]
    );

    upsertChart(
      'chartCarnetsEstado',
      'doughnut',
      graficas.carnetsPorEstado.labels,
      [{ data: graficas.carnetsPorEstado.values, backgroundColor: SENA_COLORS }]
    );

    upsertChart(
      'chartUsuariosTipo',
      'bar',
      graficas.usuariosPorTipo.labels,
      [{ label: 'Usuarios', data: graficas.usuariosPorTipo.values, backgroundColor: '#39a900' }],
      { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    );

    upsertChart(
      'chartUsuariosRegional',
      'bar',
      graficas.usuariosPorRegional.labels,
      [{ label: 'Usuarios', data: graficas.usuariosPorRegional.values, backgroundColor: '#0066cc' }],
      { indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
    );

    upsertChart('chartValidaciones', 'line', graficas.validacionesPorDia.labels, [
      { label: 'Total', data: graficas.validacionesPorDia.total, borderColor: '#6c757d', tension: 0.3 },
      { label: 'Válidas', data: graficas.validacionesPorDia.validas, borderColor: '#39a900', tension: 0.3 },
    ]);

    upsertChart(
      'chartCentros',
      'bar',
      graficas.emisionesPorCentro.labels,
      [{ label: 'Carnés', data: graficas.emisionesPorCentro.values, backgroundColor: '#0dcaf0' }],
      { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    );
  }

  function renderAlertas(alertas) {
    const container = document.getElementById('alertasContainer');
    const parts = [];

    if (alertas.proximosVencer?.length) {
      parts.push(`<p class="fw-semibold small text-danger mb-2"><i class="bi bi-clock"></i> Próximos a vencer</p>`);
      alertas.proximosVencer.forEach((a) => {
        parts.push(`<div class="alert-item"><strong>${a.codigo}</strong> — ${a.nombre}<br><span class="text-muted">Vence: ${formatDate(a.fechaVencimiento)}</span></div>`);
      });
    }
    if (alertas.usuariosSinFoto?.length) {
      parts.push(`<p class="fw-semibold small text-warning mb-2 mt-3"><i class="bi bi-camera"></i> Sin fotografía</p>`);
      alertas.usuariosSinFoto.forEach((u) => {
        parts.push(`<div class="alert-item">${u.nombre}</div>`);
      });
    }
    if (alertas.carnetsSuspendidos?.length) {
      parts.push(`<p class="fw-semibold small text-info mb-2 mt-3"><i class="bi bi-pause-circle"></i> Carnés suspendidos</p>`);
      alertas.carnetsSuspendidos.forEach((c) => {
        parts.push(`<div class="alert-item"><strong>${c.codigo}</strong> — ${c.nombre}</div>`);
      });
    }

    container.innerHTML = parts.length
      ? parts.join('')
      : '<p class="text-muted small mb-0"><i class="bi bi-check-circle text-success"></i> Sin alertas activas</p>';
  }

  function renderActividad(items) {
    const container = document.getElementById('actividadContainer');
    if (!items?.length) {
      container.innerHTML = '<p class="text-muted small mb-0">Sin actividad reciente</p>';
      return;
    }
    container.innerHTML = items
      .map(
        (a) => `
      <div class="activity-item">
        <div class="fw-medium small">${a.tipo}</div>
        <div class="small">${a.descripcion || a.entidad || ''}</div>
        <div class="time">${a.usuario} · ${formatDateTime(a.fecha)}</div>
      </div>`
      )
      .join('');
  }

  function applyNavPermissions(user) {
    const perms = user.permisos || [];
    const can = (p) => perms.includes(p);
    if (can('usuarios.ver')) document.querySelector('.nav-usuarios')?.classList.remove('d-none');
    if (can('carnets.ver') || can('carnets.generar')) document.querySelector('.nav-carnets')?.classList.remove('d-none');
    if (can('reportes.ver')) document.querySelector('.nav-reportes')?.classList.remove('d-none');
    if (can('auditoria.ver')) document.querySelector('.nav-auditoria')?.classList.remove('d-none');
    if (can('config.gestionar')) document.querySelector('.nav-sistema')?.classList.remove('d-none');
    if (can('regionales.gestionar') || can('roles.gestionar')) document.querySelector('.nav-organizacion')?.classList.remove('d-none');
  }

  function applyVisibility(visibility) {
    if (!visibility.resumenCompleto) document.getElementById('seccionResumen').classList.add('d-none');
    if (!visibility.graficas) document.getElementById('seccionGraficas').classList.add('d-none');
    if (!visibility.alertas) document.getElementById('seccionAlertas').classList.add('d-none');
    if (!visibility.actividad) document.getElementById('seccionActividad').classList.add('d-none');
  }

  async function loadDashboard() {
    const { data } = await API.get('/api/dashboard');
    document.getElementById('scopeLabel').textContent = data.scope || 'Sistema';
    document.getElementById('refreshInfo').textContent = `Actualizado: ${formatDateTime(data.actualizadoEn)} · Auto-refresh 60s`;

    applyVisibility(data.visibility);
    renderQuickActions(data.quickActions);
    if (data.visibility.resumenCompleto) renderStatCards(data.resumen);
    if (data.visibility.graficas) renderCharts(data.graficas);
    if (data.visibility.alertas) renderAlertas(data.alertas);
    if (data.visibility.actividad) renderActividad(data.actividad);

    return data;
  }

  async function init() {
    try {
      const { data: user } = await API.get('/api/auth/me');
      state.user = user;
      document.getElementById('userName').textContent = user.nombreCompleto;
      applyNavPermissions(user);
      NotificacionesUI.mountNavbar();
      NotificacionesUI.refresh();
      await loadDashboard();

      state.timer = setInterval(async () => {
        try {
          destroyCharts();
          await loadDashboard();
        } catch {
          /* silencioso en refresh */
        }
      }, REFRESH_MS);
    } catch {
      window.location.href = '/login.html';
      return;
    }

    document.getElementById('btnLogout').onclick = async () => {
      clearInterval(state.timer);
      try {
        await API.post('/api/auth/logout', {});
      } finally {
        window.location.href = '/login.html';
      }
    };
  }

  init();
})();
