import { apiClient } from "../../infrastructure/apiClient";   

export async function getCheckoutById(checkoutId) {
    if (!checkoutId || typeof checkoutId !== "string") {
        throw new Error("checkoutId is required");
    }
  return apiClient.get(`/api/checkout/${checkoutId}`);
}