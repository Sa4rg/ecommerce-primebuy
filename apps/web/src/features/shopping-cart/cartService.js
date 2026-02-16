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

/**
 * Fetch the authenticated user's cart from /api/cart/me
 * If a guest cart exists, sends headers to merge it into user's cart.
 * 
 * @returns {Promise<{cart: Object, isNewCart: boolean, mergedFromGuestCart: boolean}>}
 */
export async function fetchMyCart() {
  const guestCartId = getCartId();
  const guestCartSecret = getCartSecret();

  const headers = {};
  if (guestCartId) {
    headers["X-Guest-Cart-Id"] = guestCartId;
  }
  if (guestCartSecret) {
    headers["X-Cart-Secret"] = guestCartSecret;
  }

  const data = await apiClient.get("/api/cart/me", { headers });

  // Update local storage with user's cart info
  // The user's cart doesn't need a secret (auth is used instead)
  if (data.cart?.cartId) {
    localStorage.setItem(CART_ID_KEY, data.cart.cartId);
    // Remove guest secret since user is authenticated
    localStorage.removeItem(CART_SECRET_KEY);
  }

  return data;
}
