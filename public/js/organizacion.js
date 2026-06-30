/**
 * Módulo organizacional — regionales, centros, dependencias, roles y permisos
 */
(function () {
  const state = {
    regionales: [],
    centrosFiltro: [],
    centrosForm: [],
    permisos: [],
    rolPermisosId: null,
    tabs: {
      regionales: { page: 1, limit: 10 },
      centros: { page: 1, limit: 10 },
      dependencias: { page: 1, limit: 10 },
      roles: { page: 1, limit: 10 },
      permisos: { page: 1, limit: 10 },
    },
  };

  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type = 'success') {
    const id = `toast-${Date.now()}`;
    const bg = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    const icon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
    toastContainer.insertAdjacentHTML(
      'beforeend',
      `<div id="${id}" class="toast align-items-center ${bg} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`
    );
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 4000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  function badgeEstado(estado) {
    const cls = estado === 'ACTIVO' ? 'badge-estado-activo' : 'badge-estado-inactivo';
    const label = estado === 'ACTIVO' ? 'Activo' : 'Inactivo';
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function fillSelect(select, items, valueKey, labelFn, placeholder) {
    select.innerHTML = placeholder ? `<option value="">${placeholder}</option>` : '';
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = labelFn(item);
      select.appendChild(opt);
    });
  }

  function buildParams(fields, tabKey) {
    const params = new URLSearchParams();
    params.set('page', state.tabs[tabKey].page);
    params.set('limit', state.tabs[tabKey].limit);
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') params.set(k, v);
    });
    return params.toString();
  }

  function renderPagination(containerId, infoId, pagination, tabKey, reloadFn) {
    const { page, totalPages, total, limit } = pagination;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    document.getElementById(infoId).textContent = `Mostrando ${from}-${to} de ${total}`;

    let html = `<li class="page-item ${page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">&laquo;</a></li>`;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">&raquo;</a></li>`;

    const ul = document.getElementById(containerId);
    ul.innerHTML = html;
    ul.onclick = (e) => {
      e.preventDefault();
      const link = e.target.closest('[data-page]');
      if (!link || link.parentElement.classList.contains('disabled')) return;
      state.tabs[tabKey].page = parseInt(link.dataset.page, 10);
      reloadFn();
    };
  }

  async function loadRegionalesCatalog() {
    const res = await API.get('/api/catalogos/regionales');
    state.regionales = res.data;
    fillSelect(document.getElementById('filtroCentroRegional'), state.regionales, 'id', (r) => r.nombre, 'Todas');
    fillSelect(document.getElementById('filtroDepRegional'), state.regionales, 'id', (r) => r.nombre, 'Todas');
    fillSelect(document.getElementById('centroRegionalId'), state.regionales, 'id', (r) => r.nombre, '— Seleccionar —');
    fillSelect(document.getElementById('depRegionalId'), state.regionales, 'id', (r) => r.nombre, '— Seleccionar —');
  }

  async function loadCentrosCatalog(regionalId, targetSelect) {
    if (!regionalId) {
      targetSelect.disabled = true;
      targetSelect.innerHTML = '<option value="">— Regional —</option>';
      return [];
    }
    const res = await API.get(`/api/catalogos/centros?regionalId=${regionalId}`);
    fillSelect(targetSelect, res.data, 'id', (c) => c.nombre, 'Todos');
    targetSelect.disabled = false;
    return res.data;
  }

  // --- Regionales ---
  async function loadRegionales() {
    const tbody = document.getElementById('tablaRegionales');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>';
    try {
      const qs = buildParams(
        {
          search: document.getElementById('filtroRegionalSearch').value.trim(),
          activo: document.getElementById('filtroRegionalEstado').value,
        },
        'regionales'
      );
      const res = await API.get(`/api/regionales?${qs}`);
      const items = res.data.items;
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Sin resultados</td></tr>';
      } else {
        tbody.innerHTML = items
          .map(
            (r) => `<tr>
            <td><code>${r.codigo}</code></td>
            <td>${r.nombre}</td>
            <td>${badgeEstado(r.estado)}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-primary btn-edit-regional" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
              ${
                r.activo
                  ? `<button class="btn btn-sm btn-outline-danger btn-off-regional" data-id="${r.id}"><i class="bi bi-slash-circle"></i></button>`
                  : `<button class="btn btn-sm btn-outline-success btn-on-regional" data-id="${r.id}"><i class="bi bi-check-circle"></i></button>`
              }
            </td></tr>`
          )
          .join('');
      }
      renderPagination('pagRegionales', 'pagRegionalesInfo', res.data.pagination, 'regionales', loadRegionales);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  function openRegionalModal(item = null) {
    document.getElementById('formRegional').reset();
    document.getElementById('regionalId').value = item?.id || '';
    document.getElementById('regionalCodigo').value = item?.codigo || '';
    document.getElementById('regionalNombre').value = item?.nombre || '';
    document.getElementById('modalRegionalTitulo').textContent = item ? 'Editar regional' : 'Nueva regional';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRegional')).show();
  }

  async function saveRegional(e) {
    e.preventDefault();
    const id = document.getElementById('regionalId').value;
    const body = {
      codigo: document.getElementById('regionalCodigo').value.trim(),
      nombre: document.getElementById('regionalNombre').value.trim(),
    };
    try {
      const res = id
        ? await API.put(`/api/regionales/${id}`, body)
        : await API.post('/api/regionales', body);
      bootstrap.Modal.getInstance(document.getElementById('modalRegional')).hide();
      showToast(res.message);
      await loadRegionales();
      await loadRegionalesCatalog();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Centros ---
  async function loadCentros() {
    const tbody = document.getElementById('tablaCentros');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>';
    try {
      const qs = buildParams(
        {
          search: document.getElementById('filtroCentroSearch').value.trim(),
          regionalId: document.getElementById('filtroCentroRegional').value,
          activo: document.getElementById('filtroCentroEstado').value,
        },
        'centros'
      );
      const res = await API.get(`/api/centros?${qs}`);
      const items = res.data.items;
      tbody.innerHTML = items.length
        ? items
            .map(
              (c) => `<tr>
              <td><code>${c.codigo}</code></td>
              <td>${c.nombre}</td>
              <td>${c.regionalNombre}</td>
              <td>${badgeEstado(c.estado)}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-primary btn-edit-centro" data-id="${c.id}"><i class="bi bi-pencil"></i></button>
                ${
                  c.activo
                    ? `<button class="btn btn-sm btn-outline-danger btn-off-centro" data-id="${c.id}"><i class="bi bi-slash-circle"></i></button>`
                    : `<button class="btn btn-sm btn-outline-success btn-on-centro" data-id="${c.id}"><i class="bi bi-check-circle"></i></button>`
                }
              </td></tr>`
            )
            .join('')
        : '<tr><td colspan="5" class="text-center py-3 text-muted">Sin resultados</td></tr>';
      renderPagination('pagCentros', 'pagCentrosInfo', res.data.pagination, 'centros', loadCentros);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  async function openCentroModal(item = null) {
    document.getElementById('formCentro').reset();
    document.getElementById('centroId').value = item?.id || '';
    document.getElementById('centroCodigo').value = item?.codigo || '';
    document.getElementById('centroNombre').value = item?.nombre || '';
    if (item?.regionalId) document.getElementById('centroRegionalId').value = item.regionalId;
    document.getElementById('modalCentroTitulo').textContent = item ? 'Editar centro' : 'Nuevo centro';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCentro')).show();
  }

  async function saveCentro(e) {
    e.preventDefault();
    const id = document.getElementById('centroId').value;
    const body = {
      codigo: document.getElementById('centroCodigo').value.trim(),
      nombre: document.getElementById('centroNombre').value.trim(),
      regionalId: document.getElementById('centroRegionalId').value,
    };
    try {
      const res = id
        ? await API.put(`/api/centros/${id}`, body)
        : await API.post('/api/centros', body);
      bootstrap.Modal.getInstance(document.getElementById('modalCentro')).hide();
      showToast(res.message);
      loadCentros();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Dependencias ---
  async function loadDependencias() {
    const tbody = document.getElementById('tablaDependencias');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>';
    try {
      const qs = buildParams(
        {
          search: document.getElementById('filtroDepSearch').value.trim(),
          regionalId: document.getElementById('filtroDepRegional').value,
          centroId: document.getElementById('filtroDepCentro').value,
          activo: document.getElementById('filtroDepEstado').value,
        },
        'dependencias'
      );
      const res = await API.get(`/api/dependencias?${qs}`);
      const items = res.data.items;
      tbody.innerHTML = items.length
        ? items
            .map(
              (d) => `<tr>
              <td>${d.nombre}</td>
              <td>${d.centroNombre}</td>
              <td>${d.regionalNombre}</td>
              <td>${badgeEstado(d.estado)}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-primary btn-edit-dep" data-id="${d.id}"><i class="bi bi-pencil"></i></button>
                ${
                  d.activo
                    ? `<button class="btn btn-sm btn-outline-danger btn-off-dep" data-id="${d.id}"><i class="bi bi-slash-circle"></i></button>`
                    : `<button class="btn btn-sm btn-outline-success btn-on-dep" data-id="${d.id}"><i class="bi bi-check-circle"></i></button>`
                }
              </td></tr>`
            )
            .join('')
        : '<tr><td colspan="5" class="text-center py-3 text-muted">Sin resultados</td></tr>';
      renderPagination('pagDependencias', 'pagDependenciasInfo', res.data.pagination, 'dependencias', loadDependencias);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  async function openDepModal(item = null) {
    document.getElementById('formDependencia').reset();
    document.getElementById('dependenciaId').value = item?.id || '';
    document.getElementById('dependenciaNombre').value = item?.nombre || '';
    const regSelect = document.getElementById('depRegionalId');
    const cenSelect = document.getElementById('depCentroId');
    if (item?.regionalId) {
      regSelect.value = item.regionalId;
      await loadCentrosCatalog(item.regionalId, cenSelect);
      if (item.centroId) cenSelect.value = item.centroId;
    } else {
      cenSelect.disabled = true;
    }
    document.getElementById('modalDependenciaTitulo').textContent = item
      ? 'Editar dependencia'
      : 'Nueva dependencia';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDependencia')).show();
  }

  async function saveDependencia(e) {
    e.preventDefault();
    const id = document.getElementById('dependenciaId').value;
    const body = {
      nombre: document.getElementById('dependenciaNombre').value.trim(),
      centroId: document.getElementById('depCentroId').value,
    };
    try {
      const res = id
        ? await API.put(`/api/dependencias/${id}`, body)
        : await API.post('/api/dependencias', body);
      bootstrap.Modal.getInstance(document.getElementById('modalDependencia')).hide();
      showToast(res.message);
      loadDependencias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Roles ---
  async function loadRoles() {
    const tbody = document.getElementById('tablaRoles');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Cargando...</td></tr>';
    try {
      const qs = buildParams(
        {
          search: document.getElementById('filtroRolSearch').value.trim(),
          activo: document.getElementById('filtroRolEstado').value,
        },
        'roles'
      );
      const res = await API.get(`/api/roles?${qs}`);
      const items = res.data.items;
      tbody.innerHTML = items.length
        ? items
            .map(
              (r) => `<tr>
              <td><span class="fw-medium">${r.nombre}</span></td>
              <td class="small text-muted">${r.descripcion || '—'}</td>
              <td>${r.usuariosCount ?? 0}</td>
              <td>${badgeEstado(r.estado)}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary btn-permisos-rol" data-id="${r.id}" data-nombre="${r.nombre}" title="Permisos"><i class="bi bi-shield-check"></i></button>
                <button class="btn btn-sm btn-outline-primary btn-edit-rol" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
                ${
                  r.activo
                    ? `<button class="btn btn-sm btn-outline-danger btn-off-rol" data-id="${r.id}"><i class="bi bi-slash-circle"></i></button>`
                    : `<button class="btn btn-sm btn-outline-success btn-on-rol" data-id="${r.id}"><i class="bi bi-check-circle"></i></button>`
                }
              </td></tr>`
            )
            .join('')
        : '<tr><td colspan="5" class="text-center py-3 text-muted">Sin resultados</td></tr>';
      renderPagination('pagRoles', 'pagRolesInfo', res.data.pagination, 'roles', loadRoles);

      const sel = document.getElementById('permRolSelect');
      fillSelect(sel, items, 'id', (r) => r.nombre, '— Seleccionar rol —');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  function openRolModal(item = null) {
    document.getElementById('formRol').reset();
    document.getElementById('rolId').value = item?.id || '';
    document.getElementById('rolNombre').value = item?.nombre || '';
    document.getElementById('rolDescripcion').value = item?.descripcion || '';
    document.getElementById('modalRolTitulo').textContent = item ? 'Editar rol' : 'Nuevo rol';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRol')).show();
  }

  async function saveRol(e) {
    e.preventDefault();
    const id = document.getElementById('rolId').value;
    const body = {
      nombre: document.getElementById('rolNombre').value.trim(),
      descripcion: document.getElementById('rolDescripcion').value.trim(),
    };
    try {
      const res = id ? await API.put(`/api/roles/${id}`, body) : await API.post('/api/roles', body);
      bootstrap.Modal.getInstance(document.getElementById('modalRol')).hide();
      showToast(res.message);
      loadRoles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Permisos ---
  async function loadPermisosList() {
    const tbody = document.getElementById('tablaPermisos');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Cargando...</td></tr>';
    try {
      const qs = buildParams(
        { search: document.getElementById('filtroPermSearch').value.trim() },
        'permisos'
      );
      const res = await API.get(`/api/permisos?${qs}`);
      const items = res.data.items;
      tbody.innerHTML = items.length
        ? items
            .map(
              (p) => `<tr>
              <td><code>${p.codigo}</code></td>
              <td>${p.nombre}</td>
              <td>${p.rolesCount ?? 0}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary btn-edit-perm" data-id="${p.id}" data-codigo="${p.codigo}" data-nombre="${p.nombre}"><i class="bi bi-pencil"></i></button>
              </td></tr>`
            )
            .join('')
        : '<tr><td colspan="4" class="text-center py-3 text-muted">Sin resultados</td></tr>';
      renderPagination('pagPermisos', 'pagPermisosInfo', res.data.pagination, 'permisos', loadPermisosList);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  async function loadAllPermisos() {
    const res = await API.get('/api/permisos?all=1');
    state.permisos = res.data;
  }

  async function openPermisosRol(rolId, rolNombre) {
    state.rolPermisosId = rolId;
    document.getElementById('permRolSelect').value = rolId;
    document.getElementById('permRolNombre').textContent = rolNombre;
    document.getElementById('permRolNombreModal').textContent = rolNombre;
    await renderPermisosCheckboxes(rolId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPermisosRol')).show();
  }

  async function renderPermisosCheckboxes(rolId) {
    if (!state.permisos.length) await loadAllPermisos();
    const res = await API.get(`/api/roles/${rolId}`);
    const assigned = new Set((res.data.permisos || []).map((p) => p.id));
    const grid = document.getElementById('permisosGrid');
    grid.innerHTML = state.permisos
      .map(
        (p) => `<div class="form-check">
        <input class="form-check-input perm-check" type="checkbox" value="${p.id}" id="perm-${p.id}" ${assigned.has(p.id) ? 'checked' : ''}>
        <label class="form-check-label" for="perm-${p.id}">
          <code class="small">${p.codigo}</code> — ${p.nombre}
        </label>
      </div>`
      )
      .join('');
  }

  async function savePermisosRol() {
    const ids = [...document.querySelectorAll('.perm-check:checked')].map((el) => el.value);
    try {
      const res = await API.put(`/api/roles/${state.rolPermisosId}/permisos`, { permisoIds: ids });
      bootstrap.Modal.getInstance(document.getElementById('modalPermisosRol')).hide();
      showToast(res.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function openPermisoModal(item = null) {
    document.getElementById('formPermiso').reset();
    document.getElementById('permisoId').value = item?.id || '';
    document.getElementById('permisoCodigo').value = item?.codigo || '';
    document.getElementById('permisoCodigo').disabled = Boolean(item);
    document.getElementById('permisoNombre').value = item?.nombre || '';
    document.getElementById('modalPermisoTitulo').textContent = item ? 'Editar permiso' : 'Nuevo permiso';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPermiso')).show();
  }

  async function savePermiso(e) {
    e.preventDefault();
    const id = document.getElementById('permisoId').value;
    const body = {
      codigo: document.getElementById('permisoCodigo').value.trim(),
      nombre: document.getElementById('permisoNombre').value.trim(),
    };
    try {
      const res = id
        ? await API.put(`/api/permisos/${id}`, { nombre: body.nombre })
        : await API.post('/api/permisos', body);
      bootstrap.Modal.getInstance(document.getElementById('modalPermiso')).hide();
      showToast(res.message);
      state.permisos = [];
      loadPermisosList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function toggleEstado(url, msgOk) {
    try {
      const res = await API.patch(url);
      showToast(res.message || msgOk);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function initSession() {
    const res = await API.get('/api/auth/me');
    document.getElementById('userName').textContent = res.data.nombreCompleto;
    const perms = res.data.permisos || [];
    const canAccess = [
      'regionales.gestionar',
      'centros.gestionar',
      'dependencias.gestionar',
      'roles.gestionar',
      'permisos.gestionar',
    ].some((p) => perms.includes(p));
    if (!canAccess) window.location.href = '/dashboard.html';
  }

  function bindEvents() {
    document.getElementById('btnLogout').onclick = async () => {
      await API.post('/api/auth/logout');
      window.location.href = '/login.html';
    };

    document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener('shown.bs.tab', (e) => {
        const target = e.target.getAttribute('data-bs-target');
        if (target === '#tabRegionales') loadRegionales();
        if (target === '#tabCentros') loadCentros();
        if (target === '#tabDependencias') loadDependencias();
        if (target === '#tabRoles') loadRoles();
        if (target === '#tabPermisos') loadPermisosList();
      });
    });

    document.getElementById('formFiltroRegionales').onsubmit = (e) => {
      e.preventDefault();
      state.tabs.regionales.page = 1;
      loadRegionales();
    };
    document.getElementById('btnNuevaRegional').onclick = () => openRegionalModal();
    document.getElementById('formRegional').onsubmit = saveRegional;
    document.getElementById('tablaRegionales').onclick = async (e) => {
      const id = e.target.closest('[data-id]')?.dataset.id;
      if (!id) return;
      if (e.target.closest('.btn-edit-regional')) {
        const res = await API.get(`/api/regionales/${id}`);
        openRegionalModal(res.data);
      }
      if (e.target.closest('.btn-off-regional') && confirm('¿Desactivar esta regional?')) {
        await toggleEstado(`/api/regionales/${id}/desactivar`, 'Regional desactivada');
        loadRegionales();
      }
      if (e.target.closest('.btn-on-regional') && confirm('¿Reactivar esta regional?')) {
        await toggleEstado(`/api/regionales/${id}/reactivar`, 'Regional reactivada');
        loadRegionales();
      }
    };

    document.getElementById('formFiltroCentros').onsubmit = (e) => {
      e.preventDefault();
      state.tabs.centros.page = 1;
      loadCentros();
    };
    document.getElementById('btnNuevoCentro').onclick = () => openCentroModal();
    document.getElementById('formCentro').onsubmit = saveCentro;
    document.getElementById('tablaCentros').onclick = async (e) => {
      const id = e.target.closest('[data-id]')?.dataset.id;
      if (!id) return;
      if (e.target.closest('.btn-edit-centro')) {
        const res = await API.get(`/api/centros/${id}`);
        openCentroModal(res.data);
      }
      if (e.target.closest('.btn-off-centro') && confirm('¿Desactivar este centro?')) {
        await toggleEstado(`/api/centros/${id}/desactivar`, 'Centro desactivado');
        loadCentros();
      }
      if (e.target.closest('.btn-on-centro') && confirm('¿Reactivar este centro?')) {
        await toggleEstado(`/api/centros/${id}/reactivar`, 'Centro reactivado');
        loadCentros();
      }
    };

    document.getElementById('formFiltroDependencias').onsubmit = (e) => {
      e.preventDefault();
      state.tabs.dependencias.page = 1;
      loadDependencias();
    };
    document.getElementById('filtroDepRegional').onchange = async (e) => {
      await loadCentrosCatalog(e.target.value, document.getElementById('filtroDepCentro'));
    };
    document.getElementById('btnNuevaDependencia').onclick = () => openDepModal();
    document.getElementById('formDependencia').onsubmit = saveDependencia;
    document.getElementById('depRegionalId').onchange = (e) => {
      loadCentrosCatalog(e.target.value, document.getElementById('depCentroId'));
    };
    document.getElementById('tablaDependencias').onclick = async (e) => {
      const id = e.target.closest('[data-id]')?.dataset.id;
      if (!id) return;
      if (e.target.closest('.btn-edit-dep')) {
        const res = await API.get(`/api/dependencias/${id}`);
        openDepModal(res.data);
      }
      if (e.target.closest('.btn-off-dep') && confirm('¿Desactivar esta dependencia?')) {
        await toggleEstado(`/api/dependencias/${id}/desactivar`, 'Dependencia desactivada');
        loadDependencias();
      }
      if (e.target.closest('.btn-on-dep') && confirm('¿Reactivar esta dependencia?')) {
        await toggleEstado(`/api/dependencias/${id}/reactivar`, 'Dependencia reactivada');
        loadDependencias();
      }
    };

    document.getElementById('formFiltroRoles').onsubmit = (e) => {
      e.preventDefault();
      state.tabs.roles.page = 1;
      loadRoles();
    };
    document.getElementById('btnNuevoRol').onclick = () => openRolModal();
    document.getElementById('formRol').onsubmit = saveRol;
    document.getElementById('tablaRoles').onclick = async (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (e.target.closest('.btn-edit-rol')) {
        const res = await API.get(`/api/roles/${id}`);
        openRolModal(res.data);
      }
      if (e.target.closest('.btn-permisos-rol')) {
        openPermisosRol(id, btn.dataset.nombre);
      }
      if (e.target.closest('.btn-off-rol') && confirm('¿Desactivar este rol?')) {
        await toggleEstado(`/api/roles/${id}/desactivar`, 'Rol desactivado');
        loadRoles();
      }
      if (e.target.closest('.btn-on-rol') && confirm('¿Reactivar este rol?')) {
        await toggleEstado(`/api/roles/${id}/reactivar`, 'Rol reactivado');
        loadRoles();
      }
    };

    document.getElementById('formFiltroPermisos').onsubmit = (e) => {
      e.preventDefault();
      state.tabs.permisos.page = 1;
      loadPermisosList();
    };
    document.getElementById('btnNuevoPermiso').onclick = () => openPermisoModal();
    document.getElementById('formPermiso').onsubmit = savePermiso;
    document.getElementById('tablaPermisos').onclick = (e) => {
      const btn = e.target.closest('.btn-edit-perm');
      if (!btn) return;
      openPermisoModal({ id: btn.dataset.id, codigo: btn.dataset.codigo, nombre: btn.dataset.nombre });
    };
    document.getElementById('permRolSelect').onchange = async (e) => {
      if (!e.target.value) return;
      state.rolPermisosId = e.target.value;
      const opt = e.target.selectedOptions[0];
      document.getElementById('permRolNombre').textContent = opt.textContent;
      await renderPermisosCheckboxes(e.target.value);
    };
    document.getElementById('btnGuardarPermisosRol').onclick = savePermisosRol;
  }

  async function init() {
    bindEvents();
    await initSession();
    await loadRegionalesCatalog();
    await loadAllPermisos();
    await loadRegionales();
  }

  init();
})();
