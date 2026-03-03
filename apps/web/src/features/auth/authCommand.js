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
  return apiClient.post("/api/auth/logout", {});
}

export async function requestPasswordReset({ email }) {
  if (!email) throw new Error("email is required");
  return apiClient.post("/api/auth/password-reset/request", { email });
}

export async function resetPassword({ email, code, newPassword }) {
  if (!email || !code || !newPassword) throw new Error("email, code and newPassword are required");
  return apiClient.post("/api/auth/password-reset/confirm", { email, code, newPassword });
}

export async function verifyEmail({ email, code }) {
  if (!email || !code) throw new Error("email and code are required");
  return apiClient.post("/api/auth/verify-email", { email, code });
}

export async function resendVerification({ email }) {
  if (!email) throw new Error("email is required");
  return apiClient.post("/api/auth/resend-verification", { email });
}