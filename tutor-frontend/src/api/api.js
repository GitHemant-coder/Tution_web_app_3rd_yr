const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.msg || data.message || `API Error: ${res.status}`);
      error.data = data;
      throw error;
    }
    return data;
  } else {
    // If not JSON, it might be an error page (HTML)
    const text = await res.text();
    if (!res.ok) {
      const error = new Error(`Server error (${res.status}): ${res.statusText}`);
      error.details = text.substring(0, 100);
      throw error;
    }
    return text;
  }
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
