// web/src/features/admin/pages/AdminPaymentDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminService } from "../adminService";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatCompactDate(iso, locale = "en-US") {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyMethod(method, t) {
  const m = String(method || "").toLowerCase();
  if (m === "zelle") return t("payment.methods.zelle");
  if (m === "zinli") return t("payment.methods.zinli");
  if (m === "pago_movil") return t("payment.methods.pago_movil");
  if (m === "bank_transfer") return t("payment.methods.bank_transfer");
  return method || "-";
}

function deliveryLabel(method, t) {
  const m = String(method || "").toLowerCase();
  if (m === "pickup") return t("checkout.methods.shipping.pickup");
  if (m === "local_delivery") return t("checkout.methods.shipping.localDelivery");
  if (m === "national_shipping") return t("checkout.methods.shipping.nationalShipping");
  if (m === "delivery") return t("checkout.methods.shipping.localDelivery");
  return method || "—";
}

function workflowFrom(payment, order) {
  const p = String(payment?.status || "").toLowerCase(); // pending/submitted/confirmed/rejected
  const orderStatus = String(order?.status || "").toLowerCase(); // paid/processing/completed/cancelled
  const ship = String(order?.shipping?.status || "").toLowerCase(); // pending/dispatched/delivered

  if (!order) {
    if (p === "confirmed") return "CONFIRMED";
    if (p === "rejected") return "REJECTED";
    return "PENDING";
  }

  if (orderStatus === "completed" || ship === "delivered") return "DELIVERED";
  if (ship === "dispatched") return "SHIPPED";
  if (orderStatus === "processing") return "PREPARING";
  if (orderStatus === "paid") return "CONFIRMED";

  if (p === "confirmed") return "CONFIRMED";
  if (p === "rejected") return "REJECTED";
  return "PENDING";
}

function stepMeta(activeStep) {
  const steps = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];
  const idx = Math.max(0, steps.indexOf(activeStep));
  return { steps, idx };
}

function workflowTitleKey(step) {
  if (step === "PENDING") return "adminPaymentsDetail.workflow.states.pending";
  if (step === "CONFIRMED") return "adminPaymentsDetail.workflow.states.confirmed";
  if (step === "PREPARING") return "adminPaymentsDetail.workflow.states.preparing";
  if (step === "SHIPPED") return "adminPaymentsDetail.workflow.states.shipped";
  if (step === "DELIVERED") return "adminPaymentsDetail.workflow.states.delivered";
  if (step === "REJECTED") return "adminPaymentsDetail.workflow.states.rejected";
  return "adminPaymentsDetail.workflow.states.pending";
}

