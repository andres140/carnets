/**
 * Cliente HTTP con cookies de sesión
 */
const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.headers || {}),
      },
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
};
