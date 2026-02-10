import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutById } from "../checkoutQuery";

export function CheckoutView() {
  const { itemsCount } = useCart();
  const { checkoutId } = useParams();

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        const data = await getCheckoutById(checkoutId);

        if (cancelled) return;
        setCheckout(data);
        setStatus("success");
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
  }, [checkoutId]);

  return (
    <section>
      <p>Cart ({itemsCount})</p>

      {status === "loading" && <p>Loading checkout...</p>}

      {status === "error" && (
        <div role="alert" className="error">
          <p>Something went wrong.</p>
          <p>{error}</p>
        </div>
      )}

      {status === "success" && checkout && (
        <>
          <h2>Order summary</h2>

          {/* ✅ si ya tienes snapshot items */}
          {checkout.items?.length > 0 && (
            <ul>
              {checkout.items.map((i) => (
                <li key={i.productId}>
                  {i.name} — Qty: {i.quantity} — ${i.lineTotalUSD}
                </li>
              ))}
            </ul>
          )}

          <p>
            Subtotal: ${checkout.totals?.subtotalUSD}
            {checkout.totals?.subtotalVES != null ? ` / Bs ${checkout.totals.subtotalVES}` : ""}
          </p>

          {checkout.exchangeRate ? (
            <p>
              Exchange rate: {checkout.exchangeRate.usdToVes} (as of {checkout.exchangeRate.asOf})
            </p>
          ) : (
            <p>Exchange rate: not available</p>
          )}

          <h3>Payment methods</h3>
          <ul>
            <li>USD: {(checkout.paymentMethods?.usd || []).join(", ") || "—"}</li>
            <li>VES: {(checkout.paymentMethods?.ves || []).join(", ") || "—"}</li>
          </ul>
        </>
      )}
    </section>
  );
}
