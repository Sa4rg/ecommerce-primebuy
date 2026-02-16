import { apiClient } from "../../infrastructure/apiClient";
import { setAccessToken, clearAccessToken } from "./authStorage";

export async function login({ email, password }) {
  if (!email || !password) throw new Error("email and password are required");

  const data = await apiClient.post("/api/auth/login", { email, password });
  setAccessToken(data.accessToken);
  return data;
}

export async function register({ name, email, password }) {
  if (!email || !password) throw new Error("email and password are required");

  // name es opcional: si backend no lo usa, no pasa nada.
  const payload = {
    email,
    password,
    ...(name?.trim() ? { name: name.trim() } : {}),
  };

  return apiClient.post("/api/auth/register", payload);
}

export async function logout() {
  try {
    // ✅ invalida refresh en backend + clear cookie
    await apiClient.post("/api/auth/logout", {});
  } finally {
    clearAccessToken();
  }
}
