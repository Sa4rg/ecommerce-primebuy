import { apiClient } from "../../infrastructure/apiClient";

export function getMe() {
  return apiClient.get("/api/me");
}