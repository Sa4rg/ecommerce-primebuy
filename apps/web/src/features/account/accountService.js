import { apiClient } from "../../infrastructure/apiClient";

export const accountService = {
  getMyPayments() {
    return apiClient.get("/api/me/payments");
  },
  getMyOrders() {
    return apiClient.get("/api/me/orders");
  },
  /**
   * Get last shipping address from user's most recent order (if any).
   * Returns { method, recipientName, phone, state, city, line1, reference, fromOrderId, createdAt } or null.
   */
  getLastShippingAddress() {
    return apiClient.get("/api/me/last-shipping-address");
  },
};
