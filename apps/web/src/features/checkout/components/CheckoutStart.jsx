// web/src/features/checkout/components/CheckoutStart.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createCheckout } from "../checkoutCommand";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutId, setCheckoutId, clearCheckoutId } from "../checkoutStorage";
import { clearPaymentForCheckout } from "../../payment/paymentStorage";

export function CheckoutStart() {
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 tomamos también addItem por Buy Now
  const cart = useCart();
  const { itemsCount } = cart;

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        const buyNow = location.state?.buyNow; // { productId, quantity, replaceCart }

        // ✅ Reusar checkout SOLO si NO es Buy Now
        if (!buyNow) {
          const existingCheckoutId = getCheckoutId();
          if (existingCheckoutId) {
            navigate(`/checkout/${existingCheckoutId}`, { replace: true });
            return;
          }
        }

        // ✅ Si es Buy Now, forzamos un checkout nuevo (porque el carrito cambió)
        clearCheckoutId();

        // ✅ Buy Now: preparar carrito con 1 item
        if (buyNow?.productId) {
          // (Opcional) reemplazar carrito si existe algún método disponible
          if (buyNow.replaceCart) {
            try {
              if (typeof cart.clear === "function") await cart.clear();
              else if (typeof cart.startNewCart === "function") await cart.startNewCart();
              else if (typeof cart.resetCart === "function") await cart.resetCart();
              // si no existe ninguno, seguimos igual sin romper
            } catch {
              // ignore
            }
          }

          // Agregar el producto al carrito
          await cart.addItem({
            productId: buyNow.productId,
            quantity: buyNow.quantity ?? 1,
          });
        }

        if (cancelled) return;

        // 2) Crear nuevo checkout
        // 👇 importante: leer cartId DESPUÉS de Buy Now, por si el cart cambió
        const cartId = localStorage.getItem("cartId");
        const data = await createCheckout({ cartId });

        if (cancelled) return;

        // 3) Clear any stale payment mapping for this new checkout
        clearPaymentForCheckout(data.checkoutId);

        // 4) Persistir + navegar
        setCheckoutId(data.checkoutId);
        navigate(`/checkout/${data.checkoutId}`, { replace: true });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Unknown error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, location.state, cart]);

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