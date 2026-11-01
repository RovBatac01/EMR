import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const rawClient = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

let csrfPromise = null;
export async function ensureCsrf() {
  const existing = readCookie('XSRF-TOKEN');
  if (existing) return decodeURIComponent(existing);
  if (!csrfPromise) {
    csrfPromise = rawClient.get('/auth/csrf').then((response) => response.data?.data?.token).finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
}

api.interceptors.request.use(async (config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') config.headers.delete('Content-Type');
    else if (config.headers) delete config.headers['Content-Type'];
  }
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = await ensureCsrf();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = new Error(error.response?.data?.message || error.message || 'The request could not be completed.');
    normalized.status = error.response?.status;
    normalized.details = error.response?.data?.details;
    normalized.response = error.response;
    return Promise.reject(normalized);
  }
);

export const apiOrigin = (() => {
  try { return new URL(baseURL, window.location.origin).origin; } catch { return window.location.origin; }
})();
