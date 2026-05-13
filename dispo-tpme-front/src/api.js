// services/api.js
import axios from 'axios';

export const AUTH_CHANGED_EVENT = 'auth:changed';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshRequest = null;

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function persistSession(data) {
  localStorage.setItem('token', data.accessToken);
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  localStorage.removeItem('tpme_token');
  notifyAuthChanged();
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('tpme_token');
  localStorage.removeItem('user');
  notifyAuthChanged();
}

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh once on 401, then fall back to login
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const originalRequest = err.config || {};
      const requestUrl = originalRequest.url || '';
      const isAuthEntryPoint =
        requestUrl.includes('/auth/admin/login') ||
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register');
      const isRefreshRequest = requestUrl.includes('/auth/refresh');

      if (isAuthEntryPoint) {
        return Promise.reject(err);
      }

      if (!isRefreshRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (!refreshRequest) {
            refreshRequest = api.post('/auth/refresh');
          }
          const refreshResponse = await refreshRequest;
          persistSession(refreshResponse.data);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearSession();
          window.location.href = window.location.pathname.startsWith('/admin')
            ? '/admin/login'
            : '/visitorlogin';
          return Promise.reject(refreshError);
        } finally {
          refreshRequest = null;
        }
      }

      clearSession();
      window.location.href = window.location.pathname.startsWith('/admin')
        ? '/admin/login'
        : '/visitorlogin';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  login: (email, motDePasse) => api.post('/auth/login', { email, password: motDePasse }),
  adminLogin: (email, password) => api.post('/auth/admin/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Demandes ─────────────────────────────────────────────────
export const demandeService = {
  simuler: (payload) => api.post('/demandes/simuler', payload),
  creer: (data) => api.post('/demandes', data),
  soumettre: (id) => api.put(`/demandes/${id}/soumettre`),
  mesDemandes: () => api.get('/demandes/mes-demandes'),
  getById: (id) => api.get(`/demandes/${id}`),
  uploadDoc: (id, type, file) => {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    return api.post(`/demandes/${id}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── CRI ───────────────────────────────────────────────────────
export const criService = {
  getAll: () => api.get('/cri'),
};

// ── Chatbot ───────────────────────────────────────────────────
const chatApi = axios.create({
  baseURL: process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
});

export const chatService = {
  send: (message) => chatApi.post('/chat', { message }).then((r) => r.data),
  health: () => chatApi.get('/chat/health').then((r) => r.data),
};

// ── OAuth2 ────────────────────────────────────────────────────
export const OAUTH_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
