import { apiClient } from "../../infrastructure/apiClient";

const CART_ID_STORAGE_KEY = "cartId";
const CART_SECRET_STORAGE_KEY = "cartSecret";

export function getCartSecret() {
  return localStorage.getItem(CART_SECRET_STORAGE_KEY);
}

export async function ensureCartId() {
  const existing = localStorage.getItem(CART_ID_STORAGE_KEY);
  if (existing) return existing;

  const data = await apiClient.post("/api/cart");

  // data contract: { cartId, cartSecret }
  localStorage.setItem(CART_ID_STORAGE_KEY, data.cartId);
  localStorage.setItem(CART_SECRET_STORAGE_KEY, data.cartSecret);

  return data.cartId;
}
