import { Platform } from 'react-native';
import { request } from './client';

// ---------- auth ----------
export const authApi = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: data }),
  me: () => request('/api/auth/me'),
};

// ---------- menu (primary entity) ----------

// Builds multipart/form-data so the text fields and the image travel together
async function toMenuForm(fields, image) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });

  if (image) {
    const name = image.fileName || `menu-${Date.now()}.jpg`;
    const type = image.mimeType || 'image/jpeg';
    if (Platform.OS === 'web') {
      // In a browser the picked image is a blob URL, so turn it into a Blob
      const blob = await (await fetch(image.uri)).blob();
      form.append('image', blob, name);
    } else {
      form.append('image', { uri: image.uri, name, type });
    }
  }
  return form;
}

export const menuApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/api/menu${query ? `?${query}` : ''}`);
  },
  categories: () => request('/api/menu/categories'),
  get: (id) => request(`/api/menu/${id}`),
  create: async (fields, image) =>
    request('/api/menu', { method: 'POST', body: await toMenuForm(fields, image), isForm: true }),
  update: async (id, fields, image) =>
    request(`/api/menu/${id}`, { method: 'PUT', body: await toMenuForm(fields, image), isForm: true }),
  remove: (id) => request(`/api/menu/${id}`, { method: 'DELETE' }),
};

// ---------- orders (related entity) ----------
export const orderApi = {
  list: (status) => request(`/api/orders${status ? `?status=${status}` : ''}`),
  get: (id) => request(`/api/orders/${id}`),
  create: (data) => request('/api/orders', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/orders/${id}`, { method: 'PUT', body: data }),
  setStatus: (id, status) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  cancel: (id) => request(`/api/orders/${id}/cancel`, { method: 'PATCH' }),
  remove: (id) => request(`/api/orders/${id}`, { method: 'DELETE' }),
};
