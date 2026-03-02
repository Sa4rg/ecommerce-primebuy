import { apiClient } from "../../infrastructure/apiClient";

export const paymentService = {
  createPayment({ checkoutId, method }) {
    return apiClient.post("/api/payments", { checkoutId, method });
  },

  getPayment(paymentId) {
    return apiClient.get(`/api/payments/${paymentId}`);
  },

  submitPayment({ paymentId, reference, proofUrl }) {
    return apiClient.patch(`/api/payments/${paymentId}/submit`, { reference, proofUrl });
  },

  /**
   * Sube un comprobante de pago (imagen) a Cloudinary
   * @param {File} file - El archivo a subir
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async uploadProof(file) {
    const formData = new FormData();
    formData.append("proof", file);

    // ⚠️ NO establecer Content-Type manualmente - axios lo hace automáticamente con el boundary correcto
    const res = await apiClient.post("/api/uploads/payments", formData);

    // Unwrap: { success: true, data: { url, publicId } }
    return res?.data?.data ?? res?.data ?? res;
  },
};
