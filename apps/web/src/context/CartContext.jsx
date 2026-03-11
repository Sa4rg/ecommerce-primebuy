import React, { createContext, useContext, useMemo, useState } from "react";
import { getCart } from "../features/shopping-cart/cartQuery";
import {
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from "../features/shopping-cart/cartCommand";
import { clearCartSession, ensureCartId, fetchMyCart } from "../features/shopping-cart/cartService";
import { clearCheckoutId, getCheckoutId } from "../features/checkout/checkoutStorage";
import { clearAllPaymentsForCheckouts, clearPaymentForCheckout } from "../features/payment/paymentStorage";

/**
 * Invalidates the current checkout snapshot when the cart changes.
 * This ensures the user gets a fresh checkout with updated cart data.
 */
function invalidateCheckoutSnapshot() {
  const currentCheckoutId = getCheckoutId();
  if (currentCheckoutId) {
    clearPaymentForCheckout(currentCheckoutId);
    clearCheckoutId();
  }
}

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

      let cartId = await ensureCartId();
      let loadedCart = await getCart(cartId);

      if (loadedCart?.metadata?.status && loadedCart.metadata.status !== "active") {
        clearCartSession();
        cartId = await ensureCartId();
        loadedCart = await getCart(cartId);
      }

      setCart(loadedCart);
      setStatus("ready");
    } catch (err) {
      const msg = err?.message || "Unknown error";

      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }

      if (msg.includes("Forbidden") || msg.includes("403")) {
        clearCartSession();
        const newCartId = await ensureCartId();
        const newCart = await getCart(newCartId);
        setCart(newCart);
        setStatus("ready");
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

  async function startNewCart() {
    clearCheckoutId();
    clearAllPaymentsForCheckouts();

    clearCartSession();

    setCart(null);
    setStatus("idle");
    setError("");
    await initializeCart();
  }

  async function syncUserCart() {
    try {
      setStatus("loading");
      setError("");

      const result = await fetchMyCart();

      setCart(result.cart);
      setStatus("ready");

      return result;
    } catch (err) {
      const msg = err?.message || "Unknown error";
      setStatus("error");
      setError(msg);
      throw err;
    }
  }

  async function addItem({ productId, quantity }) {
    try {
      setError("");
      const updatedCart = await addItemToCart({ productId, quantity });
      setCart(updatedCart);
      setStatus("ready");
      invalidateCheckoutSnapshot();
      return updatedCart;
    } catch (err) {
      const msg = String(err?.message || "Unknown error");

      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }

      if (msg.includes("Forbidden") || msg.includes("403")) {
        await startNewCart();
        return addItem({ productId, quantity });
      }

      if (/insufficient stock/i.test(msg)) {
        setStatus(cart ? "ready" : "idle");
        throw err;
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
      invalidateCheckoutSnapshot();
      return updatedCart;
    } catch (err) {
      const msg = String(err?.message || "Unknown error");

      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setStatus("session-expired");
        setError(msg);
        return;
      }

      if (msg.includes("Item not found in cart")) {
        setStatus("ready");
        try {
          await refreshCart();
        } catch {}
        return;
      }

      if (/insufficient stock/i.test(msg)) {
        setStatus("ready");
        throw err;
      }

      setStatus("error");
      setError(msg);
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
      invalidateCheckoutSnapshot();
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
      startNewCart,
      syncUserCart,
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