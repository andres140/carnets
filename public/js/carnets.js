/**
 * Módulo de gestión de carnés institucionales
 */
(function () {
  const state = {
    page: 1,
    limit: 10,
    previewData: null,
    selectedCarnetId: null,
    pendingAction: null,
    currentUser: null,
    searchTimer: null,
  };

  const modalEmitir = new bootstrap.Modal(document.getElementById('modalEmitir'));
  const modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
  const modalMotivo = new bootstrap.Modal(document.getElementById('modalMotivo'));

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const id = `toast-${Date.now()}`;
    const bg = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    container.insertAdjacentHTML(
      'beforeend',
      `<div id="${id}" class="toast align-items-center ${bg} border-0"><div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div></div>`
    );
    const el = document.getElementById(id);
    const t = new bootstrap.Toast(el, { delay: 4000 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  function badgeEstado(estado) {
    const map = {
      ACTIVO: 'badge-estado-activo',
      VENCIDO: 'badge-estado-vencido',
      SUSPENDIDO: 'badge-estado-suspendido',
      REVOCADO: 'badge-estado-revocado',
    };
    const labels = { ACTIVO: 'Activo', VENCIDO: 'Vencido', SUSPENDIDO: 'Suspendido', REVOCADO: 'Revocado' };
    return `<span class="badge ${map[estado] || 'bg-secondary'}">${labels[estado] || estado}</span>`;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO');
  }

  function defaultVencimiento() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }

  function renderCarnetTemplate(data, qrDataUrl) {
    const foto = data.fotoUrl
      ? `<img src="${data.fotoUrl}" alt="Foto" class="carnet-photo" onerror="this.outerHTML='<div class=\\'carnet-photo-placeholder\\'>Sin foto</div>'">`
      : '<div class="carnet-photo-placeholder">Sin foto</div>';

    const qrBlock = qrDataUrl
      ? `<img src="${qrDataUrl}" alt="QR validación" class="carnet-qr-image">`
      : '<div class="carnet-qr-placeholder">QR<br><small>Al emitir</small></div>';

    return `<div class="carnet-card-template">
      <div class="carnet-card-header">
        <div class="carnet-logo-placeholder">LOGO<br>SENA</div>
        <div>
          <div class="small fw-bold">Servicio Nacional de Aprendizaje</div>
          <div style="font-size:11px;opacity:.9">Carné institucional</div>
        </div>
      </div>
      <div class="carnet-card-body">
        ${foto}
        <div>
          <p class="carnet-field-label">Nombre completo</p>
          <p class="carnet-field-value">${data.nombreCompleto || '—'}</p>
          <p class="carnet-field-label">Documento</p>
          <p class="carnet-field-value">${data.tipoDocumento || ''} ${data.documento || '—'}</p>
          <p class="carnet-field-label">Tipo</p>
          <p class="carnet-field-value">${data.tipoUsuario || '—'}</p>
          <p class="carnet-field-label">Centro / Regional</p>
          <p class="carnet-field-value" style="font-size:11px">${data.centroNombre || '—'}<br>${data.regionalNombre || '—'}</p>
        </div>
      </div>
      <div class="carnet-footer">
        <div>
          <p class="carnet-field-label mb-0">Código</p>
          <p class="carnet-code mb-0">${data.codigoUnico || data.codigoUnicoPreview || '—'}</p>
          <p class="carnet-field-label mt-1 mb-0">Vence</p>
          <p class="small mb-0 fw-semibold">${formatDate(data.fechaVencimiento)}</p>
        </div>
        <div class="carnet-qr-wrap">${qrBlock}</div>
        <div class="carnet-sign-placeholder">Firma<br>autorizada</div>
      </div>
    </div>`;
  }

  function buildQuery() {
    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);
    const search = document.getElementById('filtroSearch').value.trim();
    const estado = document.getElementById('filtroEstado').value;
    if (search) params.set('search', search);
    if (estado) params.set('estado', estado);
    return params.toString();
  }

  async function loadCarnets() {
    const tbody = document.getElementById('tablaCarnets');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Cargando...</td></tr>';
    try {
      const res = await API.get(`/api/carnets?${buildQuery()}`);
      const items = res.data.items;
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No hay carnés</td></tr>';
      } else {
        tbody.innerHTML = items
          .map(
            (c) => `<tr>
            <td><code class="carnet-code">${c.codigoUnico}</code></td>
            <td>${c.nombreCompleto}</td>
            <td>${c.documento}</td>
            <td><span class="badge bg-primary-subtle text-primary">${c.tipoUsuario}</span></td>
            <td>${badgeEstado(c.estadoResuelto || c.estado)}</td>
            <td>${formatDate(c.fechaExpedicion)}</td>
            <td>${formatDate(c.fechaVencimiento)}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-primary btn-ver" data-id="${c.id}" title="Ver"><i class="bi bi-eye"></i></button>
            </td></tr>`
          )
          .join('');
      }
      renderPaginacion(res.data.pagination);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">${err.message}</td></tr>`;
    }
  }

  function renderPaginacion(p) {
    const { page, totalPages, total, limit } = p;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    document.getElementById('paginacionInfo').textContent = `Mostrando ${from}-${to} de ${total}`;
    let html = `<li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">&laquo;</a></li>`;
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">&raquo;</a></li>`;
    const ul = document.getElementById('paginacion');
    ul.innerHTML = html;
    ul.onclick = (e) => {
      e.preventDefault();
      const link = e.target.closest('[data-page]');
      if (!link || link.parentElement.classList.contains('disabled')) return;
      state.page = parseInt(link.dataset.page, 10);
      loadCarnets();
    };
  }

  function resetEmitirModal() {
    document.getElementById('buscarUsuario').value = '';
    document.getElementById('usuarioSeleccionadoId').value = '';
    document.getElementById('fechaVencimiento').value = defaultVencimiento();
    document.getElementById('listaUsuarios').classList.add('d-none');
    document.getElementById('previewEmitir').classList.add('d-none');
    document.getElementById('emitirAlert').classList.add('d-none');
    document.getElementById('btnVerPreview').disabled = true;
    document.getElementById('btnConfirmarEmitir').disabled = true;
    state.previewData = null;
  }

  async function buscarUsuarios(term) {
    const list = document.getElementById('listaUsuarios');
    if (!term || term.length < 2) {
      list.classList.add('d-none');
      return;
    }
    try {
      const res = await API.get(
        `/api/usuarios?limit=8&estado=ACTIVO&search=${encodeURIComponent(term)}`
      );
      const items = res.data.items;
      if (!items.length) {
        list.innerHTML = '<div class="list-group-item text-muted">Sin resultados</div>';
      } else {
        list.innerHTML = items
          .map(
            (u) => `<button type="button" class="list-group-item list-group-item-action btn-select-user" data-id="${u.id}" data-label="${u.nombreCompleto} — ${u.documento}">
              <strong>${u.nombreCompleto}</strong><br><small class="text-muted">${u.documento} · ${u.tipoUsuario}</small>
            </button>`
          )
          .join('');
      }
      list.classList.remove('d-none');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function cargarPreview() {
    const usuarioId = document.getElementById('usuarioSeleccionadoId').value;
    const fechaVencimiento = document.getElementById('fechaVencimiento').value;
    const alert = document.getElementById('emitirAlert');
    alert.classList.add('d-none');

    if (!usuarioId) return;

    try {
      const res = await API.get(
        `/api/carnets/preview?usuarioId=${usuarioId}&fechaVencimiento=${fechaVencimiento}`
      );
      state.previewData = res.data;
      if (state.previewData.tieneCarnetActivo) {
        alert.textContent = 'Este usuario ya tiene un carné activo. No se puede emitir otro.';
        alert.classList.remove('d-none');
        document.getElementById('btnConfirmarEmitir').disabled = true;
      } else {
        document.getElementById('btnConfirmarEmitir').disabled = false;
      }
      const preview = document.getElementById('previewEmitir');
      preview.innerHTML = renderCarnetTemplate(state.previewData);
      preview.classList.remove('d-none');
    } catch (err) {
      alert.textContent = err.message;
      alert.classList.remove('d-none');
      document.getElementById('btnConfirmarEmitir').disabled = true;
    }
  }

  async function emitirCarnet() {
    if (!state.previewData || state.previewData.tieneCarnetActivo) return;
    const spinner = document.getElementById('emitirSpinner');
    spinner.classList.remove('d-none');
    document.getElementById('btnConfirmarEmitir').disabled = true;
    try {
      const res = await API.post('/api/carnets', {
        usuarioId: state.previewData.usuarioId,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
      });
      modalEmitir.hide();
      showToast(res.message || 'Carné emitido');
      await loadCarnets();
    } catch (err) {
      showToast(err.message, 'error');
      document.getElementById('btnConfirmarEmitir').disabled = false;
    } finally {
      spinner.classList.add('d-none');
    }
  }

  function docAccionLabel(accion) {
    const map = {
      GENERAR: 'Generación PDF',
      DESCARGAR: 'Descarga',
      IMPRIMIR: 'Impresión',
      REIMPRIMIR: 'Reimpresión',
    };
    return map[accion] || accion;
  }

  async function descargarPdf(id, codigo) {
    try {
      const safeName = (codigo || id).replace(/[^a-zA-Z0-9-]/g, '_');
      await API.downloadBlob(`/api/carnets/${id}/documento/pdf`, `carnet-${safeName}.pdf`);
      showToast('PDF descargado');
      if (state.selectedCarnetId === id) await verDetalle(id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function reimprimirPdf(id, codigo) {
    try {
      await API.ensureCsrf();
      const safeName = (codigo || id).replace(/[^a-zA-Z0-9-]/g, '_');
      const res = await fetch(`/api/carnets/${id}/documento/reimprimir`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/pdf',
          'X-CSRF-Token': API._csrfToken,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `carnet-${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      showToast('Reimpresión registrada');
      if (state.selectedCarnetId === id) await verDetalle(id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function abrirVistaImpresion(id) {
    window.open(`/pages/carnets-imprimir.html?id=${encodeURIComponent(id)}`, '_blank', 'noopener');
  }

  async function verDetalle(id) {
    state.selectedCarnetId = id;
    try {
      const [carnetRes, histRes, docHistRes] = await Promise.all([
        API.get(`/api/carnets/${id}`),
        API.get(`/api/carnets/${id}/historial`),
        API.get(`/api/carnets/${id}/documento/historial`).catch(() => ({ data: null })),
      ]);
      const c = carnetRes.data;
      let qrDataUrl = null;
      try {
        const qrRes = await API.get(`/api/carnets/${id}/qr`);
        qrDataUrl = qrRes.data?.dataUrl;
      } catch {
        /* carné sin QR aún */
      }
      document.getElementById('previewDetalle').innerHTML = renderCarnetTemplate(c, qrDataUrl);
      document.getElementById('detalleInfo').innerHTML = `
        <p><strong>Código:</strong> <code>${c.codigoUnico}</code></p>
        <p><strong>Estado:</strong> ${badgeEstado(c.estadoResuelto || c.estado)}</p>
        <p><strong>Dependencia:</strong> ${c.dependenciaNombre || '—'}</p>
        <p><strong>Emitido por:</strong> ${c.emitidoPorNombre || '—'}</p>
        <p><strong>Expedición:</strong> ${formatDate(c.fechaExpedicion)}</p>
        <p><strong>Vencimiento:</strong> ${formatDate(c.fechaVencimiento)}</p>`;

      document.getElementById('detalleHistorial').innerHTML = histRes.data.length
        ? `<ul class="list-unstyled mb-0">${histRes.data
            .map(
              (h) => `<li class="mb-2 border-bottom pb-2">
              <span class="fw-medium">${h.estadoAnterior || '—'} → ${h.estadoNuevo}</span><br>
              <span class="text-muted">${formatDate(h.createdAt)} · ${h.usuarioNombre}</span>
              ${h.motivo ? `<br><em>${h.motivo}</em>` : ''}
            </li>`
            )
            .join('')}</ul>`
        : '<p class="text-muted">Sin historial</p>';

      const docData = docHistRes.data;
      if (docData) {
        const r = docData.resumen || {};
        document.getElementById('detalleDocumento').innerHTML = `
          <p class="mb-1"><strong>Plantilla:</strong> ${docData.templateId || 'default'}</p>
          <p class="mb-1"><strong>Última generación:</strong> ${formatDate(r.fechaGeneracion || c.pdfGeneradoAt)}</p>
          <p class="mb-1"><strong>Última descarga:</strong> ${formatDate(r.fechaDescarga)}</p>
          <p class="mb-1"><strong>Última impresión:</strong> ${formatDate(r.fechaImpresion)}</p>
          <p class="mb-0"><strong>Reimpresiones:</strong> ${docData.reimpresionesCount ?? r.reimpresiones ?? 0}</p>`;
        document.getElementById('detalleDocHistorial').innerHTML = docData.items?.length
          ? `<ul class="list-unstyled mb-0">${docData.items
              .slice(0, 8)
              .map(
                (h) => `<li class="mb-1">${docAccionLabel(h.accion)} · ${formatDate(h.createdAt)} · ${h.usuarioNombre}</li>`
              )
              .join('')}</ul>`
          : '<p class="text-muted mb-0">Sin movimientos de documento</p>';
      } else {
        document.getElementById('detalleDocumento').textContent = 'No disponible';
        document.getElementById('detalleDocHistorial').innerHTML = '';
      }

      renderAccionesDetalle(c);
      modalDetalle.show();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderAccionesDetalle(c) {
    const estado = c.estadoResuelto || c.estado;
    const perms = state.currentUser?.permisos || [];
    const can = (p) => perms.includes(p);
    const parts = ['<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>'];

    if (can('carnets.ver') || can('carnets.generar')) {
      parts.push(
        `<button type="button" class="btn btn-primary btn-descargar-pdf" data-id="${c.id}" data-codigo="${c.codigoUnico}">
          <i class="bi bi-file-earmark-pdf"></i> Descargar PDF</button>`
      );
      parts.push(
        `<button type="button" class="btn btn-outline-primary btn-vista-impresion" data-id="${c.id}">
          <i class="bi bi-printer"></i> Vista impresión</button>`
      );
      if (can('carnets.generar')) {
        parts.push(
          `<button type="button" class="btn btn-outline-secondary btn-reimprimir-pdf" data-id="${c.id}" data-codigo="${c.codigoUnico}">
            <i class="bi bi-arrow-repeat"></i> Reimprimir</button>`
        );
        parts.push(
          `<a class="btn btn-outline-info" href="/validar.html?token=${encodeURIComponent(c.qrToken || '')}" target="_blank" rel="noopener">
            <i class="bi bi-qr-code"></i> Probar validación</a>`
        );
      }
    }

    if (can('carnets.generar')) {
      parts.push(
        `<button class="btn btn-outline-primary btn-sync" data-id="${c.id}"><i class="bi bi-arrow-repeat"></i> Sincronizar foto</button>`
      );
      if (estado === 'VENCIDO' || estado === 'ACTIVO') {
        parts.push(`<button class="btn btn-outline-success btn-renovar" data-id="${c.id}">Renovar</button>`);
      }
      if (estado === 'SUSPENDIDO') {
        parts.push(`<button class="btn btn-outline-success btn-reactivar" data-id="${c.id}">Reactivar</button>`);
      }
    }
    if (can('carnets.suspender') && estado === 'ACTIVO') {
      parts.push(`<button class="btn btn-outline-warning btn-suspender" data-id="${c.id}">Suspender</button>`);
    }
    if (can('carnets.revocar') && estado !== 'REVOCADO') {
      parts.push(`<button class="btn btn-outline-danger btn-revocar" data-id="${c.id}">Revocar</button>`);
    }
    document.getElementById('detalleAcciones').innerHTML = parts.join(' ');
  }

  function openMotivoModal(action, titulo) {
    state.pendingAction = action;
    document.getElementById('modalMotivoTitulo').textContent = titulo;
    document.getElementById('motivoTexto').value = '';
    document.getElementById('wrapSyncFoto').classList.toggle('d-none', action !== 'renovar');
    document.getElementById('renovarFecha').classList.toggle('d-none', action !== 'renovar');
    if (action === 'renovar') {
      document.getElementById('renovarFecha').value = defaultVencimiento();
    }
    modalMotivo.show();
  }

  async function ejecutarAccion() {
    const id = state.selectedCarnetId;
    const motivo = document.getElementById('motivoTexto').value.trim();
    const action = state.pendingAction;

    try {
      let res;
      if (action === 'suspender') {
        res = await API.patch(`/api/carnets/${id}/suspender`, { motivo });
      } else if (action === 'revocar') {
        if (!motivo) throw new Error('El motivo es obligatorio');
        res = await API.patch(`/api/carnets/${id}/revocar`, { motivo });
      } else if (action === 'reactivar') {
        res = await API.patch(`/api/carnets/${id}/reactivar`, { motivo });
      } else if (action === 'renovar') {
        res = await API.patch(`/api/carnets/${id}/renovar`, {
          motivo,
          fechaVencimiento: document.getElementById('renovarFecha').value,
          sincronizarUsuario: document.getElementById('syncFotoCheck').checked,
        });
      }
      modalMotivo.hide();
      modalDetalle.hide();
      showToast(res?.message || 'Acción completada');
      await loadCarnets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function sincronizarFoto(id) {
    try {
      const res = await API.put(`/api/carnets/${id}`, { sincronizarUsuario: true });
      showToast(res.message || 'Datos sincronizados');
      await verDetalle(id);
      await loadCarnets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function initSession() {
    const res = await API.get('/api/auth/me');
    state.currentUser = res.data;
    document.getElementById('userName').textContent = res.data.nombreCompleto;
    const can = (res.data.permisos || []).some((p) =>
      ['carnets.ver', 'carnets.generar'].includes(p)
    );
    if (!can) window.location.href = '/dashboard.html';
    if (!(res.data.permisos || []).includes('carnets.generar')) {
      document.getElementById('btnEmitirCarnet').classList.add('d-none');
    }
  }

  function bindEvents() {
    document.getElementById('btnLogout').onclick = async () => {
      await API.post('/api/auth/logout');
      window.location.href = '/login.html';
    };
    document.getElementById('formFiltros').onsubmit = (e) => {
      e.preventDefault();
      state.page = 1;
      loadCarnets();
    };
    document.getElementById('btnEmitirCarnet').onclick = () => {
      resetEmitirModal();
      modalEmitir.show();
    };
    document.getElementById('buscarUsuario').oninput = (e) => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => buscarUsuarios(e.target.value.trim()), 300);
    };
    document.getElementById('listaUsuarios').onclick = (e) => {
      const btn = e.target.closest('.btn-select-user');
      if (!btn) return;
      document.getElementById('usuarioSeleccionadoId').value = btn.dataset.id;
      document.getElementById('buscarUsuario').value = btn.dataset.label;
      document.getElementById('listaUsuarios').classList.add('d-none');
      document.getElementById('btnVerPreview').disabled = false;
      cargarPreview();
    };
    document.getElementById('fechaVencimiento').onchange = () => {
      if (document.getElementById('usuarioSeleccionadoId').value) cargarPreview();
    };
    document.getElementById('btnVerPreview').onclick = cargarPreview;
    document.getElementById('btnConfirmarEmitir').onclick = emitirCarnet;
    document.getElementById('tablaCarnets').onclick = (e) => {
      const btn = e.target.closest('.btn-ver');
      if (btn) verDetalle(btn.dataset.id);
    };
    document.getElementById('detalleAcciones').onclick = (e) => {
      const id = state.selectedCarnetId;
      const btnPdf = e.target.closest('.btn-descargar-pdf');
      if (btnPdf) descargarPdf(btnPdf.dataset.id, btnPdf.dataset.codigo);
      const btnPrint = e.target.closest('.btn-vista-impresion');
      if (btnPrint) abrirVistaImpresion(btnPrint.dataset.id);
      const btnReprint = e.target.closest('.btn-reimprimir-pdf');
      if (btnReprint) reimprimirPdf(btnReprint.dataset.id, btnReprint.dataset.codigo);
      if (e.target.closest('.btn-sync')) sincronizarFoto(id);
      if (e.target.closest('.btn-suspender')) openMotivoModal('suspender', 'Suspender carné');
      if (e.target.closest('.btn-revocar')) openMotivoModal('revocar', 'Revocar carné');
      if (e.target.closest('.btn-reactivar')) openMotivoModal('reactivar', 'Reactivar carné');
      if (e.target.closest('.btn-renovar')) openMotivoModal('renovar', 'Renovar carné');
    };
    document.getElementById('btnConfirmarMotivo').onclick = ejecutarAccion;
  }

  async function init() {
    bindEvents();
    await initSession();
    await loadCarnets();
  }

  init();
})();
