import React, { createContext, useContext, useMemo, useState } from "react";
import { getCart } from "../features/shopping-cart/cartQuery";
import {
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from "../features/shopping-cart/cartCommand";
import { clearCartSession, ensureCartId } from "../features/shopping-cart/cartService";

const CartContext = createContext(null);

export function CartProvider({ children, initialState }) {
  const [cart, setCart] = useState(initialState?.cart ?? null);
  const [status, setStatus] = useState(initialState?.status ?? "idle");
  const [error, setError] = useState(initialState?.error ?? "");

  const itemsCount = cart?.summary?.itemsCount ?? 0;

  async function initializeCart() {
    try {
      setStatus("loading");
      setError("");

      // 1) intenta cargar el carrito actual
      let cartId = await ensureCartId();
      let loadedCart = await getCart(cartId);

      // 2) si está locked/checked_out => este carrito ya NO sirve para nuevas compras
      if (loadedCart?.metadata?.status && loadedCart.metadata.status !== "active") {
        clearCartSession();
        cartId = await ensureCartId();
        loadedCart = await getCart(cartId);
      }

      setCart(loadedCart);
      setStatus("ready");
    } catch (err) {
      const msg = err?.message || "Unknown error";
      
      // Detect 401/Unauthorized - session expired for claimed cart
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }
      
      setStatus("error");
      setError(msg);
    }
  }

  async function refreshCart() {
    const cartId = localStorage.getItem("cartId");
    if (!cartId) return;

    setStatus("loading");
    const fresh = await getCart(cartId);
    setCart(fresh);
    setStatus("ready");
  }

  // ✅ ESTA ES LA FUNCIÓN “DENTRO DEL PROVIDER”
  async function startNewCart() {
    clearCartSession();
    setCart(null);
    setStatus("idle");
    setError("");
    await initializeCart();
  }

  async function addItem({ productId, quantity }) {
    try {
      setError("");
      const updatedCart = await addItemToCart({ productId, quantity });
      setCart(updatedCart);
      setStatus("ready");
      return updatedCart;
    } catch (err) {
      const msg = err?.message || "Unknown error";
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }
      setStatus("error");
      setError(msg);
      throw err;
    }
  }

  async function updateQuantity({ productId, quantity }) {
    try {
      setError("");
      setStatus("loading");

      const updatedCart = await updateItemQuantity({ productId, quantity });

      setCart(updatedCart);
      setStatus("ready");
      return updatedCart;
    } catch (err) {
      const msg = String(err?.message || "Unknown error");

      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }

      setStatus("error");
      setError(msg);

      if (msg.includes("Item not found in cart")) {
        try {
          await refreshCart();
        } catch {}
        return;
      }

      throw err;
    }
  }

  async function removeItem({ productId }) {
    try {
      setError("");
      setStatus("loading");
      const updatedCart = await removeItemFromCart({ productId });
      setCart(updatedCart);
      setStatus("ready");
      return updatedCart;
    } catch (err) {
      const msg = err?.message || "Unknown error";

      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }

      setStatus("error");
      setError(msg);

      if (msg.includes("Item not found in cart")) {
        try {
          await refreshCart();
        } catch {}
      }

      throw err;
    }
  }

  const value = useMemo(
    () => ({
      cart,
      status,
      error,
      itemsCount,
      initializeCart,
      refreshCart,
      startNewCart, // ✅ EXPUESTO PARA USAR EN /account
      addItem,
      updateQuantity,
      removeItem,
      setCart,
    }),
    [cart, status, error, itemsCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
