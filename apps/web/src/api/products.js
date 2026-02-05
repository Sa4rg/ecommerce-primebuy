import { API_BASE_URL } from "../config";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/api/products`);

  // si el backend devuelve 500/404 etc
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const body = await res.json();

  // tu backend envía: { success, message, data }
  if (!body.success) {
    throw new Error(body.message || "Failed to fetch products");
  }

  return body.data; // array de productos
}
