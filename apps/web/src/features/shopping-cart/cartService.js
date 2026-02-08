import { apiClient } from "../../infrastructure/apiClient";

const CART_ID_STORAGE_KEY = "cartId";

export async function ensureCartId() {
  const existing = localStorage.getItem(CART_ID_STORAGE_KEY);
  if (existing) return existing;

  const data = await apiClient.post("/api/cart");

  // data contract: { cartId }
  localStorage.setItem(CART_ID_STORAGE_KEY, data.cartId);

  return data.cartId;
}
