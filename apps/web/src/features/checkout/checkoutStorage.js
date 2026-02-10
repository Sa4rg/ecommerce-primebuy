const CHECKOUT_ID_KEY = "checkoutId";

export function getCheckoutId() {
  return localStorage.getItem(CHECKOUT_ID_KEY) || "";
}

export function setCheckoutId(id) {
  if (!id) localStorage.removeItem(CHECKOUT_ID_KEY);
  else localStorage.setItem(CHECKOUT_ID_KEY, id);
}

export function clearCheckoutId() {
  localStorage.removeItem(CHECKOUT_ID_KEY);
}
