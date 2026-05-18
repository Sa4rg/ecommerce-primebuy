// src/infrastructure/metaPixel.js
//
// Wrapper para el Meta Pixel (Facebook Pixel).
// Centraliza todos los eventos de tracking para que las features
// no hablen directamente con window.fbq.
//
// Si VITE_META_PIXEL_ID no está definido o fbq está bloqueado
// (ej. adblocker), todas las funciones son no-ops silenciosos.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

function fbq(...args) {
  if (!PIXEL_ID) return;
  if (typeof window.fbq !== "function") return;
  window.fbq(...args);
}

/**
 * Inicializa el Pixel con el ID configurado y dispara PageView.
 * Debe llamarse una sola vez al arrancar la app (main.jsx).
 */
export function init() {
  if (!PIXEL_ID) return;
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");
}

/**
 * Dispara cuando el usuario ve la página de un producto.
 * @param {object} product - Objeto producto del API
 */
export function trackViewContent(product) {
  fbq("track", "ViewContent", {
    content_ids: [String(product?.id ?? "")],
    content_name: product?.nameEN || product?.name || "",
    content_type: "product",
    value: Number(product?.priceUSD ?? 0),
    currency: "USD",
  });
}

/**
 * Dispara cuando el usuario agrega un producto al carrito.
 * @param {object} product - Objeto producto del API
 */
export function trackAddToCart(product) {
  fbq("track", "AddToCart", {
    content_ids: [String(product?.id ?? "")],
    content_name: product?.nameEN || product?.name || "",
    content_type: "product",
    value: Number(product?.priceUSD ?? 0),
    currency: "USD",
  });
}

/**
 * Dispara cuando el usuario inicia el proceso de checkout.
 * @param {{ subtotalUSD: number, numItems: number }} params
 */
export function trackInitiateCheckout({ subtotalUSD, numItems }) {
  fbq("track", "InitiateCheckout", {
    value: Number(subtotalUSD ?? 0),
    currency: "USD",
    num_items: Number(numItems ?? 0),
  });
}

/**
 * Dispara cuando el usuario completa el pago (envía comprobante).
 * @param {{ value: number, paymentId: string }} params
 */
export function trackPurchase({ value, paymentId }) {
  fbq("track", "Purchase", {
    value: Number(value ?? 0),
    currency: "USD",
    content_type: "product",
    order_id: String(paymentId ?? ""),
  });
}
