/**
 * Cliente HTTP con cookies de sesión y protección CSRF
 */
const API = {
  _csrfToken: null,

  async ensureCsrf() {
    if (this._csrfToken) return this._csrfToken;

    const res = await fetch('/api/auth/csrf-token', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.success || !data.data?.csrfToken) {
      throw new Error(data.error || 'No se pudo obtener token CSRF');
    }

    this._csrfToken = data.data.csrfToken;
    return this._csrfToken;
  },

  async request(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const token = await this.ensureCsrf();
      headers['X-CSRF-Token'] = token;
    }

    const res = await fetch(url, {
      credentials: 'include',
      headers,
      ...options,
    });

    let data = {};
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else if (!res.ok) {
      throw new Error(`Respuesta no válida del servidor (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }

    return data;
  },

  get(url) {
    return this.request(url);
  },

  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch(url, body) {
    return this.request(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async downloadBlob(url, filename) {
    const method = 'GET';
    const headers = { Accept: 'application/pdf,*/*' };
    const res = await fetch(url, { credentials: 'include', headers, method });

    if (!res.ok) {
      let message = `Error ${res.status}`;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data.error || message;
      }
      throw new Error(message);
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'carnet.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return blob;
  },

  async downloadExport(url, filename) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { Accept: '*/*' },
    });

    if (!res.ok) {
      let message = `Error ${res.status}`;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data.error || message;
      }
      throw new Error(message);
    }

    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const name = match?.[1] || filename || 'reporte.csv';
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return blob;
  },
};
