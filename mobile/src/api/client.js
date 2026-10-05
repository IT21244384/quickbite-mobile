// Single place where the app talks to the backend.
// The base URL comes from mobile/.env (EXPO_PUBLIC_API_URL) and must be the HOSTED API.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

// AuthContext registers a callback so an expired token logs the user out
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiRequestError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, isForm = false } = {}) {
  if (!API_URL) {
    throw new ApiRequestError('API URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env', 0);
  }

  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  // For FormData the browser/React Native sets the multipart boundary itself
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    // In development the underlying reason is shown too, so a failed request can be diagnosed
    // on the device. Release builds keep the plain message.
    const detail = __DEV__ && err?.message ? ` [${method} ${API_URL}${path} — ${err.message}]` : '';
    throw new ApiRequestError(`Cannot reach the server. Check your internet connection.${detail}`, 0);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiRequestError(data?.message || `Request failed (${response.status})`, response.status, data?.details);
  }
  return data;
}

// Menu images are served by the API at a relative path, e.g. /api/menu/<id>/image
export function imageUri(relativeUrl) {
  return relativeUrl ? `${API_URL}${relativeUrl}` : null;
}
