import { useEffect } from "react";
import { useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartError } from "./CartError";
import { CartSessionExpired } from "./CartSessionExpired";
import { useNavigate } from "react-router-dom";

export function CartView() {
  const { cart, status, error, initializeCart, startNewCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") {
      initializeCart();
    }
  }, [status, initializeCart]);

  // Handle session expired BEFORE checking cart
  if (status === "session-expired") {
    return <CartSessionExpired />;
  }

  if (!cart) {
    return <p>Loading cart...</p>;
  }

  const isActive = cart?.metadata?.status === "active";

  return (
    <section>
      <h2>Your Cart</h2>

      {status === "error" && <CartError message={error} />}

      {!isActive && (
        <div className="error" role="alert" style={{ marginBottom: 12 }}>
          <p>This cart is not active anymore (it was used in a checkout/payment).</p>
          <button
            type="button"
            onClick={() => {
              startNewCart();
              navigate("/", { replace: true });
            }}
          >
            Start a new cart
          </button>
        </div>
      )}

      {cart.items.length === 0 && <p>Your cart is empty.</p>}

      {cart.items.map((item) => (
        <CartItem key={item.productId} item={item} />
      ))}

      <CartSummary summary={cart.summary} />

      <button
        type="button"
        onClick={() => navigate("/checkout")}
        disabled={!isActive || cart.items.length === 0}
      >
        Finalize purchase
      </button>
    </section>
  );
}
