// API wrapper with JWT authentication
const api = {
  baseURL: '/api',

  getToken() {
    return sessionStorage.getItem('auth_token');
  },

  setToken(token) {
    if (token) {
      sessionStorage.setItem('auth_token', token);
    } else {
      sessionStorage.removeItem('auth_token');
    }
  },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(this.baseURL + path, options);

      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        window.location.reload();
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${path}]:`, error);
      showToast('Ошибка: ' + error.message, 'error');
      return null;
    }
  },

  get(path) {
    return this.request('GET', path);
  },

  post(path, body) {
    return this.request('POST', path, body);
  },

  put(path, body) {
    return this.request('PUT', path, body);
  },

  delete(path) {
    return this.request('DELETE', path);
  }
};
