import { apiClient } from "../../infrastructure/apiClient";

export const orderService = {
  createOrder({ paymentId }) {
    return apiClient.post("/api/orders", { paymentId });
  },

  getOrder(orderId) {
    return apiClient.get(`/api/orders/${orderId}`);
  },
};
