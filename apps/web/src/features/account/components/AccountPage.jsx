import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountService } from "../accountService.js";
import { useCart } from "../../../context/CartContext.jsx";

function StatusPill({ text }) {
  const map = {
    pending: "#777",
    submitted: "#1c7ed6",
    confirmed: "#2f9e44",
    rejected: "#e03131",
    paid: "#1c7ed6",
    processing: "#f08c00",
    completed: "#2f9e44",
    cancelled: "#e03131",
  };

  const bg = map[text] || "#555";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        background: bg,
        color: "white",
      }}
    >
      {text}
    </span>
  );
}

export function AccountPage() {
  const navigate = useNavigate();
  const { cart, status: cartStatus, startNewCart, initializeCart } = useCart();

  const [tab, setTab] = useState("orders"); // "orders" | "payments"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [o, p] = await Promise.all([
        accountService.getMyOrders(),
        accountService.getMyPayments(),
      ]);

      setOrders(Array.isArray(o) ? o : []);
      setPayments(Array.isArray(p) ? p : []);
    } catch (e) {
      setErr(e.message || "Failed to load account data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Asegura que el carrito esté inicializado para poder mostrar "Go to cart"
    if (cartStatus === "idle") {
      initializeCart().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }, [orders]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }, [payments]);

  const cartIsActive = cart?.metadata?.status === "active";
  const hasCart = Boolean(cart?.cartId);

  async function onStartNewCart() {
    await startNewCart();
    navigate("/cart");
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>My Account</h1>

      {/* ✅ Navigation actions */}
      <div style={{ display: "flex", gap: 10, margin: "10px 0 18px" }}>
        <Link to="/">← Back to catalog</Link>

        {hasCart && cartIsActive && (
          <button
            type="button"
            onClick={() => navigate("/cart")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            Go to cart
          </button>
        )}

        {(!hasCart || !cartIsActive) && (
          <button
            type="button"
            onClick={onStartNewCart}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            Start new cart
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, margin: "12px 0 18px" }}>
        <button
          onClick={() => setTab("orders")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: tab === "orders" ? "#222" : "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Orders ({orders.length})
        </button>

        <button
          onClick={() => setTab("payments")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: tab === "payments" ? "#222" : "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Payments ({payments.length})
        </button>

        <button
          onClick={load}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {!loading && !err && tab === "orders" && (
        <>
          {sortedOrders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sortedOrders.map((o) => (
                <div
                  key={o.orderId}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <b style={{ flex: 1 }}>
                      Order: <code>{o.orderId}</code>
                    </b>
                    <StatusPill text={o.status} />
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.9 }}>
                    <div>
                      Total: {o.totals?.amountPaid} {o.totals?.currency}
                    </div>
                    <div>Items: {o.items?.length ?? 0}</div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Link to={`/orders/${o.orderId}`}>View details</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !err && tab === "payments" && (
        <>
          {sortedPayments.length === 0 ? (
            <p>No payments yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sortedPayments.map((p) => (
                <div
                  key={p.paymentId}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <b style={{ flex: 1 }}>
                      Payment: <code>{p.paymentId}</code>
                    </b>
                    <StatusPill text={p.status} />
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.9 }}>
                    <div>
                      {p.amount} {p.currency} — {p.method}
                    </div>
                    <div>Reference: {p.proof?.reference || "-"}</div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                    <Link to={`/payments/${p.paymentId}`}>Open status</Link>
                    {p.orderId && <Link to={`/orders/${p.orderId}`}>Open order</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
