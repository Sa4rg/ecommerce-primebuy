// web/src/features/checkout/components/CheckoutStart.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createCheckout } from "../checkoutCommand";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutId, setCheckoutId, clearCheckoutId } from "../checkoutStorage";
import { clearPaymentForCheckout } from "../../payment/paymentStorage";
import { useTranslation } from "../../../shared/i18n/useTranslation";

export function CheckoutStart() {
  const { t } = useTranslation();
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

        // Detect authentication error (more robust check)
        const errorMessage = (err?.message || "").toLowerCase();
        const isAuthError = 
          errorMessage.includes("unauthorized") || 
          errorMessage.includes("not authenticated") ||
          err?.statusCode === 401 || 
          err?.status === 401;

        if (isAuthError) {
          setStatus("auth-required");
          setError(t("checkout.auth.requiresLogin"));

          // Wait 1.5s then redirect to login with return intent
          setTimeout(() => {
            if (!cancelled) {
              navigate("/login", {
                replace: true,
                state: { from: { pathname: "/checkout" } },
              });
            }
          }, 3000);
          return;
        }

        setStatus("error");
        setError(err?.message || "Unknown error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, location.state, cart, t]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {status === "loading" && (
        <div className="text-center">
          <p className="text-pb-text-secondary">Creating checkout...</p>
        </div>
      )}

      {status === "auth-required" && (
        <div className="max-w-md mx-auto text-center bg-white-50 border border-orange-100 rounded-lg p-6">
          <div className="text-orange-400">
            <span className="material-symbols-outlined text-4xl mb-4">lock</span>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="font-semibold text-red-700">Something went wrong.</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
        </div>
      )}
    </section>
  );
}