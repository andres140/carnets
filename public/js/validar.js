/**
 * Validación pública de carnés por QR — sin autenticación.
 */
(function () {
  const ESTADO_LABELS = {
    ACTIVO: 'Activo',
    VENCIDO: 'Vencido',
    SUSPENDIDO: 'Suspendido',
    REVOCADO: 'Revocado',
  };

  let scanner = null;
  let scanning = false;

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function extractTokenFromUrl(text) {
    if (!text) return null;
    try {
      if (text.includes('token=')) {
        const url = new URL(text.includes('://') ? text : `http://local${text.startsWith('/') ? '' : '/'}${text}`);
        return url.searchParams.get('token');
      }
      if (text.includes('validar') && text.includes('?')) {
        const qs = text.split('?')[1];
        return new URLSearchParams(qs).get('token');
      }
    } catch {
      /* continuar */
    }
    if (/^[a-f0-9]{32}\.[a-f0-9]{16}$/i.test(text.trim())) return text.trim();
    return null;
  }

  function showLoading() {
    document.getElementById('resultadoPlaceholder').classList.remove('d-none');
    document.getElementById('resultadoCard').classList.add('d-none');
    document.getElementById('resultadoError').classList.add('d-none');
    document.getElementById('resultadoPlaceholder').querySelector('.card-body').innerHTML =
      '<div class="py-5 text-center"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Validando carné…</p></div>';
  }

  function showError(mensaje) {
    document.getElementById('resultadoPlaceholder').classList.add('d-none');
    document.getElementById('resultadoCard').classList.add('d-none');
    document.getElementById('resultadoError').classList.remove('d-none');
    document.getElementById('errorMensaje').textContent = mensaje;
  }

  function showResult(data) {
    document.getElementById('resultadoPlaceholder').classList.add('d-none');
    document.getElementById('resultadoError').classList.add('d-none');
    document.getElementById('resultadoCard').classList.remove('d-none');

    const estado = data.estado || 'invalido';
    const badge = document.getElementById('estadoBadge');
    badge.textContent = ESTADO_LABELS[estado] || estado;
    badge.className = `badge estado-badge fs-6 estado-${estado}`;

    document.getElementById('resultadoMensaje').textContent = data.mensaje || '';
    const c = data.carnet || {};
    document.getElementById('resNombre').textContent = c.nombreCompleto || '—';
    document.getElementById('resTipo').textContent = c.tipoUsuario || '—';
    document.getElementById('resRegional').textContent = c.regionalNombre || '—';
    document.getElementById('resCentro').textContent = c.centroNombre || '—';
    document.getElementById('resExpedicion').textContent = formatDate(c.fechaExpedicion);
    document.getElementById('resVencimiento').textContent = formatDate(c.fechaVencimiento);
    document.getElementById('resCodigo').textContent = c.codigoUnico || '—';

    const foto = document.getElementById('resultadoFoto');
    if (c.fotoUrl) {
      foto.src = c.fotoUrl;
      foto.classList.remove('d-none');
      foto.onerror = () => foto.classList.add('d-none');
    } else {
      foto.classList.add('d-none');
    }
  }

  async function validarToken(token) {
    if (!token) {
      showError('Código de validación no reconocido.');
      return;
    }
    showLoading();
    try {
      const res = await fetch(`/api/validar/${encodeURIComponent(token)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al validar');
      }
      if (!json.data.carnet) {
        showError(json.data.mensaje || 'No se encontró un carné válido.');
        return;
      }
      showResult(json.data);
    } catch (err) {
      showError(err.message || 'No se pudo completar la validación.');
    }
  }

  async function startScanner() {
    if (scanning || typeof Html5Qrcode === 'undefined') return;
    const readerId = 'qrReader';
    scanner = new Html5Qrcode(readerId);
    scanning = true;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          const token = extractTokenFromUrl(decoded);
          if (!token) return;
          await scanner.stop();
          scanning = false;
          await validarToken(token);
        },
        () => {}
      );
    } catch {
      document.getElementById('qrReader').innerHTML =
        '<p class="text-white-50 text-center p-4 small">No se pudo acceder a la cámara. Use la pestaña «Código manual».</p>';
      scanning = false;
    }
  }

  async function stopScanner() {
    if (scanner && scanning) {
      try {
        await scanner.stop();
      } catch {
        /* ignorar */
      }
      scanning = false;
    }
  }

  function initFromQuery() {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) validarToken(token);
  }

  document.getElementById('btnValidarManual').onclick = () => {
    const raw = document.getElementById('tokenManual').value.trim();
    const token = extractTokenFromUrl(raw) || raw;
    validarToken(token);
  };

  document.getElementById('tab-manual').addEventListener('shown.bs.tab', stopScanner);
  document.getElementById('tab-escaner').addEventListener('shown.bs.tab', startScanner);

  initFromQuery();
  startScanner();
})();
