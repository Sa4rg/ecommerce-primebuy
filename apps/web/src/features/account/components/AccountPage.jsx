// web/src/features/account/components/AccountPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountService } from "../accountService.js";
import { useCart } from "../../../context/CartContext.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(amount, currency) {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount ?? "?"} ${currency ?? ""}`.trim();

  if (currency === "USD") {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  // VES or others
  return `${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ""}`.trim();
}

function formatDateShort(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-VE");
}

function StatusBadge({ status, className }) {
  const s = String(status || "").toLowerCase();

  const map = {
    // payments
    pending: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20", dot: "bg-slate-400", label: "PENDIENTE" },
    submitted: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400", label: "PENDIENTE" },
    confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400", label: "CONFIRMADO" },
    rejected: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400", label: "RECHAZADO" },

    // orders
    paid: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20", dot: "bg-blue-400", label: "PAGADO" },
    processing: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20", dot: "bg-amber-300", label: "PROCESANDO" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", dot: "bg-emerald-300", label: "COMPLETADO" },
    cancelled: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/20", dot: "bg-rose-300", label: "CANCELADO" },
  };

  const cfg = map[s] || { bg: "bg-white/5", text: "text-slate-300", border: "border-white/10", dot: "bg-slate-400", label: (status || "").toUpperCase() };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className={cx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function GlassCard({ children, className }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm",
        "hover:border-orange-500/30 transition-all",
        className
      )}
    >
      {children}
    </div>
  );
}

function OrderIcon({ status }) {
  const s = String(status || "").toLowerCase();
  let icon = "inventory_2";
  if (s === "processing") icon = "hourglass_top";
  if (s === "completed") icon = "task_alt";
  if (s === "cancelled") icon = "cancel";
  if (s === "paid") icon = "inventory_2";

  return (
    <div className="w-16 h-16 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
  );
}

