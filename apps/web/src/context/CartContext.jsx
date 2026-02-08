import React, { createContext, useContext, useMemo, useState } from "react";
import { ensureCartId } from "../features/shopping-cart/cartService";
import { getCart } from "../features/shopping-cart/cartQuery";
import { addItemToCart, updateItemQuantity, removeItemFromCart   } from "../features/shopping-cart/cartCommand";


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

      const cartId = await ensureCartId();
      const loadedCart = await getCart(cartId);

      setCart(loadedCart);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Unknown error");
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


  async function addItem({ productId, quantity }) {
    try {
      setError("");
      const updatedCart = await addItemToCart({ productId, quantity });
      setCart(updatedCart);
      setStatus("ready");
      return updatedCart;
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Unknown error");
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

    setStatus("error");
    setError(msg);

    if (msg.includes("Item not found in cart")) {
      try {
        await refreshCart();
      } catch {
        // keep error state if refresh fails
      }
      return;
    }
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
        setStatus("error");
        setError(err?.message || "Unknown error");

        if (err?.message.includes("Item not found in cart")) {
            try {
                await refreshCart();
            } catch {
                // keep error state if refresh fails
            }
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
      addItem,
      updateQuantity,
      removeItem,
      setCart, // useful later (optional), but minimal.
    }),
    [cart, status, error, itemsCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
