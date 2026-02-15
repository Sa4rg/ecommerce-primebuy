import { API_BASE_URL } from "../config";
import { getAccessToken, setAccessToken, clearAccessToken } from "../features/auth/authStorage";

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include", // ✅ manda la cookie httpOnly
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // por consistencia
  })
    .then(async (res) => {
      let body = null;
      try { body = await res.json(); } catch {}

      if (!res.ok || body?.success === false) {
        const msg = body?.message || `Refresh failed (${res.status})`;
        throw new Error(msg);
      }

      const newToken = body?.data?.accessToken;
      if (!newToken) throw new Error("Refresh did not return accessToken");

      setAccessToken(newToken);
      return newToken;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();

  const mergedHeaders = {
    ...(options.headers || {}),
  };

  // JSON por defecto
  if (!mergedHeaders["Content-Type"]) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // Authorization si no viene ya
  const hasAuth = mergedHeaders.Authorization || mergedHeaders.authorization;
  if (!hasAuth && token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
    credentials: "include", // ✅ SIEMPRE include (para refresh cookie + futuro)
  });

  let body = null;
  try {
    body = await res.json();
  } catch {}

  // ✅ si 401, intenta refresh 1 vez y reintenta
  if (res.status === 401 && retry) {
    try {
      await refreshAccessToken();
      return request(path, options, false);
    } catch (e) {
      clearAccessToken();
      throw e;
    }
  }

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
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    });
  },
  patch(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    });
  },
  delete(path, options = {}) {
    return request(path, { ...options, method: "DELETE" });
  },
};
