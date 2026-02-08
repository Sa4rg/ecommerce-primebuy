import { apiClient } from "../infrastructure/apiClient";

export async function fetchProducts() {
  return apiClient.get("/api/products");
}