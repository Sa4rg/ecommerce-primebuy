// src/features/admin/adminProductsService.js
import { apiClient } from "../../infrastructure/apiClient";

function unwrap(res) {
  // Tu API suele responder { success, message, data }
  // pero a veces apiClient ya devuelve data directo.
  const data = res?.data ?? res;
  return data?.data ?? data;
}

export const adminProductsService = {
  async list() {
    const res = await apiClient.get("/api/products");
    return unwrap(res);
  },

  async create(payload) {
    const res = await apiClient.post("/api/products", payload);
    return unwrap(res);
  },

  async update(id, payload) {
    const res = await apiClient.put(`/api/products/${id}`, payload);
    return unwrap(res);
  },

  async remove(id) {
    const res = await apiClient.delete(`/api/products/${id}`);
    return unwrap(res);
  },
};
