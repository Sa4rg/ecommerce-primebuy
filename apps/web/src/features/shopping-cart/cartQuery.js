import { apiClient } from "../../infrastructure/apiClient";

export async function getCart(cartId) {
  return apiClient.get(`/api/cart/${cartId}`);
}
