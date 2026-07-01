(function () {
  function toast(msg, type = 'info') {
    const c = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0 show`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div></div>`;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  async function loadConfig() {
    const res = await API.get('/api/configuracion/sistema');
    const c = res.data;
    document.getElementById('cfgNombre').value = c.institucion_nombre?.valor || '';
    document.getElementById('cfgIdioma').value = c.idioma?.valor || 'es';
    document.getElementById('cfgTz').value = c.timezone?.valor || 'America/Bogota';
    document.getElementById('cfgVigencia').value = c.carnet_vigencia_anos?.valor || 1;
    document.getElementById('cfgFormato').value = c.carnet_codigo_formato?.valor || '';
    document.getElementById('cfgUpload').value = c.upload_max_mb?.valor || 5;
    const ms = Number(c.session_max_age_ms?.valor || 28800000);
    document.getElementById('cfgSesionHoras').value = Math.round(ms / 3600000);
    const logo = c.logo_url?.valor;
    if (logo) document.getElementById('logoPreview').src = logo;
  }

  async function saveConfig(e) {
    e.preventDefault();
    const horas = Number(document.getElementById('cfgSesionHoras').value) || 8;
    const body = {
      institucion_nombre: document.getElementById('cfgNombre').value,
      idioma: document.getElementById('cfgIdioma').value,
      timezone: document.getElementById('cfgTz').value,
      carnet_vigencia_anos: Number(document.getElementById('cfgVigencia').value),
      carnet_codigo_formato: document.getElementById('cfgFormato').value,
      upload_max_mb: Number(document.getElementById('cfgUpload').value),
      session_max_age_ms: horas * 3600000,
    };
    await API.put('/api/configuracion/sistema', body);
    toast('Configuración guardada', 'success');
  }

  async function uploadLogo(e) {
    e.preventDefault();
    const file = document.getElementById('inputLogo').files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    const res = await API.post('/api/configuracion/sistema/logo', fd);
    document.getElementById('logoPreview').src = res.data.logoUrl;
    toast('Logo actualizado', 'success');
  }

  async function loadSesiones() {
    const res = await API.get('/api/sesiones');
    const rows = res.data || [];
    document.getElementById('tbodySesiones').innerHTML = rows.length
      ? rows.map((s) => `
        <tr>
          <td>${s.usuarioNombre}<br><small class="text-muted">${s.email}</small></td>
          <td>${s.rolNombre}</td>
          <td>${s.deviceLabel || '—'}</td>
          <td>${s.ip || '—'}</td>
          <td class="small">${new Date(s.lastActivity).toLocaleString('es-CO')}</td>
          <td><button class="btn btn-sm btn-outline-danger btn-revoke" data-id="${s.id}">Cerrar</button></td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="text-center text-muted py-3">No hay sesiones activas</td></tr>';

    document.querySelectorAll('.btn-revoke').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Cerrar esta sesión?')) return;
        await API.post(`/api/sesiones/${btn.dataset.id}/revoke`, {});
        toast('Sesión cerrada', 'success');
        loadSesiones();
      });
    });
  }

  async function loadMonitor() {
    const [estado, seg] = await Promise.all([
      API.get('/api/monitoreo/estado'),
      API.get('/api/monitoreo/seguridad'),
    ]);
    const e = estado.data;
    document.getElementById('monitorCards').innerHTML = `
      <div class="col-md-3"><div class="card monitor-card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">MySQL</div><div class="metric"><span class="badge status-pill-${e.servicios.mysql.estado === 'OK' ? 'ok' : 'err'}">${e.servicios.mysql.estado}</span></div><div class="small">${e.servicios.mysql.latenciaMs ?? '—'} ms</div></div></div></div>
      <div class="col-md-3"><div class="card monitor-card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Sesiones activas</div><div class="metric text-primary">${e.servicios.sesiones.activas}</div></div></div></div>
      <div class="col-md-3"><div class="card monitor-card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Almacenamiento</div><div class="metric">${e.almacenamiento.uploadsMb} MB</div><div class="small">${e.almacenamiento.archivos} archivos</div></div></div></div>
      <div class="col-md-3"><div class="card monitor-card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Alerta seguridad</div><div class="metric"><span class="badge status-pill-${e.seguridad.alerta === 'BAJA' ? 'ok' : 'warn'}">${e.seguridad.alerta}</span></div><div class="small">${e.seguridad.eventos24h} eventos/24h</div></div></div></div>`;

    document.getElementById('diagSeguridad').innerHTML = `
      <p class="small">Eventos recientes: <strong>${seg.data.eventosRecientes}</strong></p>
      <ul class="small">${(seg.data.recomendaciones || []).map((r) => `<li>${r}</li>`).join('')}</ul>`;
  }

  async function loadNotif() {
    const data = await NotificacionesUI.refresh('notifTabBadge');
    NotificacionesUI.renderList('notifList', data?.items || []);
  }

  async function init() {
    const me = await API.get('/api/auth/me');
    if (!me.data.permisos?.includes('config.gestionar')) {
      window.location.href = '/dashboard.html';
      return;
    }
    document.getElementById('userName').textContent = me.data.nombreCompleto;

    document.getElementById('formConfig').addEventListener('submit', (e) => saveConfig(e).catch((err) => toast(err.message, 'danger')));
    document.getElementById('formLogo').addEventListener('submit', (e) => uploadLogo(e).catch((err) => toast(err.message, 'danger')));
    document.getElementById('btnLogout').onclick = async () => { await API.post('/api/auth/logout', {}); location.href = '/login.html'; };
    document.getElementById('btnLeerTodas').onclick = async () => {
      await API.post('/api/notificaciones/leer-todas', {});
      loadNotif();
    };

    document.querySelectorAll('#tabsSistema button[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener('shown.bs.tab', (e) => {
        const t = e.target.getAttribute('data-bs-target');
        if (t === '#tabSesiones') loadSesiones();
        if (t === '#tabMonitor') loadMonitor();
        if (t === '#tabNotif') loadNotif();
      });
    });

    await loadConfig();
    NotificacionesUI.mountNavbar('#notifNavSlot');
    NotificacionesUI.refresh('notifTabBadge');

    if (window.location.hash === '#tabNotif') {
      const tabBtn = document.querySelector('[data-bs-target="#tabNotif"]');
      if (tabBtn) bootstrap.Tab.getOrCreateInstance(tabBtn).show();
      loadNotif();
    }
  }

  init().catch(() => { location.href = '/login.html'; });
})();
