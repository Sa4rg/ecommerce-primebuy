import { apiClient } from "../../infrastructure/apiClient";

export const paymentService = {
  createPayment({ checkoutId, method }) {
    return apiClient.post("/api/payments", { checkoutId, method });
  },

  getPayment(paymentId) {
    return apiClient.get(`/api/payments/${paymentId}`);
  },

  submitPayment({ paymentId, reference }) {
    return apiClient.patch(`/api/payments/${paymentId}/submit`, { reference });
  },
};
