import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCheckout } from "../checkoutCommand";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutId, setCheckoutId, clearCheckoutId } from "../checkoutStorage";

export function CheckoutStart() {
  const { itemsCount } = useCart();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        // 1) Reusar checkout si ya existe en storage
        const existingCheckoutId = getCheckoutId();
        if (existingCheckoutId) {
          navigate(`/checkout/${existingCheckoutId}`, { replace: true });
          return;
        }

        // 2) Crear nuevo checkout
        const cartId = localStorage.getItem("cartId");
        const data = await createCheckout({ cartId });

        if (cancelled) return;

        // 3) Persistir + navegar
        setCheckoutId(data.checkoutId);
        navigate(`/checkout/${data.checkoutId}`, { replace: true });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Unknown error");
        clearCheckoutId();
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <section>
      <p>Cart ({itemsCount})</p>

      {status === "loading" && <p>Creating checkout...</p>}

      {status === "error" && (
        <div role="alert" className="error">
          <p>Something went wrong.</p>
          <p>{error}</p>
        </div>
      )}
    </section>
  );
}
