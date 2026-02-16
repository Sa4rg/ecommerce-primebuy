// src/features/payment/pages/PaymentStatusPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { paymentService } from "../paymentService";
import { useCart } from "../../../context/CartContext.jsx";

export function PaymentStatusPage() {
  const { paymentId } = useParams();
  const nav = useNavigate();
  const { startNewCart } = useCart();

  const [payment, setPayment] = useState(null);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const status = payment?.status;

  // evita crear el carrito nuevo múltiples veces por polling / rerenders
  const didCreateNewCartRef = useRef(false);

  async function load() {
    const p = await paymentService.getPayment(paymentId);
    setPayment(p);
    return p;
  }

  useEffect(() => {
    setErr("");
    didCreateNewCartRef.current = false; // reset por si cambias de paymentId
    load().catch((e) => setErr(e.message || "Failed to load payment"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  // Polling solo mientras pending/submitted
  useEffect(() => {
    if (!status) return;
    if (!["pending", "submitted"].includes(status)) return;

    const t = setInterval(() => {
      load().catch(() => {});
    }, 3000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]);

  // ✅ LÓGICA: cuando pasa a submitted/confirmed, el carrito anterior queda "used/inactive"
  // Creamos uno nuevo automáticamente (UNA sola vez).
  useEffect(() => {
    if (!status) return;

    if ((status === "submitted" || status === "confirmed") && !didCreateNewCartRef.current) {
      didCreateNewCartRef.current = true;
      startNewCart().catch(() => {});
    }
  }, [status, startNewCart]);

  const instructions = useMemo(() => {
    if (!payment) return null;
    if (payment.method === "zelle") return "Send via Zelle to payments@tienda.com";
    if (payment.method === "zini") return "Pay with Zinli (instructions here)";
    if (payment.method === "pago_movil") return "Pago Móvil: Banco 0102, CI..., Tel...";
    if (payment.method === "bank_transfer") return "Bank transfer: account details...";
    return null;
  }, [payment]);

  async function continueShopping() {
    // ✅ por UX: asegura carrito nuevo y navega al catálogo
    try {
      await startNewCart();
    } catch {}
    nav("/", { replace: true });
  }

  async function onSubmitProof() {
    setErr("");
    setLoading(true);

    try {
      const updated = await paymentService.submitPayment({ paymentId, reference });
      setPayment(updated);

      // ✅ Si backend lockea el carrito al submit (lo normal),
      // creamos uno nuevo inmediatamente (una sola vez).
      if ((updated?.status === "submitted" || updated?.status === "confirmed") && !didCreateNewCartRef.current) {
        didCreateNewCartRef.current = true;
        await startNewCart();
      }
    } catch (e) {
      setErr(e.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  }

  if (!payment) return <p>{err ? err : "Loading..."}</p>;

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Payment status</h1>

      <p><b>Payment:</b> {payment.paymentId}</p>
      <p><b>Method:</b> {payment.method}</p>
      <p><b>Amount:</b> {payment.amount} {payment.currency}</p>
      <p><b>Status:</b> {payment.status}</p>

      {instructions && (
        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 8, marginTop: 8 }}>
          <b>Instructions</b>
          <p>{instructions}</p>
        </div>
      )}

      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {status === "pending" && (
        <div style={{ marginTop: 16 }}>
          <label>Reference</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} />
          <button onClick={onSubmitProof} disabled={loading || !reference.trim()}>
            {loading ? "Submitting..." : "Submit proof"}
          </button>
        </div>
      )}

      {status === "submitted" && (
        <div style={{ marginTop: 16 }}>
          <p>Submitted. Waiting for admin confirmation...</p>
          <button type="button" onClick={continueShopping}>
            Continue shopping
          </button>
        </div>
      )}

      {status === "confirmed" && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: "lightgreen" }}>Payment confirmed!</p>

          {payment.orderId && (
            <div style={{ marginTop: 8 }}>
              <Link to={`/orders/${payment.orderId}`}>View your order</Link>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={continueShopping}>
              Continue shopping
            </button>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: "tomato" }}>
            Rejected: {payment.review?.reason || "No reason provided"}
          </p>
          <p>You can go back and create a new payment method.</p>

          <button onClick={() => nav(`/checkout/${payment.checkoutId}/payment`)}>
            Choose another method
          </button>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={continueShopping}>
              Continue shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
