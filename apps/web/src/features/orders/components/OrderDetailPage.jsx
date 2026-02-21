// web/src/features/order/components/OrderDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderService } from "../orderService";

// --- Helpers ---
function formatMoneyUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDateHuman(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id) {
  if (!id) return "";
  return String(id).slice(0, 8);
}

function statusLabelES(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "Pagado";
  if (s === "processing") return "En preparación";
  if (s === "completed") return "Completado";
  if (s === "cancelled") return "Cancelado";
  if (s === "created") return "Creado";
  return status || "-";
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (s === "processing") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (s === "completed") return "bg-slate-500/10 text-slate-200 border-slate-500/20";
  if (s === "cancelled") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return "bg-white/5 text-slate-300 border-white/10";
}

// Normaliza "carrier" y tracking aunque backend mande string u objeto
function normalizeCarrier(shipping) {
  const rawCarrier = shipping?.carrier;

  // Caso 1: carrier es string
  if (typeof rawCarrier === "string") {
    return {
      carrierName: rawCarrier || "",
      trackingNumber: typeof shipping?.trackingNumber === "string" ? shipping.trackingNumber : "",
      trackingUrl: typeof shipping?.trackingUrl === "string" ? shipping.trackingUrl : "",
    };
  }

  // Caso 2: carrier es objeto { name, trackingNumber, trackingUrl? }
  if (rawCarrier && typeof rawCarrier === "object") {
    const carrierName = typeof rawCarrier.name === "string" ? rawCarrier.name : "";
    const trackingNumber =
      typeof rawCarrier.trackingNumber === "string"
        ? rawCarrier.trackingNumber
        : typeof shipping?.trackingNumber === "string"
          ? shipping.trackingNumber
          : "";

    const trackingUrl =
      typeof rawCarrier.trackingUrl === "string"
        ? rawCarrier.trackingUrl
        : typeof shipping?.trackingUrl === "string"
          ? shipping.trackingUrl
          : "";

    return { carrierName, trackingNumber, trackingUrl };
  }

  // Caso 3: no hay carrier
  return {
    carrierName: "",
    trackingNumber: typeof shipping?.trackingNumber === "string" ? shipping.trackingNumber : "",
    trackingUrl: typeof shipping?.trackingUrl === "string" ? shipping.trackingUrl : "",
  };
}

