import { apiClient } from "../../infrastructure/apiClient";
import { ensureCartId, getCartSecret } from "./cartService";

function cartMutationHeaders() {
  const secret = getCartSecret();
  return secret ? { "X-Cart-Secret": secret } : {};
}

export async function addItemToCart({ productId, quantity }) {
  const cartId = await ensureCartId();
  return apiClient.post(`/api/cart/${cartId}/items`, { productId, quantity }, {
    headers: cartMutationHeaders(),
  });
}

export async function updateItemQuantity({ productId, quantity }) {
  const cartId = await ensureCartId();
  return apiClient.patch(`/api/cart/${cartId}/items/${productId}`, { quantity }, {
    headers: cartMutationHeaders(),
  });
}

export async function removeItemFromCart({ productId }) {
  const cartId = await ensureCartId();
  return apiClient.delete(`/api/cart/${cartId}/items/${productId}`, {
    headers: cartMutationHeaders(),
  });
}
