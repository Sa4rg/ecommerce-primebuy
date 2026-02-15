import { apiClient } from "../../infrastructure/apiClient";

const CART_ID_KEY = "cartId";
const CART_SECRET_KEY = "cartSecret";

export function getCartId() {
  return localStorage.getItem(CART_ID_KEY) || "";
}

export function getCartSecret() {
  return localStorage.getItem(CART_SECRET_KEY) || "";
}

export function setCartSession({ cartId, cartSecret }) {
  if (cartId) localStorage.setItem(CART_ID_KEY, cartId);
  if (cartSecret) localStorage.setItem(CART_SECRET_KEY, cartSecret);
}

export function clearCartSession() {
  localStorage.removeItem(CART_ID_KEY);
  localStorage.removeItem(CART_SECRET_KEY);
}

export async function ensureCartId() {
  const existing = getCartId();
  if (existing) return existing;

  // crea carrito nuevo
  const data = await apiClient.post("/api/cart");

  // backend devuelve { cartId, cartSecret }
  setCartSession({ cartId: data.cartId, cartSecret: data.cartSecret });

  return data.cartId;
}
