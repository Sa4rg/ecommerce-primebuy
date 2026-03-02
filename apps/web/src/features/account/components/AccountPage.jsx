// web/src/features/account/components/AccountPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { accountService } from "../accountService.js";
import { useCart } from "../../../context/CartContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";
import { WHATSAPP_SUPPORT } from "../../../config.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(amount, currency, language) {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount ?? "?"} ${currency ?? ""}`.trim();

  if (String(currency || "").toUpperCase() === "USD") {
    // en-US para dinero USD es ok, pero si quieres variar por language, lo cambiamos luego
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  // VES or others
  const locale = language === "en" ? "en-US" : "es-VE";
  return `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ""}`.trim();
}

function formatDateShort(iso, language) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const locale = language === "en" ? "en-US" : "es-VE";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso, language) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const locale = language === "en" ? "en-US" : "es-VE";
  return d.toLocaleString(locale);
}

function StatusBadge({ status, className, t }) {
  const s = String(status || "").toLowerCase();

  // Nota: aquí solo traducimos el label; estilos se mantienen igual
  const map = {
    // payments
    pending: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20", dot: "bg-slate-400", labelKey: "account.badges.pending" },
    submitted: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400", labelKey: "account.badges.pending" },
    confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400", labelKey: "account.badges.confirmed" },
    rejected: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400", labelKey: "account.badges.rejected" },

    // orders
    paid: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20", dot: "bg-blue-400", labelKey: "account.badges.paid" },
    processing: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20", dot: "bg-amber-300", labelKey: "account.badges.processing" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", dot: "bg-emerald-300", labelKey: "account.badges.completed" },
    cancelled: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/20", dot: "bg-rose-300", labelKey: "account.badges.cancelled" },
  };

  const cfg = map[s] || {
    bg: "bg-white/5",
    text: "text-slate-300",
    border: "border-white/10",
    dot: "bg-slate-400",
    labelKey: null,
    labelRaw: (status || "").toUpperCase(),
  };

  const label = cfg.labelKey ? t(cfg.labelKey) : cfg.labelRaw;

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
      {label}
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

  return <span className="material-symbols-outlined text-orange-400 text-sm">{icon}</span>;
}

export function AccountPage() {
  const navigate = useNavigate();
  const { cart, status: cartStatus, startNewCart, initializeCart } = useCart();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [tab, setTab] = useState("orders"); // "orders" | "payments"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [o, p] = await Promise.all([accountService.getMyOrders(), accountService.getMyPayments()]);
      setOrders(Array.isArray(o) ? o : []);
      setPayments(Array.isArray(p) ? p : []);
    } catch (e) {
      setErr(e?.message || t("account.errors.loadFailed"));
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
    return [...orders].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [orders]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => (b.createdAt || b.submittedAt || "").localeCompare(a.createdAt || a.submittedAt || ""));
  }, [payments]);

  const cartIsActive = cart?.metadata?.status === "active";
  const hasCart = Boolean(cart?.cartId);

  async function onStartNewCart() {
    await startNewCart();
    navigate("/cart");
  }

  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "";

  return (
    <div className="w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          {t("account.breadcrumb.home")}
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-slate-100 font-medium">{t("account.breadcrumb.account")}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-slate-100 mb-2">
          {firstName ? t("account.header.greeting", { name: firstName }) : t("account.header.title")}
        </h2>

        <p className="text-slate-400">{t("account.header.subtitle")}</p>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            ← {t("account.actions.backToCatalog")}
          </Link>

          {hasCart && cartIsActive ? (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              {t("account.actions.goToCart")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartNewCart}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              {t("account.actions.startNewCart")}
            </button>
          )}

          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            {t("account.actions.refresh")}
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
          {t("account.tabs.orders")}
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
          {t("account.tabs.payments")}
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {payments.length}
          </span>
        </button>
      </div>

      {/* States */}
      {loading && <p className="text-slate-400">{t("account.states.loading")}</p>}
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
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">inventory_2</span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">{t("account.orders.empty.title")}</h4>
                <p className="text-slate-400 max-w-md">{t("account.orders.empty.body")}</p>
              </div>
            </GlassCard>
          ) : (
            sortedOrders.map((o) => {
              const total = formatMoney(o?.totals?.amountPaid, o?.totals?.currency, language);
              return (
                <GlassCard
                  key={o.orderId}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start gap-4">
                    <OrderIcon status={o.status} />
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {t("account.orders.card.title")}{" "}
                        <span className="text-slate-400">#{String(o.orderId).slice(0, 8)}</span>
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {formatDateShort(o.createdAt, language)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={o.status} t={t} />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {t("account.orders.card.itemsLabel")}{" "}
                        <span className="text-slate-300 font-semibold">{o.items?.length ?? 0}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <p className="text-xl font-bold text-slate-100">{total}</p>
                    <Link
                      className="text-orange-400 text-sm font-bold flex items-center gap-1 hover:underline underline-offset-4"
                      to={`/orders/${o.orderId}`}
                    >
                      {t("account.orders.card.viewDetails")}
                      <span className="material-symbols-outlined text-xs transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </GlassCard>
              );
            })
          )}

          {/* Optional info block */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <GlassCard className="p-8 border-dashed border-orange-500/20 bg-orange-500/5">
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">local_shipping</span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">{t("account.orders.info.title")}</h4>
                <p className="text-slate-400 max-w-md">{t("account.orders.info.body")}</p>
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
                <span className="material-symbols-outlined text-5xl text-orange-500/50 mb-4">receipts</span>
                <h4 className="text-lg font-bold text-slate-200 mb-2">{t("account.payments.empty.title")}</h4>
                <p className="text-slate-400 max-w-md">{t("account.payments.empty.body")}</p>
              </div>
            </GlassCard>
          ) : (
            sortedPayments.map((p) => {
              const status = String(p.status || "").toLowerCase();
              const idShort = String(p.paymentId || "").slice(0, 8);
              const date = p.submittedAt || p.createdAt || null;

              const amountText = formatMoney(p.amount, p.currency, language);
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
                          {t("account.payments.card.id")} {idShort}-xxxx
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-xs text-slate-500">{formatDateTime(date, language)}</span>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <h3 className="text-2xl font-bold text-slate-100">{amountText}</h3>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <PaymentIcon method={p.method} />
                          <span>{p.method || "-"}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 mt-1">
                        {t("account.payments.card.ref")} <span className="font-mono">{ref}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <StatusBadge status={p.status} t={t} />
                      <div className="flex items-center gap-3">
                        <Link
                          className="flex items-center gap-1 text-orange-400 text-sm font-bold hover:underline"
                          to={`/payments/${p.paymentId}`}
                        >
                          {t("account.payments.card.viewStatus")}
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        {p.orderId && (
                          <Link
                            className="flex items-center gap-1 text-slate-300 text-sm font-semibold hover:text-orange-400 transition-colors"
                            to={`/orders/${p.orderId}`}
                          >
                            {t("account.payments.card.viewOrder")}
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
                        <p className="text-sm font-bold text-rose-300">{t("account.payments.rejected.title")}</p>
                        <p className="text-xs text-rose-200/80">
                          {t("account.payments.rejected.reason")} {rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Help section */}
          <div className="mt-12 p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold mb-2">{t("account.help.title")}</h4>
              <p className="text-slate-400 text-sm">{t("account.help.body")}</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(t("account.help.whatsappMessage"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-500/90 text-white font-bold py-3 px-8 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("account.help.cta")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}