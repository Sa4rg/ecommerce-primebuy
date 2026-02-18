// src/features/payment/pages/PaymentMethodPage.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { paymentService } from "../paymentService";
import { savePaymentForCheckout, getPaymentForCheckout } from "../paymentStorage";

const METHODS = [
  { key: "zelle", label: "Zelle (USD)" },
  { key: "zinli", label: "Zinli (USD)" },
  { key: "pago_movil", label: "Pago Móvil (VES)" },
  { key: "bank_transfer", label: "Transferencia (VES)" },
];

export function PaymentMethodPage() {
  const { checkoutId } = useParams();
  const nav = useNavigate();
  const [method, setMethod] = useState("zelle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onContinue() {
    setError("");
    const existing = getPaymentForCheckout(checkoutId);
    if (existing) return nav(`/payments/${existing}`);

    setLoading(true);
    try {
      const payment = await paymentService.createPayment({ checkoutId, method });
      savePaymentForCheckout(checkoutId, payment.paymentId);
      nav(`/payments/${payment.paymentId}`);
    } catch (e) {
      setError(e.message || "Could not create payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Payment</h1>

      <label>Method</label>
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        {METHODS.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>

      {error && <p style={{ color: "tomato" }}>{error}</p>}

      <button onClick={onContinue} disabled={loading}>
        {loading ? "Creating..." : "Continue"}
      </button>
    </div>
  );
}
