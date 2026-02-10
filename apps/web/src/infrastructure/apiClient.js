import { API_BASE_URL } from "../config";
import { getAccessToken } from "../features/auth/authStorage";

async function request(path, options = {}) {
  const token = getAccessToken();

  // 1) Partimos de headers del caller (si existen)
  const mergedHeaders = {
    ...(options.headers || {}),
  };

  // 2) Aseguramos JSON por defecto (si el caller no lo puso)
  if (!mergedHeaders["Content-Type"]) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // 3) SOLO ponemos Authorization si el caller no lo mandó
  const hasAuth =
    mergedHeaders.Authorization || mergedHeaders.authorization;

  if (!hasAuth && token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {}

  if (!res.ok) {
    const message = body?.message || `HTTP error ${res.status}`;
    throw new Error(message);
  }

  if (body && body.success === false) {
    throw new Error(body.message || "Request failed");
  }

  return body?.data;
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },
  patch(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },
  delete(path, options = {}) {
    return request(path, { ...options, method: "DELETE" });
  },
};
