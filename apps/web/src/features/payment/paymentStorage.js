// src/features/payment/paymentStorage.js
const PAYMENT_ID_KEY = "checkoutPaymentMap"; // { [checkoutId]: paymentId }

export function savePaymentForCheckout(checkoutId, paymentId) {
  const raw = localStorage.getItem(PAYMENT_ID_KEY);
  const map = raw ? JSON.parse(raw) : {};
  map[checkoutId] = paymentId;
  localStorage.setItem(PAYMENT_ID_KEY, JSON.stringify(map));
}

export function getPaymentForCheckout(checkoutId) {
  const raw = localStorage.getItem(PAYMENT_ID_KEY);
  const map = raw ? JSON.parse(raw) : {};
  return map[checkoutId] || null;
}

export function clearPaymentForCheckout(checkoutId) {
  const raw = localStorage.getItem(PAYMENT_ID_KEY);
  const map = raw ? JSON.parse(raw) : {};
  delete map[checkoutId];
  localStorage.setItem(PAYMENT_ID_KEY, JSON.stringify(map));
}
