import { apiClient } from "../../infrastructure/apiClient";
import { ensureCartId } from "./cartService";

export async function addItemToCart({ productId, quantity }) {
  const cartId = await ensureCartId();
  return apiClient.post(`/api/cart/${cartId}/items`, { productId, quantity });
}

export async function updateItemQuantity({ productId, quantity }) {
  const cartId = await ensureCartId();
  return apiClient.patch(`/api/cart/${cartId}/items/${productId}`, { quantity });
}

export async function removeItemFromCart({ productId }) {
  const cartId = await ensureCartId();
  return apiClient.delete(`/api/cart/${cartId}/items/${productId}`);
}
