import { API_BASE_URL } from "../config";


async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;

  try {
    body = await res.json();
  } catch {
    // Response has no JSON body
  }

  if (!res.ok) {
    const message =
      body?.message || `HTTP error ${res.status}`;
    throw new Error(message);
  }

  if (body && body.success === false) {
    throw new Error(body.message || "Request failed");
  }

  return body?.data;
}


export const apiClient = {
  get(path) {
    return request(path, { method: "GET" });
  },
  post(path, payload) {
    return request(path, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },
  patch(path, payload) {
    return request(path, {
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },
  delete(path) {
    return request(path, { method: "DELETE" });
  },
};
