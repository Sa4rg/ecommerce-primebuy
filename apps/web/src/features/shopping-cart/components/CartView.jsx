import { useEffect } from "react";
import { useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartError } from "./CartError";
import { useNavigate } from "react-router-dom";

export function CartView() {
  const { cart, status, error, initializeCart } = useCart();
  const navigate = useNavigate();

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

      <button 
      type="button" 
      onClick={() => navigate("/checkout")}
       disabled={cart.items.length === 0}
       >
        Finalize purchase
      </button>
    </section>
  );
}