function PaymentIcon({ method }) {
  const m = String(method || "").toLowerCase();
  let icon = "payments";
  if (m.includes("zelle")) icon = "account_balance_wallet";
  if (m.includes("pago")) icon = "credit_card";
  if (m.includes("transfer")) icon = "payments";

  return (
    <span className="material-symbols-outlined text-orange-400 text-sm">
      {icon}
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
      setErr(e?.message || "Failed to load account data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      (b.createdAt || b.submittedAt || "").localeCompare(a.createdAt || a.submittedAt || "")
    );
  }, [payments]);

  const cartIsActive = cart?.metadata?.status === "active";
  const hasCart = Boolean(cart?.cartId);

  async function onStartNewCart() {
    await startNewCart();
    navigate("/cart");
  }

  return (
    <div className="w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          Inicio
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-slate-100 font-medium">Mi Cuenta</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-slate-100 mb-2">Mi Cuenta</h2>
        <p className="text-slate-400">
          Aquí puedes gestionar tus pedidos y pagos.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            ← Volver al catálogo
          </Link>

          {hasCart && cartIsActive ? (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Ir al carrito
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartNewCart}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Iniciar nuevo carrito
            </button>
          )}

          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={cx(
            "px-6 py-4 text-sm flex items-center gap-2 transition-all",
            tab === "orders"
              ? "font-bold border-b-2 border-orange-500 text-orange-400"
              : "font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          )}
        >
          <span className="material-symbols-outlined text-sm">package_2</span>
          Mis Pedidos
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("payments")}
          className={cx(
            "px-6 py-4 text-sm flex items-center gap-2 transition-all",
            tab === "payments"
              ? "font-bold border-b-2 border-orange-500 text-orange-400"
              : "font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          )}
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          Mis Pagos
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {payments.length}
          </span>
        </button>
      </div>

      {/* States */}
      {loading && <p className="text-slate-400">Loading...</p>}
      {err && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {err}
        </div>
      )}

      {/* Orders */}
      {!loading && !err && tab === "orders" && (
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <GlassCard className="p-8">
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">
                  inventory_2
                </span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">No tienes pedidos aún</h4>
                <p className="text-slate-400 max-w-md">
                  Cuando completes una compra, tus pedidos aparecerán aquí.
                </p>
              </div>
            </GlassCard>
          ) : (
            sortedOrders.map((o) => {
              const total = formatMoney(o?.totals?.amountPaid, o?.totals?.currency);
              return (
                <GlassCard
                  key={o.orderId}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start gap-4">
                    <OrderIcon status={o.status} />
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        Pedido <span className="text-slate-400">#{String(o.orderId).slice(0, 8)}</span>
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {formatDateShort(o.createdAt)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Items: <span className="text-slate-300 font-semibold">{o.items?.length ?? 0}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <p className="text-xl font-bold text-slate-100">{total}</p>
                    <Link
                      className="text-orange-400 text-sm font-bold flex items-center gap-1 hover:underline underline-offset-4"
                      to={`/orders/${o.orderId}`}
                    >
                      Ver detalles
                      <span className="material-symbols-outlined text-xs transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </GlassCard>
              );
            })
          )}

          {/* Optional info block like Stitch */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <GlassCard className="p-8 border-dashed border-orange-500/20 bg-orange-500/5">
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">
                  local_shipping
                </span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">Seguimiento y estados</h4>
                <p className="text-slate-400 max-w-md">
                  Dentro de cada pedido podrás ver el estado de envío y los detalles completos.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Payments */}
      {!loading && !err && tab === "payments" && (
        <div className="space-y-4">
          {sortedPayments.length === 0 ? (
            <GlassCard className="p-8">
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">
                  receipts
                </span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">No tienes pagos aún</h4>
                <p className="text-slate-400 max-w-md">
                  Cuando envíes un comprobante de pago, aparecerá aquí con su estatus.
                </p>
              </div>
            </GlassCard>
          ) : (
            sortedPayments.map((p) => {
              const status = String(p.status || "").toLowerCase();
              const idShort = String(p.paymentId || "").slice(0, 8);
              const date = p.submittedAt || p.createdAt || null;

              const amountText = formatMoney(p.amount, p.currency);
              const ref = p.proof?.reference || p.reference || "-";
              const rejectionReason = p.review?.reason || p.review?.note || "";

              return (
                <div key={p.paymentId} className="space-y-3">
                  <GlassCard
                    className={cx(
                      "rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-default",
                      status === "rejected" && "border-rose-500/20 hover:border-rose-500/40"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">
                          ID: {idShort}-xxxx
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-xs text-slate-500">{formatDateTime(date)}</span>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <h3 className="text-2xl font-bold text-slate-100">{amountText}</h3>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <PaymentIcon method={p.method} />
                          <span>{p.method || "-"}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 mt-1">
                        Ref: <span className="font-mono">{ref}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <StatusBadge status={p.status} />
                      <div className="flex items-center gap-3">
                        <Link
                          className="flex items-center gap-1 text-orange-400 text-sm font-bold hover:underline"
                          to={`/payments/${p.paymentId}`}
                        >
                          Ver estatus
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        {p.orderId && (
                          <Link
                            className="flex items-center gap-1 text-slate-300 text-sm font-semibold hover:text-orange-400 transition-colors"
                            to={`/orders/${p.orderId}`}
                          >
                            Ver pedido
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Rejection note */}
                  {status === "rejected" && rejectionReason && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-3">
                      <span className="material-symbols-outlined text-rose-400 text-lg">error</span>
                      <div>
                        <p className="text-sm font-bold text-rose-300">Pago Rechazado</p>
                        <p className="text-xs text-rose-200/80">
                          Motivo: {rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Help section like Stitch */}
          <div className="mt-12 p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold mb-2">¿Tienes dudas con un pago?</h4>
              <p className="text-slate-400 text-sm">
                Nuestro equipo de soporte está disponible para ayudarte con cualquier inconveniente con tus transacciones.
              </p>
            </div>
            <button
              type="button"
              className="bg-orange-500 hover:bg-orange-500/90 text-white font-bold py-3 px-8 rounded-lg transition-colors whitespace-nowrap"
              onClick={() => alert("Soporte: próximamente (placeholder)")}
            >
              Contactar Soporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
