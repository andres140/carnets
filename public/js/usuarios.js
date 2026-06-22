/**
 * Módulo de gestión de usuarios
 */
(function () {
  const state = {
    page: 1,
    limit: 10,
    roles: [],
    regionales: [],
    editingId: null,
  };

  const modalEl = document.getElementById('modalUsuario');
  const modal = new bootstrap.Modal(modalEl);

  const els = {
    tabla: document.getElementById('tablaUsuarios'),
    paginacion: document.getElementById('paginacion'),
    paginacionInfo: document.getElementById('paginacionInfo'),
    formFiltros: document.getElementById('formFiltros'),
    formUsuario: document.getElementById('formUsuario'),
    formAlert: document.getElementById('formAlert'),
    userName: document.getElementById('userName'),
  };

  function badgeEstado(estado) {
    const map = {
      ACTIVO: 'badge-estado-activo',
      INACTIVO: 'badge-estado-inactivo',
      SUSPENDIDO: 'badge-estado-suspendido',
    };
    const cls = map[estado] || 'bg-secondary';
    const label = estado.charAt(0) + estado.slice(1).toLowerCase();
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function avatarHtml(fotoUrl, nombre) {
    const initials = (nombre || '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    if (fotoUrl) {
      return `<img src="${fotoUrl}" alt="${nombre}" class="user-avatar" onerror="this.replaceWith(document.createTextNode('${initials}'))">`;
    }
    return `<span class="user-avatar d-inline-flex align-items-center justify-content-center bg-light text-muted small fw-bold">${initials}</span>`;
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);

    const fields = {
      search: document.getElementById('filtroSearch').value.trim(),
      documento: document.getElementById('filtroDocumento').value.trim(),
      nombre: document.getElementById('filtroNombre').value.trim(),
      email: document.getElementById('filtroEmail').value.trim(),
      rolId: document.getElementById('filtroRol').value,
      estado: document.getElementById('filtroEstado').value,
    };

    Object.entries(fields).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });

    return params.toString();
  }

  async function loadUsuarios() {
    els.tabla.innerHTML =
      '<tr><td colspan="8" class="text-center py-4 text-muted">Cargando...</td></tr>';

    try {
      const res = await API.get(`/api/usuarios?${buildQueryParams()}`);
      renderTabla(res.data.items);
      renderPaginacion(res.data.pagination);
    } catch (err) {
      els.tabla.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${err.message}</td></tr>`;
    }
  }

  function renderTabla(items) {
    if (!items.length) {
      els.tabla.innerHTML =
        '<tr><td colspan="8"><div class="empty-state"><i class="bi bi-people fs-1 d-block mb-2"></i>No se encontraron usuarios</div></td></tr>';
      return;
    }

    els.tabla.innerHTML = items
      .map(
        (u) => `
      <tr>
        <td>${avatarHtml(u.fotoUrl, u.nombreCompleto)}</td>
        <td><span class="fw-medium">${u.documento}</span></td>
        <td>${u.nombreCompleto}</td>
        <td><span class="badge bg-primary-subtle text-primary">${u.rolNombre}</span></td>
        <td>${badgeEstado(u.estado)}</td>
        <td>${u.centroNombre || '—'}</td>
        <td>${u.regionalNombre || '—'}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-primary btn-action btn-editar" data-id="${u.id}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          ${
            u.estado === 'ACTIVO'
              ? `<button class="btn btn-sm btn-outline-danger btn-action btn-desactivar" data-id="${u.id}" title="Desactivar">
                   <i class="bi bi-person-x"></i>
                 </button>`
              : `<button class="btn btn-sm btn-outline-success btn-action btn-reactivar" data-id="${u.id}" title="Reactivar">
                   <i class="bi bi-person-check"></i>
                 </button>`
          }
        </td>
      </tr>`
      )
      .join('');
  }

  function renderPaginacion(p) {
    const { page, totalPages, total, limit } = p;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    els.paginacionInfo.textContent = `Mostrando ${from}-${to} de ${total} usuarios`;

    let html = '';
    html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">&laquo;</a></li>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">&raquo;</a></li>`;

    els.paginacion.innerHTML = html;
  }

  function fillSelect(select, items, valueKey, labelFn, placeholder) {
    select.innerHTML = placeholder
      ? `<option value="">${placeholder}</option>`
      : '';
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = labelFn(item);
      select.appendChild(opt);
    });
  }

  async function loadCatalogos() {
    const [rolesRes, regionalesRes] = await Promise.all([
      API.get('/api/catalogos/roles'),
      API.get('/api/catalogos/regionales'),
    ]);
    state.roles = rolesRes.data;
    state.regionales = regionalesRes.data;

    fillSelect(document.getElementById('filtroRol'), state.roles, 'id', (r) => r.nombre, 'Todos');
    fillSelect(document.getElementById('rolId'), state.roles, 'id', (r) => r.nombre);
    fillSelect(
      document.getElementById('regionalId'),
      state.regionales,
      'id',
      (r) => r.nombre,
      '— Seleccionar —'
    );
  }

  async function loadCentros(regionalId) {
    const select = document.getElementById('centroId');
    const depSelect = document.getElementById('dependenciaId');

    if (!regionalId) {
      select.disabled = true;
      select.innerHTML = '<option value="">— Seleccionar regional —</option>';
      depSelect.disabled = true;
      depSelect.innerHTML = '<option value="">— Seleccionar centro —</option>';
      return;
    }

    const res = await API.get(`/api/catalogos/centros?regionalId=${regionalId}`);
    fillSelect(select, res.data, 'id', (c) => c.nombre, '— Seleccionar —');
    select.disabled = false;
    depSelect.disabled = true;
    depSelect.innerHTML = '<option value="">— Seleccionar centro —</option>';
  }

  async function loadDependencias(centroId) {
    const select = document.getElementById('dependenciaId');
    if (!centroId) {
      select.disabled = true;
      select.innerHTML = '<option value="">— Seleccionar centro —</option>';
      return;
    }
    const res = await API.get(`/api/catalogos/dependencias?centroId=${centroId}`);
    fillSelect(select, res.data, 'id', (d) => d.nombre, '— Seleccionar —');
    select.disabled = false;
  }

  function showFormError(msg) {
    els.formAlert.textContent = msg;
    els.formAlert.classList.remove('d-none');
  }

  function hideFormError() {
    els.formAlert.classList.add('d-none');
  }

  function resetForm() {
    els.formUsuario.reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('fotoPreview').classList.add('d-none');
    document.getElementById('centroId').disabled = true;
    document.getElementById('dependenciaId').disabled = true;
    document.getElementById('password').required = true;
    document.getElementById('labelPassword').textContent = 'Contraseña *';
    document.getElementById('passwordHelp').textContent = 'Mínimo 6 caracteres';
    hideFormError();
    state.editingId = null;
  }

  function openCreateModal() {
    resetForm();
    document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo usuario';
    modal.show();
  }

  async function openEditModal(id) {
    resetForm();
    state.editingId = id;
    document.getElementById('modalUsuarioTitulo').textContent = 'Editar usuario';
    document.getElementById('password').required = false;
    document.getElementById('labelPassword').textContent = 'Contraseña (opcional)';
    document.getElementById('passwordHelp').textContent = 'Dejar vacío para no cambiar';

    try {
      const res = await API.get(`/api/usuarios/${id}`);
      const u = res.data;

      document.getElementById('usuarioId').value = u.id;
      document.getElementById('tipoDocumento').value = u.tipoDocumento;
      document.getElementById('documento').value = u.documento;
      document.getElementById('nombres').value = u.nombres;
      document.getElementById('apellidos').value = u.apellidos;
      document.getElementById('email').value = u.email;
      document.getElementById('telefono').value = u.telefono || '';
      document.getElementById('estado').value = u.estado;
      document.getElementById('rolId').value = u.rolId;

      if (u.regionalId) {
        document.getElementById('regionalId').value = u.regionalId;
        await loadCentros(u.regionalId);
        if (u.centroId) {
          document.getElementById('centroId').value = u.centroId;
          await loadDependencias(u.centroId);
          if (u.dependenciaId) {
            document.getElementById('dependenciaId').value = u.dependenciaId;
          }
        }
      }

      if (u.fotoUrl) {
        const preview = document.getElementById('fotoPreview');
        preview.src = u.fotoUrl;
        preview.classList.remove('d-none');
      }

      modal.show();
    } catch (err) {
      alert(err.message);
    }
  }

  function buildFormData() {
    const fd = new FormData();
    const fields = {
      tipoDocumento: document.getElementById('tipoDocumento').value,
      documento: document.getElementById('documento').value.trim(),
      nombres: document.getElementById('nombres').value.trim(),
      apellidos: document.getElementById('apellidos').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      rolId: document.getElementById('rolId').value,
      estado: document.getElementById('estado').value,
      regionalId: document.getElementById('regionalId').value,
      centroId: document.getElementById('centroId').value,
      dependenciaId: document.getElementById('dependenciaId').value,
    };

    Object.entries(fields).forEach(([k, v) => {
      if (v) fd.append(k, v);
    });

    const password = document.getElementById('password').value;
    if (password) fd.append('password', password);

    const foto = document.getElementById('foto').files[0];
    if (foto) fd.append('foto', foto);

    return fd;
  }

  async function saveUsuario(e) {
    e.preventDefault();
    hideFormError();

    const spinner = document.getElementById('btnGuardarSpinner');
    const btn = document.getElementById('btnGuardar');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
      const fd = buildFormData();
      const id = document.getElementById('usuarioId').value;

      if (id) {
        await API.put(`/api/usuarios/${id}`, fd);
      } else {
        await API.post('/api/usuarios', fd);
      }

      modal.hide();
      await loadUsuarios();
    } catch (err) {
      showFormError(err.message);
    } finally {
      spinner.classList.add('d-none');
      btn.disabled = false;
    }
  }

  async function desactivarUsuario(id) {
    if (!confirm('¿Desactivar este usuario? No se eliminará el registro.')) return;
    try {
      await API.patch(`/api/usuarios/${id}/desactivar`);
      await loadUsuarios();
    } catch (err) {
      alert(err.message);
    }
  }

  async function reactivarUsuario(id) {
    if (!confirm('¿Reactivar este usuario?')) return;
    try {
      await API.patch(`/api/usuarios/${id}/reactivar`);
      await loadUsuarios();
    } catch (err) {
      alert(err.message);
    }
  }

  async function initSession() {
    try {
      const res = await API.get('/api/auth/me');
      const user = res.data;
      els.userName.textContent = user.nombreCompleto;

      if (!['ADMINISTRADOR', 'COORDINADOR'].includes(user.rolNombre)) {
        window.location.href = '/dashboard.html';
      }
    } catch {
      window.location.href = '/login.html';
    }
  }

  function bindEvents() {
    document.getElementById('btnNuevoUsuario').addEventListener('click', openCreateModal);
    document.getElementById('btnLogout').addEventListener('click', async () => {
      await API.post('/api/auth/logout');
      window.location.href = '/login.html';
    });

    els.formFiltros.addEventListener('submit', (e) => {
      e.preventDefault();
      state.page = 1;
      loadUsuarios();
    });

    document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
      els.formFiltros.reset();
      state.page = 1;
      loadUsuarios();
    });

    els.paginacion.addEventListener('click', (e) => {
      e.preventDefault();
      const link = e.target.closest('[data-page]');
      if (!link || link.parentElement.classList.contains('disabled')) return;
      state.page = parseInt(link.dataset.page, 10);
      loadUsuarios();
    });

    els.tabla.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('.btn-editar');
      const btnDes = e.target.closest('.btn-desactivar');
      const btnReact = e.target.closest('.btn-reactivar');
      if (btnEdit) openEditModal(btnEdit.dataset.id);
      if (btnDes) desactivarUsuario(btnDes.dataset.id);
      if (btnReact) reactivarUsuario(btnReact.dataset.id);
    });

    els.formUsuario.addEventListener('submit', saveUsuario);

    document.getElementById('regionalId').addEventListener('change', (e) => {
      loadCentros(e.target.value);
    });

    document.getElementById('centroId').addEventListener('change', (e) => {
      loadDependencias(e.target.value);
    });

    document.getElementById('foto').addEventListener('change', (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById('fotoPreview');
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('d-none');
      }
    });
  }

  async function init() {
    bindEvents();
    await initSession();
    await loadCatalogos();
    await loadUsuarios();
  }

  init();
})();
