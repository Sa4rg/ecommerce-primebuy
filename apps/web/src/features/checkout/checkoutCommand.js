import { apiClient } from "../../infrastructure/apiClient";

/**
 * Command: creates a checkout for a given cartId.
 * It calls POST /api/checkout (auth required in backend).
 */
export async function createCheckout({ cartId }) {
  if (!cartId || typeof cartId !== "string") {
    throw new Error("cartId is required");
  }

  return apiClient.post("/api/checkout", { cartId });
}

export async function getCheckoutById(checkoutId) {
  if (!checkoutId) throw new Error("checkoutId is required");
  return apiClient.get(`/api/checkout/${checkoutId}`);
}

export function updateCheckoutCustomer(checkoutId, patch) {
  if (!checkoutId) throw new Error("checkoutId is required");
  return apiClient.patch(`/api/checkout/${checkoutId}/customer`, patch);
}

export function updateCheckoutShipping(checkoutId, patch) {
  if (!checkoutId) throw new Error("checkoutId is required");
  return apiClient.patch(`/api/checkout/${checkoutId}/shipping`, patch);
}
