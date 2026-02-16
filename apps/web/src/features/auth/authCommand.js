// src/features/auth/authCommand.js
import { apiClient } from "../../infrastructure/apiClient";

export async function login({ email, password }) {
  if (!email || !password) throw new Error("email and password are required");
  return apiClient.post("/api/auth/login", { email, password });
}

export async function register({ name, email, password }) {
  if (!email || !password) throw new Error("email and password are required");

  const payload = {
    email,
    password,
    ...(name?.trim() ? { name: name.trim() } : {}),
  };

  return apiClient.post("/api/auth/register", payload);
}

export async function logout() {
  // invalida refresh en backend + clear cookie
  return apiClient.post("/api/auth/logout", {});
}
