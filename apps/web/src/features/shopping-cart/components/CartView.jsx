import { useEffect } from "react";
import { useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartError } from "./CartError";

export function CartView() {
  const { cart, status, error, initializeCart } = useCart();

  useEffect(() => {
    if (status === "idle") {
      initializeCart();
    }
  }, [status, initializeCart]);

  if (!cart) {
    return <p>Loading cart...</p>;
  }

  return (
    <section>
      <h2>Your Cart</h2>

      {status === "error" && <CartError message={error} />}

      {cart.items.length === 0 && <p>Your cart is empty.</p>}

      {cart.items.map((item) => (
        <CartItem key={item.productId} item={item} />
      ))}

      <CartSummary summary={cart.summary} />
    </section>
  );
}
