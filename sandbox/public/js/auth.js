/** Shared auth for the Vercel sandbox. Production will use Laravel session auth in apps/portal. */
const AFEAuth = {
  TOKEN_KEY: 'afe_auth',

  getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  },

  clear() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem('afe_authed');
  },

  setToken(user, pass) {
    const token = 'Basic ' + btoa(`${user}:${pass}`);
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem('afe_authed', '1');
    return token;
  },

  headers() {
    const headers = { Accept: 'application/json' };
    const token = this.getToken();
    if (token) headers.Authorization = token;
    return headers;
  },

  async check() {
    const token = this.getToken();
    if (!token) {
      this.clear();
      return false;
    }
    try {
      const res = await fetch('/api/auth-check', { headers: this.headers() });
      if (!res.ok) {
        this.clear();
        return false;
      }
      return true;
    } catch {
      this.clear();
      return false;
    }
  },

  async initLoginPage() {
    if (await this.check()) {
      location.replace('/app');
      return;
    }
    document.documentElement.classList.remove('auth-checking');
  },

  async initAppPage() {
    if (!(await this.check())) {
      location.replace('/');
      return;
    }
    document.documentElement.classList.remove('auth-checking');
    if (typeof window.onAuthReady === 'function') {
      window.onAuthReady();
    }
  },

  signOut() {
    this.clear();
    location.replace('/');
  },

  apiFetch(url, opts = {}) {
    return fetch(url, {
      ...opts,
      credentials: 'same-origin',
      headers: { ...this.headers(), ...(opts.headers || {}) },
    });
  },
};
