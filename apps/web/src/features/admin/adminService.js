// web/src/features/admin/adminService.js
import { apiClient } from "../../infrastructure/apiClient";

export const adminService = {
  async listPayments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);

    const query = params.toString();
    const path = query ? `/api/payments?${query}` : "/api/payments";
    return apiClient.get(path);
  },

  async confirmPayment(paymentId, note) {
    return apiClient.patch(`/api/payments/${paymentId}/confirm`, {
      note: note || "Confirmed by admin",
    });
  },

  async rejectPayment(paymentId, reason) {
    return apiClient.patch(`/api/payments/${paymentId}/reject`, { reason });
  },

  getPayment(paymentId) {
    return apiClient.get(`/api/payments/${paymentId}`);
  },

  getOrder(orderId) {
    return apiClient.get(`/api/orders/${orderId}`);
  },

  processOrder(orderId) {
    return apiClient.patch(`/api/orders/${orderId}/process`);
  },

  dispatchShipping(orderId, carrier) {
    return apiClient.patch(
      `/api/orders/${orderId}/shipping/dispatch`,
      carrier ? { carrier } : {}
    );
  },

  deliverShipping(orderId) {
    return apiClient.patch(`/api/orders/${orderId}/shipping/deliver`);
  },
};
