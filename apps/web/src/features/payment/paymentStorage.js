// web/src/features/payment/paymentStorage.js
const KEY = "paymentByCheckoutId";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

export function savePaymentForCheckout(checkoutId, paymentId) {
  const map = read();
  map[checkoutId] = paymentId;
  write(map);
}

export function getPaymentForCheckout(checkoutId) {
  const map = read();
  return map[checkoutId] || "";
}

// ✅ ADD THIS
export function clearPaymentForCheckout(checkoutId) {
  const map = read();
  delete map[checkoutId];
  write(map);
}

// ✅ ADD THIS (useful when starting a brand-new shopping session)
export function clearAllPaymentsForCheckouts() {
  localStorage.removeItem(KEY);
}