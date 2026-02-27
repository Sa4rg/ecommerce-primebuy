// src/features/admin/adminProductsService.js
import { apiClient } from "../../infrastructure/apiClient";

function unwrap(res) {
  // apiClient ya retorna body.data (o sea "data" del backend)
  // pero igual soportamos cuando venga en { data: ... }
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
    // tu backend usa PUT en routes
    const res = await apiClient.put(`/api/products/${id}`, payload);
    return unwrap(res);
  },

  async remove(id) {
    const res = await apiClient.delete(`/api/products/${id}`);
    return unwrap(res);
  },

  async uploadImages({ coverFile, galleryFiles }) {
    const fd = new FormData();
    if (coverFile) fd.append("cover", coverFile);
    for (const f of galleryFiles || []) fd.append("gallery", f);

    // endpoint: /api/uploads/products (según tu código)
    // devuelve: { cover: {url, publicId}, gallery: [{url, publicId}] }
    const res = await apiClient.post("/api/uploads/products", fd);
    return unwrap(res);
  },

  async deleteImageByPublicId(publicId) {
    // tu endpoint actual en el front es "/api/uploads"
    // y envías { publicId } por body (DELETE con body)
    const res = await apiClient.delete("/api/uploads", { publicId });
    return unwrap(res);
  },
};