export function OrderDetailPage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErr("");
      try {
        const o = await orderService.getOrder(orderId);
        if (!cancelled) {
          setOrder(o);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load order");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const derived = useMemo(() => {
    if (!order) return null;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsCount = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

    const totalUSD = Number(order?.totals?.amountPaid ?? 0);

    const customerName = order?.customer?.name || "—";
    const customerEmail = order?.customer?.email || "—";
    const customerPhone = order?.customer?.phone || "—";

    const shippingMethod = order?.shipping?.method || "—";
    const shippingAddress =
      order?.shipping?.address && String(shippingMethod).toLowerCase() !== "pickup"
        ? order.shipping.address
        : null;

    const addressLine = shippingAddress?.line1 || "—";
    const addressCity = shippingAddress?.city || "";
    const addressState = shippingAddress?.state || "";
    const addressRef = shippingAddress?.reference || "";

    const createdAt = order?.createdAt || order?.updatedAt || "";
    const createdAtHuman = createdAt ? formatDateHuman(createdAt) : "";

    // ✅ Carrier + tracking normalizados (para que nunca renderice un objeto)
    const { carrierName, trackingNumber, trackingUrl } = normalizeCarrier(order?.shipping);

    return {
      items,
      itemsCount,
      totalUSD,
      customerName,
      customerEmail,
      customerPhone,
      shippingMethod,
      shippingAddress,
      addressLine,
      addressCity,
      addressState,
      addressRef,
      createdAtHuman,
      carrier: carrierName,
      trackingNumber,
      trackingUrl,
    };
  }, [order]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-slate-400">Cargando pedido…</p>
      </div>
    );
  }

  if (status === "error" || !order || !derived) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
          {err || "No se pudo cargar el pedido."}
        </div>
        <div className="mt-6">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:underline"
          >
            ← Volver a Mi Cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumbs & Back */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/account" className="hover:text-orange-400 transition-colors">
            Mi Cuenta
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-slate-100">Pedido #{shortId(order.orderId)}</span>
        </div>

        <Link
          to="/account"
          className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:underline"
        >
          <span aria-hidden>←</span>
          Volver a mis pedidos
        </Link>
      </div>

      {/* Header card */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Detalle del Pedido #{shortId(order.orderId)}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {derived.createdAtHuman ? `Realizado el ${derived.createdAtHuman}` : "—"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/15 transition-colors"
              onClick={() => alert("Factura PDF (placeholder)")}
            >
              <span aria-hidden>⬇</span>
              Factura PDF
            </button>

            <div
              className={`inline-flex items-center justify-center rounded-xl border px-6 py-2 text-sm font-bold ${statusBadgeClass(
                order.status
              )}`}
              title={String(order.status || "")}
            >
              {statusLabelES(order.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Customer */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>👤</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">Datos del Cliente</h3>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-100">{derived.customerName}</p>
            <p className="text-sm text-slate-400">{derived.customerEmail}</p>
            <p className="text-sm text-slate-400">{derived.customerPhone}</p>
          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>🚚</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">Envío / Entrega</h3>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              {String(derived.shippingMethod).toLowerCase() === "pickup"
                ? "Retiro en tienda"
                : derived.shippingMethod}
            </p>

            {derived.shippingAddress ? (
              <>
                <p className="text-sm text-slate-400">{derived.addressLine}</p>
                <p className="text-sm text-slate-400">
                  {[derived.addressCity, derived.addressState].filter(Boolean).join(", ")}
                </p>
                {derived.addressRef ? <p className="text-sm text-slate-400">{derived.addressRef}</p> : null}
              </>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}

            {/* ✅ Carrier + Tracking */}
            {(derived.carrier || derived.trackingNumber) && (
              <div className="mt-3 space-y-1 rounded-xl border border-white/10 bg-white/5 p-3">
                {derived.carrier && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500 text-xs font-bold uppercase mr-2">Empresa</span>
                    {derived.carrier}
                  </p>
                )}

                {derived.trackingNumber && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500 text-xs font-bold uppercase mr-2">Tracking</span>
                    {derived.trackingUrl ? (
                      <a
                        href={derived.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-400 hover:underline font-mono"
                      >
                        {derived.trackingNumber}
                      </a>
                    ) : (
                      <span className="font-mono">{derived.trackingNumber}</span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>🧭</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">Estado Actual</h3>
          </div>

          {(() => {
            const shipMethod = String(order?.shipping?.method || "").toLowerCase();
            const shipStatus = String(order?.shipping?.status || "").toLowerCase();

            const isPickup = shipMethod === "pickup";

            const dispatchedAtHuman = order?.shipping?.dispatchedAt
              ? formatDateHuman(order.shipping.dispatchedAt)
              : "";
            const deliveredAtHuman = order?.shipping?.deliveredAt
              ? formatDateHuman(order.shipping.deliveredAt)
              : "";

            const isDispatched = shipStatus === "dispatched" || shipStatus === "delivered";
            const isDelivered = shipStatus === "delivered";

            const pickupDone = String(order?.status || "").toLowerCase() === "completed";

            return (
              <div className="relative space-y-4 border-l-2 border-orange-500/20 pl-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                  <p className="text-sm font-bold text-slate-100">Pedido creado</p>
                  <p className="text-xs text-slate-400">{derived.createdAtHuman || "—"}</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                  <p className="text-sm font-bold text-slate-100">
                    Estado: {statusLabelES(order.status)}
                  </p>
                  <p className="text-xs text-slate-400">Actual</p>
                </div>

                {isPickup ? (
                  <div className="relative">
                    <div
                      className={[
                        "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                        pickupDone ? "bg-emerald-500" : "bg-slate-600",
                      ].join(" ")}
                    />
                    <p className={pickupDone ? "text-sm font-bold text-slate-100" : "text-sm font-bold text-slate-400"}>
                      {pickupDone ? "Retirado en tienda" : "Listo para retiro"}
                    </p>
                    <p className={pickupDone ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                      {pickupDone ? "Completado" : "Pendiente"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div
                        className={[
                          "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                          isDispatched ? "bg-orange-500 ring-4 ring-orange-500/20" : "bg-slate-600",
                        ].join(" ")}
                      />
                      <p className={isDispatched ? "text-sm font-bold text-slate-100" : "text-sm font-bold text-slate-400"}>
                        Despachado
                      </p>
                      <p className={isDispatched ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                        {isDispatched ? (dispatchedAtHuman || "Listo") : "Pendiente"}
                      </p>
                    </div>

                    <div className="relative">
                      <div
                        className={[
                          "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                          isDelivered ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-slate-600",
                        ].join(" ")}
                      />
                      <p className={isDelivered ? "text-sm font-bold text-slate-100" : "text-sm font-bold text-slate-400"}>
                        Entregado
                      </p>
                      <p className={isDelivered ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                        {isDelivered ? (deliveredAtHuman || "Completado") : "Pendiente"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Items table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-100">Productos en este pedido</h3>
          <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-300">
            {derived.itemsCount} ítems
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Producto</th>
                <th className="px-6 py-4 text-center font-bold">Cantidad</th>
                <th className="px-6 py-4 text-right font-bold">Precio Unit.</th>
                <th className="px-6 py-4 text-right font-bold">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {derived.items.map((it) => {
                const unit = Number(it.unitPriceUSD ?? 0);
                const line = Number(it.lineTotalUSD ?? unit * (Number(it.quantity) || 0));
                return (
                  <tr key={it.productId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl border border-white/10 bg-black/20" />
                        <div>
                          <p className="font-bold text-slate-100">{it.name}</p>
                          <p className="text-xs text-slate-500">ID: {it.productId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-medium text-slate-200">{it.quantity}</td>

                    <td className="px-6 py-4 text-right font-medium text-slate-200">{formatMoneyUSD(unit)}</td>

                    <td className="px-6 py-4 text-right font-bold text-slate-100">{formatMoneyUSD(line)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col justify-end gap-8 md:flex-row">
        <div className="w-full md:w-80 space-y-3">
          <div className="flex justify-between text-slate-400">
            <span>Total</span>
            <span className="font-medium text-slate-100">
              {String(order?.totals?.currency || "").toUpperCase() === "USD"
                ? formatMoneyUSD(derived.totalUSD)
                : `${order?.totals?.amountPaid ?? 0} ${order?.totals?.currency || ""}`}
            </span>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-3">
            <span className="text-lg font-bold uppercase tracking-tight text-slate-200">Total del Pedido</span>
            <span className="text-3xl font-bold text-orange-400">
              {String(order?.totals?.currency || "").toUpperCase() === "USD"
                ? formatMoneyUSD(derived.totalUSD)
                : `${order?.totals?.amountPaid ?? 0} ${order?.totals?.currency || ""}`}
            </span>
          </div>

          <p className="text-right text-[10px] italic text-slate-500">
            {order?.totals?.currency ? `Precios expresados en ${order.totals.currency}` : ""}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 md:flex-row">
        <p className="text-sm text-slate-400">
          ¿Necesitas ayuda con este pedido?{" "}
          <a className="font-bold text-orange-400 hover:underline" href="#">
            Contactar Soporte
          </a>
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            className="rounded-xl bg-white/5 px-6 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 transition-colors border border-white/10"
            onClick={() => alert("Reportar problema (placeholder)")}
          >
            Reportar Problema
          </button>

          <button
            type="button"
            className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500/90 transition-colors"
            onClick={() => alert("Seguir mi envío (placeholder)")}
          >
            Seguir mi envío
          </button>
        </div>
      </div>
    </main>
  );
}
