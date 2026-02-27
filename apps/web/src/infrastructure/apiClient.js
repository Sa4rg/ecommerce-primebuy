import { API_BASE_URL } from "../config";
import { getAccessToken, setAccessToken, clearAccessToken } from "../features/auth/authStorage";

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
    .then(async (res) => {
      let body = null;
      try {
        body = await res.json();
      } catch {}

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

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  // ✅ Solo setear Content-Type JSON si NO es FormData
  if (!isFormData && !mergedHeaders["Content-Type"]) {
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
    credentials: "include",
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
    const err = new Error(message);
    // opcional: agrega status por si lo necesitas
    err.status = res.status;
    throw err;
  }

  if (body && body.success === false) {
    throw new Error(body.message || "Request failed");
  }

  // ✅ tu API normalmente responde { success, message, data }
  // aquí devolvemos data (compatible con tu front)
  return body?.data;
}

function buildBody(payload) {
  if (payload === undefined) return undefined;
  if (payload === null) return JSON.stringify({});
  // ✅ si ya es FormData, se manda tal cual
  if (typeof FormData !== "undefined" && payload instanceof FormData) return payload;
  // ✅ si es string, se manda tal cual
  if (typeof payload === "string") return payload;
  // ✅ objetos -> JSON
  return JSON.stringify(payload);
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, { ...options, method: "GET" });
  },

  post(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body: buildBody(payload),
    });
  },

  put(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "PUT",
      body: buildBody(payload),
    });
  },

  patch(path, payload, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body: buildBody(payload),
    });
  },

  // ✅ soporta body en DELETE (muchos endpoints lo usan)
  delete(path, payloadOrOptions = {}, optionsMaybe = undefined) {
    // Permite dos firmas:
    // delete(path)
    // delete(path, options)
    // delete(path, payload, options)
    let payload = undefined;
    let options = {};

    if (optionsMaybe !== undefined) {
      payload = payloadOrOptions;
      options = optionsMaybe || {};
    } else {
      // si parece options (tiene headers/method/etc), lo tratamos como options
      const looksLikeOptions =
        payloadOrOptions &&
        typeof payloadOrOptions === "object" &&
        ("headers" in payloadOrOptions || "credentials" in payloadOrOptions);

      if (looksLikeOptions) {
        options = payloadOrOptions;
      } else {
        payload = payloadOrOptions;
        options = {};
      }
    }

    return request(path, {
      ...options,
      method: "DELETE",
      body: buildBody(payload),
    });
  },
};