export function AdminPaymentDetailPage() {
  const { t, language } = useTranslation();
  const locale = language === "es" ? "es-VE" : "en-US";

  const { paymentId } = useParams();
  const nav = useNavigate();

  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  // dispatch form
  const [carrierName, setCarrierName] = useState("MRW");
  const [trackingNumber, setTrackingNumber] = useState("");

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const p = await adminService.getPayment(paymentId);
      setPayment(p);

      if (p?.orderId) {
        const o = await adminService.getOrder(p.orderId);
        setOrder(o);
      } else {
        setOrder(null);
      }
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const workflow = useMemo(() => workflowFrom(payment, order), [payment, order]);
  const { steps, idx } = useMemo(() => stepMeta(workflow), [workflow]);

  const shippingMethod = order?.shipping?.method ?? null;
  const shippingStatus = String(order?.shipping?.status || "").toLowerCase();
  const orderStatus = String(order?.status || "").toLowerCase();
  const paymentStatus = String(payment?.status || "").toLowerCase();

  const requiresDispatch = useMemo(() => {
    const m = String(shippingMethod || "").toLowerCase();
    return m === "local_delivery" || m === "national_shipping" || m === "delivery";
  }, [shippingMethod]);

  const needsCarrier = useMemo(() => {
    return String(shippingMethod || "").toLowerCase() === "national_shipping";
  }, [shippingMethod]);

  // Actions availability
  const canConfirm = paymentStatus === "submitted";
  const canReject = paymentStatus === "submitted";

  const canStartPreparation =
    paymentStatus === "confirmed" && order && orderStatus === "paid";

  const canDispatch =
    order && orderStatus === "processing" && shippingStatus === "pending" && requiresDispatch;

  const canDeliver =
    order && shippingStatus === "dispatched";

  async function onConfirm() {
    if (!paymentId) return;
    const ok = window.confirm(t("adminPaymentsDetail.confirm.confirmPayment"));
    if (!ok) return;

    setBusyAction("confirm");
    setError("");
    try {
      await adminService.confirmPayment(paymentId);
      await load();
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.confirmFailed"));
    } finally {
      setBusyAction("");
    }
  }

  async function onReject() {
    if (!rejectReason.trim()) {
      window.alert(t("adminPaymentsDetail.errors.rejectReasonRequired"));
      return;
    }

    setBusyAction("reject");
    setError("");
    try {
      await adminService.rejectPayment(paymentId, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason("");
      await load();
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.rejectFailed"));
    } finally {
      setBusyAction("");
    }
  }

  async function onStartPreparation() {
    setBusyAction("prepare");
    setError("");
    try {
      await adminService.processOrder(order.orderId);
      await load();
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.prepareFailed"));
    } finally {
      setBusyAction("");
    }
  }

  async function onDispatch() {
    if (needsCarrier && !trackingNumber.trim()) {
      window.alert(t("adminPaymentsDetail.errors.trackingRequired"));
      return;
    }

    setBusyAction("dispatch");
    setError("");
    try {
      const carrier =
        needsCarrier
          ? { name: carrierName, trackingNumber: trackingNumber.trim() }
          : null;

      await adminService.dispatchShipping(order.orderId, carrier);
      await load();
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.dispatchFailed"));
    } finally {
      setBusyAction("");
    }
  }

  async function onDeliver() {
    const ok = window.confirm(t("adminPaymentsDetail.confirm.markDelivered"));
    if (!ok) return;

    setBusyAction("deliver");
    setError("");
    try {
      await adminService.deliverShipping(order.orderId);
      await load();
    } catch (e) {
      setError(e?.message || t("adminPaymentsDetail.errors.deliverFailed"));
    } finally {
      setBusyAction("");
    }
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-100">
        <p className="text-slate-400">{t("adminPaymentsDetail.states.loading")}</p>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-100">
        <p className="text-red-200">{error || t("adminPaymentsDetail.states.notFound")}</p>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10"
          onClick={() => nav("/admin/payments")}
        >
          {t("adminPaymentsDetail.actions.back")}
        </button>
      </main>
    );
  }

  const customer = order?.customer || null;
  const amountText =
    String(payment.currency || "").toUpperCase() === "USD"
      ? formatUSD(payment.amount)
      : `${payment.amount} ${payment.currency || ""}`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      {/* Breadcrumb + Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Link className="hover:text-orange-400 transition-colors" to="/admin/payments">
              {t("adminPaymentsDetail.breadcrumb.payments")}
            </Link>
            <span className="text-white/30">›</span>
            <span className="text-slate-300">
              #{String(payment.paymentId || paymentId).slice(0, 8)}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("adminPaymentsDetail.title")}{" "}
            <span className="text-orange-400">
              #{String(payment.paymentId || paymentId).slice(0, 8)}
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => nav("/admin/payments")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold"
        >
          ← {t("adminPaymentsDetail.actions.backToList")}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow */}
          <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              {t("adminPaymentsDetail.workflow.title")}
            </h3>

            <div className="relative flex justify-between items-start">
              <div className="absolute top-4 left-0 w-full h-0.5 bg-white/10" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-orange-500"
                style={{ width: `${(idx / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((s, i) => {
                const active = i <= idx;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-2 w-1/5">
                    <div
                      className={[
                        "size-8 rounded-full flex items-center justify-center ring-4 ring-[#221910]",
                        active ? "bg-orange-500 text-white" : "bg-white/10 border-2 border-white/20 text-slate-500",
                      ].join(" ")}
                    >
                      {active ? "✓" : "•"}
                    </div>
                    <span
                      className={[
                        "text-[10px] md:text-xs font-bold text-center",
                        active ? "text-orange-400" : "text-slate-500",
                      ].join(" ")}
                    >
                      {t(`adminPaymentsDetail.workflow.steps.${s}`)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap gap-4 p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl">
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm text-slate-300 mb-2">
                  {t("adminPaymentsDetail.workflow.currentState")}{" "}
                  <span className="text-orange-400 font-bold">
                    {t(workflowTitleKey(workflow))}
                  </span>
                </p>

                <div className="flex gap-3 flex-wrap">
                  {canConfirm && (
                    <button
                      onClick={onConfirm}
                      disabled={busyAction}
                      className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-bold text-sm hover:brightness-110 transition-all"
                    >
                      {busyAction === "confirm"
                        ? t("adminPaymentsDetail.actions.confirming")
                        : t("adminPaymentsDetail.actions.confirmPayment")}
                    </button>
                  )}

                  {canReject && (
                    <button
                      onClick={() => setRejectOpen(true)}
                      disabled={busyAction}
                      className="px-4 py-2.5 rounded-lg border border-red-500/50 text-red-300 font-bold text-sm hover:bg-red-500/10 transition-all"
                    >
                      {t("adminPaymentsDetail.actions.reject")}
                    </button>
                  )}

                  {canStartPreparation && (
                    <button
                      onClick={onStartPreparation}
                      disabled={busyAction}
                      className="px-4 py-2.5 rounded-lg bg-white/10 text-slate-100 font-bold text-sm hover:bg-white/20 border border-white/10 transition-all"
                    >
                      {busyAction === "prepare"
                        ? t("adminPaymentsDetail.actions.starting")
                        : t("adminPaymentsDetail.actions.startPreparation")}
                    </button>
                  )}

                  {canDispatch && (
                    <button
                      onClick={onDispatch}
                      disabled={busyAction}
                      className="px-4 py-2.5 rounded-lg bg-white/10 text-slate-100 font-bold text-sm hover:bg-white/20 border border-white/10 transition-all"
                    >
                      {busyAction === "dispatch"
                        ? t("adminPaymentsDetail.actions.dispatching")
                        : t("adminPaymentsDetail.actions.markDispatched")}
                    </button>
                  )}

                  {canDeliver && (
                    <button
                      onClick={onDeliver}
                      disabled={busyAction}
                      className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all"
                    >
                      {busyAction === "deliver"
                        ? t("adminPaymentsDetail.actions.saving")
                        : t("adminPaymentsDetail.actions.markDelivered")}
                    </button>
                  )}
                </div>

                {/* Dispatch extra fields */}
                {canDispatch && needsCarrier && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {t("adminPaymentsDetail.dispatch.carrier")}
                      </label>
                      <select
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                      >
                        <option value="MRW">MRW</option>
                        <option value="ZOOM">ZOOM</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {t("adminPaymentsDetail.dispatch.trackingNumber")}
                      </label>
                      <input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        placeholder={t("adminPaymentsDetail.dispatch.trackingPlaceholder")}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                🧾 <span>{t("adminPaymentsDetail.paymentSummary.title")}</span>
              </h3>
              <span className="text-orange-400 text-xs font-bold px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
                {String(prettyMethod(payment.method, t)).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
              <div className="p-6">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  {t("adminPaymentsDetail.paymentSummary.paymentId")}
                </p>
                <p className="text-sm font-bold">#{String(payment.paymentId || paymentId).slice(0, 8)}</p>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  {t("adminPaymentsDetail.paymentSummary.amount")}
                </p>
                <p className="text-xl font-bold text-orange-400">{amountText}</p>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  {t("adminPaymentsDetail.paymentSummary.date")}
                </p>
                <p className="text-sm font-bold">{formatCompactDate(payment.updatedAt || payment.createdAt, locale)}</p>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  {t("adminPaymentsDetail.paymentSummary.reference")}
                </p>
                <p className="text-sm font-bold">{payment?.proof?.reference || "-"}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold flex items-center gap-2">
                🛒 {t("adminPaymentsDetail.orderItems.title")}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-bold">{t("adminPaymentsDetail.orderItems.columns.product")}</th>
                    <th className="px-6 py-4 font-bold text-center">{t("adminPaymentsDetail.orderItems.columns.qty")}</th>
                    <th className="px-6 py-4 font-bold text-right">{t("adminPaymentsDetail.orderItems.columns.price")}</th>
                    <th className="px-6 py-4 font-bold text-right">{t("adminPaymentsDetail.orderItems.columns.total")}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {(order?.items || []).length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-slate-400" colSpan={4}>
                        {order
                          ? t("adminPaymentsDetail.orderItems.emptyWithOrder")
                          : t("adminPaymentsDetail.orderItems.emptyNoOrder")}
                      </td>
                    </tr>
                  ) : (
                    (order.items || []).map((it) => (
                      <tr key={it.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Imagen se arregla después: por ahora dejamos el placeholder 📦 */}
                            <div className="size-10 rounded bg-white/10 flex items-center justify-center">📦</div>
                            <span className="text-sm font-medium">{it.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{it.quantity}</td>
                        <td className="px-6 py-4 text-right text-sm text-slate-400">
                          {formatUSD(it.unitPriceUSD ?? 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatUSD(it.lineTotalUSD ?? (it.unitPriceUSD ?? 0) * (it.quantity ?? 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-white/5">
                    <td className="px-6 py-4 text-right font-bold text-slate-400" colSpan={3}>
                      {t("adminPaymentsDetail.orderItems.subtotal")}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-100">
                      {order ? formatUSD(order.totals?.subtotalUSD ?? 0) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Delivery badge */}
          <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">🚚</div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
              {t("adminPaymentsDetail.delivery.badgeTitle")}
            </p>
            <h3 className="text-3xl font-bold tracking-tight">
              {deliveryLabel(shippingMethod || order?.shipping?.method, t)}
            </h3>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-full">
              {requiresDispatch
                ? t("adminPaymentsDetail.delivery.requiresDispatch")
                : t("adminPaymentsDetail.delivery.noDispatchNeeded")}
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              {t("adminPaymentsDetail.customer.title")}
            </h3>

            <div className="flex items-center gap-4 mb-6">
              <div className="size-14 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-lg font-bold">{customer?.name || "—"}</p>
                <p className="text-sm text-slate-400">{t("adminPaymentsDetail.customer.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">✉️</span>
                <div className="text-sm">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    {t("adminPaymentsDetail.customer.email")}
                  </p>
                  <p className="text-slate-200 font-medium">{customer?.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">📞</span>
                <div className="text-sm">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    {t("adminPaymentsDetail.customer.phone")}
                  </p>
                  <p className="text-slate-200 font-medium">{customer?.phone || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              {t("adminPaymentsDetail.shipping.title")}
            </h3>

            {!order ? (
              <p className="text-sm text-slate-400">{t("adminPaymentsDetail.shipping.noOrder")}</p>
            ) : order.shipping?.address ? (
              <div className="text-sm text-slate-200 space-y-1">
                <p>
                  <b>{t("adminPaymentsDetail.shipping.recipient")}</b> {order.shipping.address.recipientName}
                </p>
                <p>
                  <b>{t("adminPaymentsDetail.shipping.phone")}</b> {order.shipping.address.phone}
                </p>
                <p>
                  <b>{t("adminPaymentsDetail.shipping.state")}</b> {order.shipping.address.state}
                </p>
                <p>
                  <b>{t("adminPaymentsDetail.shipping.city")}</b> {order.shipping.address.city}
                </p>
                <p>
                  <b>{t("adminPaymentsDetail.shipping.line1")}</b> {order.shipping.address.line1}
                </p>
                <p>
                  <b>{t("adminPaymentsDetail.shipping.reference")}</b>{" "}
                  {order.shipping.address.reference || "—"}
                </p>

                {order.shipping?.carrier?.trackingNumber && (
                  <p className="mt-2">
                    <b>{t("adminPaymentsDetail.shipping.tracking")}</b>{" "}
                    {order.shipping.carrier.name} · {order.shipping.carrier.trackingNumber}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t("adminPaymentsDetail.shipping.noAddress")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#221910] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">{t("adminPaymentsDetail.rejectModal.title")}</h3>
            <p className="mt-2 text-sm text-slate-400">{t("adminPaymentsDetail.rejectModal.reason")}</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("adminPaymentsDetail.rejectModal.placeholder")}
              className="mt-4 w-full min-h-[96px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                disabled={busyAction}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                {t("adminPaymentsDetail.actions.cancel")}
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={busyAction}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500/90 disabled:opacity-60"
              >
                {busyAction === "reject"
                  ? t("adminPaymentsDetail.actions.rejecting")
                  : t("adminPaymentsDetail.actions.rejectPayment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}