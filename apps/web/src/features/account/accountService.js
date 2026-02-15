import { apiClient } from "../../infrastructure/apiClient";

export const accountService = {
  getMyPayments() {
    return apiClient.get("/api/me/payments");
  },
  getMyOrders() {
    return apiClient.get("/api/me/orders");
  },
};
