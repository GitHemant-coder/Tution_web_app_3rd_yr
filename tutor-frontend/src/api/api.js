const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function handleResponse(res) {
  // 204 No Content (typical for DELETE) or 205 Reset Content — no body to parse
  if (res.status === 204 || res.status === 205) {
    if (!res.ok) {
      const error = new Error(`Request failed with status ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return null;   // success, no body
  }

  // Read the raw text ONCE (we can't call .json() and .text() both)
  const raw = await res.text();

  // Try to parse as JSON if it looks like JSON
  let data;
  const contentType = res.headers.get("content-type") || "";
  const looksLikeJSON = contentType.includes("application/json") ||
                        raw.trim().startsWith("{") ||
                        raw.trim().startsWith("[");

  if (raw && looksLikeJSON) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;   // fallback: keep raw text
    }
  } else {
    data = raw;     // plain text or empty
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.msg || data.message)) ||
      (typeof data === "string" && data.slice(0, 120)) ||
      `API Error: ${res.status}`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function post(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function get(path, auth = false) {
  const headers = {};
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  return handleResponse(res);
}

export async function put(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function patch(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function remove(path, auth = false) {
  const headers = {};
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(res);
}