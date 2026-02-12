// src/features/payment/pages/PaymentStatusPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { paymentService } from "../paymentService";
import { orderService } from "../../orders/orderService";

export function PaymentStatusPage() {
  const { paymentId } = useParams();
  const nav = useNavigate();

  const [payment, setPayment] = useState(null);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const status = payment?.status;

  async function load() {
    const p = await paymentService.getPayment(paymentId);
    setPayment(p);
  }

  useEffect(() => {
    setErr("");
    load().catch((e) => setErr(e.message || "Failed to load payment"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  // Polling solo mientras submitted/pending
  useEffect(() => {
    if (!status) return;
    if (!["pending", "submitted"].includes(status)) return;

    const t = setInterval(() => {
      load().catch(() => {});
    }, 3000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]);

  const instructions = useMemo(() => {
    if (!payment) return null;
    if (payment.method === "zelle") return "Send via Zelle to payments@tienda.com";
    if (payment.method === "zini") return "Pay with Zinli (instructions here)";
    if (payment.method === "pago_movil") return "Pago Móvil: Banco 0102, CI..., Tel...";
    if (payment.method === "bank_transfer") return "Bank transfer: account details...";
    return null;
  }, [payment]);

  async function onSubmitProof() {
    setErr("");
    setLoading(true);
    try {
      const updated = await paymentService.submitPayment({ paymentId, reference });
      setPayment(updated);
    } catch (e) {
      setErr(e.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateOrder() {
    setErr("");
    setLoading(true);
    try {
      const order = await orderService.createOrder({ paymentId });
      nav(`/orders/${order.orderId}`);
    } catch (e) {
      setErr(e.message || "Failed to create order");
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
        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 8 }}>
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
        <p style={{ marginTop: 16 }}>
          Submitted. Waiting for admin confirmation...
        </p>
      )}

      {status === "confirmed" && (
        <div style={{ marginTop: 16 }}>
          <button onClick={onCreateOrder} disabled={loading}>
            {loading ? "Creating order..." : "Create order"}
          </button>
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
        </div>
      )}
    </div>
  );
}
