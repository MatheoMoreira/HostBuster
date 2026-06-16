// Client HTTP minimal pour l'API HostBuster.
// L'URL de base peut être surchargée via VITE_API_URL dans front/.env

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'hb_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Appel générique à l'API.
 * @throws {Error} avec `.status` et `.errors` (erreurs de validation Laravel)
 */
export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Erreur réseau');
    error.status = res.status;
    error.errors = data.errors || null;
    throw error;
  }

  return data;
}
