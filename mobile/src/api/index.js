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

    // React Native 0.80+ uses a new networking layer that only accepts a Blob or File here.
    // The older `{ uri, name, type }` object now fails with "Unsupported FormDataPart
    // implementation", so the picked file is read into a Blob first. The same code path
    // works on web, where the picker already returns a blob URL.
    const raw = await (await fetch(image.uri)).blob();
    // The blob read back from a file:// URI can arrive without a MIME type, and the API
    // rejects anything that is not JPEG, PNG or WEBP, so the type is re-applied here.
    const blob = raw.type ? raw : raw.slice(0, raw.size, type);
    form.append('image', blob, name);
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
