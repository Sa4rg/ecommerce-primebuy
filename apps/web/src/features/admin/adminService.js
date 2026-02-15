// Admin API service for payment management
import { apiClient } from "../../infrastructure/apiClient";

export const adminService = {
  /**
   * List all payments (admin only)
   * @param {Object} filters - { status?: 'pending'|'submitted'|'confirmed'|'rejected' }
   * @returns {Promise<Array>} List of payments
   */
  async listPayments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    
    const query = params.toString();
    const path = query ? `/api/payments?${query}` : "/api/payments";
    return apiClient.get(path);
  },

  /**
   * Confirm a payment (admin only)
   * @param {string} paymentId 
   * @returns {Promise<Object>} Updated payment
   */
  async confirmPayment(paymentId, note) {
    return apiClient.patch(`/api/payments/${paymentId}/confirm`, { note : note || "Confirmed by admin"   });
  },

  /**
   * Reject a payment (admin only)
   * @param {string} paymentId 
   * @param {string} reason 
   * @returns {Promise<Object>} Updated payment
   */
  async rejectPayment(paymentId, reason) {
    return apiClient.patch(`/api/payments/${paymentId}/reject`, { reason });
  },
};
