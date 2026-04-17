// web/src/features/orders/components/OrderDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderService } from "../orderService";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";
import { OrderDetailSkeleton } from "../../../shared/components/Skeleton.jsx";
import { WHATSAPP_SUPPORT } from "../../../config.js";

// --- Helpers ---
function formatMoneyUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDateHuman(iso, language) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const locale = language === "en" ? "en-US" : "es-VE";
  return d.toLocaleString(locale, {
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

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function capitalizeWords(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "processing") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "completed") return "bg-slate-100 text-slate-600 border-slate-200";
  if (s === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  return "bg-pb-surface text-pb-text-secondary border-pb-border";
}

// Normaliza "carrier" y tracking aunque backend mande string u objeto
function normalizeCarrier(shipping) {
  const rawCarrier = shipping?.carrier;

  // carrier string
  if (typeof rawCarrier === "string") {
    return {
      carrierName: rawCarrier || "",
      trackingNumber: typeof shipping?.trackingNumber === "string" ? shipping.trackingNumber : "",
      trackingUrl: typeof shipping?.trackingUrl === "string" ? shipping.trackingUrl : "",
    };
  }

  // carrier object
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

  return {
    carrierName: "",
    trackingNumber: typeof shipping?.trackingNumber === "string" ? shipping.trackingNumber : "",
    trackingUrl: typeof shipping?.trackingUrl === "string" ? shipping.trackingUrl : "",
  };
}

function getItemImageUrl(it) {
  // Compatible con lo que ya usan carrito/checkout: imageUrl
  return it?.imageUrl || it?.image?.url || it?.product?.imageUrl || it?.productImageUrl || "";
}

function buildWhatsAppLink({ phone, message }) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}

function escapeHtml(s) {
  // ✅ más compatible que replaceAll
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ✅ Factura PDF básica: abre ventana + print (guardar como PDF)
function openInvoicePrint({ order, derived, t, language }) {
  // 🔥 IMPORTANT: NO uses "noreferrer" aquí (puede bloquear acceso al document)
  const w = window.open("", "_blank");
  if (!w) {
    window.alert(
      "El navegador bloqueó la ventana emergente. Permite popups para generar la factura."
    );
    return;
  }

  try {
    const title = t("orderDetail.invoiceTitle", { id: shortId(order?.orderId) });

    const rowsHtml = (derived.items || [])
      .map((it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPriceUSD ?? 0);
        const line = Number(it.lineTotalUSD ?? unit * qty);

        return `
          <tr>
            <td>
              <div style="font-weight:700">${escapeHtml(it.name || "-")}</div>
              <div style="color:#666;font-size:12px">ID: ${escapeHtml(it.productId || "")}</div>
            </td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:right">${escapeHtml(formatMoneyUSD(unit))}</td>
            <td style="text-align:right;font-weight:700">${escapeHtml(formatMoneyUSD(line))}</td>
          </tr>
        `;
      })
      .join("");

    const currency = String(order?.totals?.currency || "USD").toUpperCase();
    const totalText =
      currency === "USD"
        ? formatMoneyUSD(Number(derived.totalUSD ?? 0))
        : `${order?.totals?.amountPaid ?? 0} ${currency}`;

    const createdAt = order?.createdAt || order?.updatedAt || "";
    const createdAtHuman = createdAt ? formatDateHuman(createdAt, language) : "—";

    const shipAddr = derived.shippingAddress;
    const addressBlock = shipAddr
      ? `
        <div>${escapeHtml(derived.addressLine || "—")}</div>
        <div>${escapeHtml([derived.addressCity, derived.addressState].filter(Boolean).join(", "))}</div>
        ${derived.addressRef ? `<div>${escapeHtml(derived.addressRef)}</div>` : ""}
      `
      : `<div>—</div>`;

    const trackingBlock =
      derived.trackingNumber || derived.carrier
        ? `
          <div style="margin-top:8px">
            ${derived.carrier ? `<div><b>${escapeHtml(t("orderDetail.shippingCompany"))}:</b> ${escapeHtml(derived.carrier)}</div>` : ""}
            ${derived.trackingNumber ? `<div><b>${escapeHtml(t("orderDetail.shippingTracking"))}:</b> ${escapeHtml(derived.trackingNumber)}</div>` : ""}
          </div>
        `
        : "";

    // Datos básicos tienda (ajusta si quieres)
    const shopName = "Prime Buy";
    const shopEmail = "cyaimport.c.a@gmail.com";
    const shopPhone = "+58 412 621 6402";

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#111; margin:24px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
    .brand { font-size:20px; font-weight:800; }
    .muted { color:#666; font-size:12px; }
    .card { border:1px solid #e5e5e5; border-radius:12px; padding:16px; margin-top:16px; }
    h1 { font-size:18px; margin:0; }
    h2 { font-size:14px; margin:0 0 8px 0; }
    table { width:100%; border-collapse:collapse; margin-top:10px; }
    th, td { border-bottom:1px solid #eee; padding:10px 8px; vertical-align:top; }
    th { text-align:left; font-size:12px; color:#444; text-transform:uppercase; letter-spacing:0.06em; }
    .totalRow { display:flex; justify-content:flex-end; gap:16px; margin-top:12px; }
    .totalLabel { color:#666; font-weight:700; }
    .totalValue { font-weight:900; font-size:18px; }
    @media print { .noPrint { display:none; } body { margin:0; } }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">${escapeHtml(shopName)}</div>
      <div class="muted">${escapeHtml(shopEmail)} · ${escapeHtml(shopPhone)}</div>
    </div>
    <div style="text-align:right">
      <h1>${escapeHtml(t("orderDetail.invoiceTitle", { id: shortId(order?.orderId) }))}</h1>
      <div class="muted">${escapeHtml(t("orderDetail.invoiceDate"))}: ${escapeHtml(createdAtHuman)}</div>
      <div class="muted">${escapeHtml(t("orderDetail.orderIdLabel"))}: ${escapeHtml(String(order?.orderId || ""))}</div>
    </div>
  </div>

  <div class="card">
    <h2>${escapeHtml(t("orderDetail.customerTitle"))}</h2>
    <div><b>${escapeHtml(t("orderDetail.customerName"))}:</b> ${escapeHtml(derived.customerName || "—")}</div>
    <div><b>${escapeHtml(t("orderDetail.customerEmail"))}:</b> ${escapeHtml(derived.customerEmail || "—")}</div>
    <div><b>${escapeHtml(t("orderDetail.customerPhone"))}:</b> ${escapeHtml(derived.customerPhone || "—")}</div>
  </div>

  <div class="card">
    <h2>${escapeHtml(t("orderDetail.shippingTitle"))}</h2>
    <div><b>${escapeHtml(t("orderDetail.shippingMethod"))}:</b> ${escapeHtml(derived.shippingMethod || "—")}</div>
    <div style="margin-top:6px"><b>${escapeHtml(t("orderDetail.shippingAddress"))}:</b></div>
    ${addressBlock}
    ${trackingBlock}
  </div>

  <div class="card">
    <h2>${escapeHtml(t("orderDetail.itemsTitle"))}</h2>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t("orderDetail.table.product"))}</th>
          <th style="text-align:center">${escapeHtml(t("orderDetail.table.qty"))}</th>
          <th style="text-align:right">${escapeHtml(t("orderDetail.table.unitPrice"))}</th>
          <th style="text-align:right">${escapeHtml(t("orderDetail.table.subtotal"))}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || ""}
      </tbody>
    </table>

    <div class="totalRow">
      <div class="totalLabel">${escapeHtml(t("orderDetail.total"))}</div>
      <div class="totalValue">${escapeHtml(totalText)}</div>
    </div>

    <div class="muted" style="margin-top:8px; text-align:right">
      ${escapeHtml(t("orderDetail.pricesIn", { currency })) }
    </div>
  </div>

  <div class="noPrint" style="margin-top:16px; display:flex; gap:10px;">
    <button onclick="window.print()" style="padding:10px 14px; border-radius:10px; border:1px solid #ddd; background:#111; color:#fff; font-weight:700; cursor:pointer;">
      ${escapeHtml(t("orderDetail.printOrSavePdf"))}
    </button>
    <button onclick="window.close()" style="padding:10px 14px; border-radius:10px; border:1px solid #ddd; background:#fff; color:#111; font-weight:700; cursor:pointer;">
      ${escapeHtml(t("orderDetail.close"))}
    </button>
  </div>

  <script>
    setTimeout(function () { window.print(); }, 250);
  </script>
</body>
</html>`;

    // ✅ Forma más estable: write completo
    w.document.open();
    w.document.write(html);
    w.document.close();

    // ✅ seguridad extra
    try {
      w.opener = null;
    } catch {}
  } catch (e) {
    // Si algo falla, igual pintamos algo visible
    const msg = e?.message || String(e);
    w.document.open();
    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice error</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
  <h2 style="color:#b91c1c;">Error generando factura</h2>
  <pre style="white-space:pre-wrap;background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:8px;">${escapeHtml(
    msg
  )}</pre>
  <p>Revisa la consola del navegador en la pestaña original.</p>
</body></html>`);
    w.document.close();
    // eslint-disable-next-line no-console
    console.error("Invoice error:", e);
  }
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const { t, language } = useTranslation();

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
          setErr(e?.message || t("orderDetail.errors.loadFailed"));
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  const derived = useMemo(() => {
    if (!order) return null;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsCount = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

    const totalUSD = Number(order?.totals?.amountPaid ?? 0);

    const customerName = capitalizeWords(order?.customer?.name || "");
    const customerEmail = order?.customer?.email || "—";
    const customerPhone = order?.customer?.phone || "—";

    const shippingMethodRaw = order?.shipping?.method || "—";
    const shippingMethod = capitalizeWords(String(shippingMethodRaw).replaceAll("_", " "));

    const shippingAddress =
      order?.shipping?.address && String(shippingMethodRaw).toLowerCase() !== "pickup"
        ? order.shipping.address
        : null;

    const addressLine = capitalizeWords(shippingAddress?.line1 || "");
    const addressCity = capitalizeWords(shippingAddress?.city || "");
    const addressState = capitalizeWords(shippingAddress?.state || "");
    const addressRef = shippingAddress?.reference ? capitalizeWords(shippingAddress.reference) : "";

    const createdAt = order?.createdAt || order?.updatedAt || "";
    const createdAtHuman = createdAt ? formatDateHuman(createdAt, language) : "";

    const { carrierName, trackingNumber, trackingUrl } = normalizeCarrier(order?.shipping);

    return {
      items,
      itemsCount,
      totalUSD,
      customerName: customerName || "—",
      customerEmail,
      customerPhone,
      shippingMethod,
      shippingMethodRaw,
      shippingAddress,
      addressLine: addressLine || "—",
      addressCity,
      addressState,
      addressRef,
      createdAtHuman,
      carrier: carrierName ? capitalizeWords(carrierName) : "",
      trackingNumber,
      trackingUrl,
    };
  }, [order, language]);

  const supportLinks = useMemo(() => {
    const orderShort = shortId(orderId);
    const support = buildWhatsAppLink({
      phone: WHATSAPP_SUPPORT,
      message: t("support.whatsappMessageOrder", { orderId: orderShort }),
    });
    const problem = buildWhatsAppLink({
      phone: WHATSAPP_SUPPORT,
      message: t("support.whatsappMessageProblemOrder", { orderId: orderShort }),
    });
    return { support, problem };
  }, [orderId, t]);

  const tracking = useMemo(() => {
    if (!derived) return { canTrack: false, url: "" };

    // si backend trae trackingUrl, úsalo
    if (derived.trackingUrl) return { canTrack: true, url: derived.trackingUrl };

    // fallback útil: Google con carrier + tracking
    if (derived.trackingNumber) {
      const q = encodeURIComponent(`${derived.carrier || ""} ${derived.trackingNumber}`.trim());
      return { canTrack: true, url: `https://www.google.com/search?q=${q}` };
    }

    return { canTrack: false, url: "" };
  }, [derived]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (status === "error" || !order || !derived) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
          {err || t("orderDetail.errors.loadFailed")}
        </div>
        <div className="mt-6">
          <Link to="/account" className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:underline">
            ← {t("orderDetail.backToAccount")}
          </Link>
        </div>
      </div>
    );
  }

  const statusKey = String(order.status || "").toLowerCase();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumbs & Back */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-pb-text-secondary">
          <Link to="/account" className="hover:text-orange-400 transition-colors">
            {t("orderDetail.breadcrumb.account")}
          </Link>
          <span className="text-pb-text-secondary">/</span>
          <span className="font-medium text-pb-text">
            {t("orderDetail.breadcrumb.order", { id: shortId(order.orderId) })}
          </span>
        </div>

        <Link to="/account" className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:underline">
          <span aria-hidden>←</span>
          {t("orderDetail.backToOrders")}
        </Link>
      </div>

      {/* Header card */}
      <div className="mb-8 rounded-2xl border border-pb-border bg-pb-surface p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-pb-text">
              {t("orderDetail.title", { id: shortId(order.orderId) })}
            </h1>
            <p className="mt-2 text-sm text-pb-text-secondary">
              {derived.createdAtHuman ? t("orderDetail.placedOn", { date: derived.createdAtHuman }) : "—"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/15 transition-colors"
              onClick={() => openInvoicePrint({ order, derived, t, language })}
            >
              <span aria-hidden>⬇</span>
              {t("orderDetail.invoiceBtn")}
            </button>

            <div
              className={cx(
                "inline-flex items-center justify-center rounded-xl border px-6 py-2 text-sm font-bold",
                statusBadgeClass(statusKey)
              )}
              title={String(order.status || "")}
            >
              {t(`orderDetail.status.${statusKey}`, { fallback: String(order.status || "-") })}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Customer */}
        <div className="rounded-2xl border border-pb-border bg-pb-surface p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>👤</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">{t("orderDetail.customerTitle")}</h3>
          </div>

          <div className="space-y-2">
            <p className="text-xl font-semibold text-pb-text">{derived.customerName}</p>
            <p className="text-sm text-pb-text-secondary">{derived.customerEmail}</p>
            <p className="text-sm text-pb-text-secondary">{derived.customerPhone}</p>
          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-2xl border border-pb-border bg-pb-surface p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>🚚</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">{t("orderDetail.shippingTitle")}</h3>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold text-pb-text">
              {String(derived.shippingMethodRaw).toLowerCase() === "pickup"
                ? t("orderDetail.shipping.pickup")
                : derived.shippingMethod}
            </p>

            {derived.shippingAddress ? (
              <>
                <p className="text-sm text-pb-text-secondary">{derived.addressLine}</p>
                <p className="text-sm text-pb-text-secondary">
                  {[derived.addressCity, derived.addressState].filter(Boolean).join(", ")}
                </p>
                {derived.addressRef ? <p className="text-sm text-pb-text-secondary">{derived.addressRef}</p> : null}
              </>
            ) : (
              <p className="text-sm text-pb-text-secondary">—</p>
            )}

            {(derived.carrier || derived.trackingNumber) && (
              <div className="mt-3 space-y-2 rounded-xl border border-pb-border bg-slate-100 p-3">
                {derived.carrier && (
                  <p className="text-sm text-pb-text">
                    <span className="text-pb-text-secondary text-xs font-bold uppercase mr-2">
                      {t("orderDetail.shippingCompany")}
                    </span>
                    {derived.carrier}
                  </p>
                )}

                {derived.trackingNumber && (
                  <p className="text-sm text-pb-text">
                    <span className="text-pb-text-secondary text-xs font-bold uppercase mr-2">
                      {t("orderDetail.shippingTracking")}
                    </span>
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
        <div className="rounded-2xl border border-pb-border bg-pb-surface p-6">
          <div className="mb-4 flex items-center gap-3 text-orange-300">
            <span aria-hidden>🧭</span>
            <h3 className="text-xs font-bold uppercase tracking-wider">{t("orderDetail.currentStatusTitle")}</h3>
          </div>

          {(() => {
            const shipMethod = String(order?.shipping?.method || "").toLowerCase();
            const shipStatus = String(order?.shipping?.status || "").toLowerCase();
            const isPickup = shipMethod === "pickup";

            const dispatchedAtHuman = order?.shipping?.dispatchedAt ? formatDateHuman(order.shipping.dispatchedAt, language) : "";
            const deliveredAtHuman = order?.shipping?.deliveredAt ? formatDateHuman(order.shipping.deliveredAt, language) : "";

            const isDispatched = shipStatus === "dispatched" || shipStatus === "delivered";
            const isDelivered = shipStatus === "delivered";
            const pickupDone = String(order?.status || "").toLowerCase() === "completed";

            return (
              <div className="relative space-y-4 border-l-2 border-orange-500/20 pl-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                  <p className="text-sm font-bold text-pb-text">{t("orderDetail.timeline.created")}</p>
                  <p className="text-xs text-pb-text-secondary">{derived.createdAtHuman || "—"}</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                  <p className="text-sm font-bold text-pb-text">
                    {t("orderDetail.timeline.current", {
                      status: t(`orderDetail.status.${statusKey}`, { fallback: String(order.status || "-") }),
                    })}
                  </p>
                  <p className="text-xs text-pb-text-secondary">{t("orderDetail.timeline.currentLabel")}</p>
                </div>

                {isPickup ? (
                  <div className="relative">
                    <div
                      className={cx(
                        "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                        pickupDone ? "bg-emerald-500" : "bg-slate-600"
                      )}
                    />
                    <p className={pickupDone ? "text-sm font-bold text-pb-text" : "text-sm font-bold text-pb-text-secondary"}>
                      {pickupDone ? t("orderDetail.timeline.pickupDone") : t("orderDetail.timeline.pickupReady")}
                    </p>
                    <p className={pickupDone ? "text-xs text-pb-text-secondary" : "text-xs text-pb-text-secondary"}>
                      {pickupDone ? t("orderDetail.timeline.completed") : t("orderDetail.timeline.pending")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div
                        className={cx(
                          "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                          isDispatched ? "bg-orange-500 ring-4 ring-orange-500/20" : "bg-slate-600"
                        )}
                      />
                      <p className={isDispatched ? "text-sm font-bold text-pb-text" : "text-sm font-bold text-pb-text-secondary"}>
                        {t("orderDetail.timeline.dispatched")}
                      </p>
                      <p className={isDispatched ? "text-xs text-pb-text-secondary" : "text-xs text-pb-text-secondary"}>
                        {isDispatched ? (dispatchedAtHuman || t("orderDetail.timeline.ready")) : t("orderDetail.timeline.pending")}
                      </p>
                    </div>

                    <div className="relative">
                      <div
                        className={cx(
                          "absolute -left-[31px] top-1 h-4 w-4 rounded-full",
                          isDelivered ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-slate-600"
                        )}
                      />
                      <p className={isDelivered ? "text-sm font-bold text-pb-text" : "text-sm font-bold text-pb-text-secondary"}>
                        {t("orderDetail.timeline.delivered")}
                      </p>
                      <p className={isDelivered ? "text-xs text-pb-text-secondary" : "text-xs text-pb-text-secondary"}>
                        {isDelivered ? (deliveredAtHuman || t("orderDetail.timeline.completed")) : t("orderDetail.timeline.pending")}
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
      <div className="mb-8 overflow-hidden rounded-2xl border border-pb-border bg-pb-surface">
        <div className="flex items-center justify-between border-b border-pb-border px-6 py-4">
          <h3 className="text-lg font-bold text-pb-text">{t("orderDetail.itemsTitle")}</h3>
          <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-300">
            {t("orderDetail.itemsCount", { count: derived.itemsCount })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-pb-text-secondary">
              <tr>
                <th className="px-6 py-4 font-bold">{t("orderDetail.table.product")}</th>
                <th className="px-6 py-4 text-center font-bold">{t("orderDetail.table.qty")}</th>
                <th className="px-6 py-4 text-right font-bold">{t("orderDetail.table.unitPrice")}</th>
                <th className="px-6 py-4 text-right font-bold">{t("orderDetail.table.subtotal")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {derived.items.map((it) => {
                const unit = Number(it.unitPriceUSD ?? 0);
                const line = Number(it.lineTotalUSD ?? unit * (Number(it.quantity) || 0));
                const img = getItemImageUrl(it);

                return (
                  <tr key={it.productId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl border border-pb-border bg-slate-50 overflow-hidden flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={it.name || "Product"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-pb-text-secondary text-lg" aria-hidden>
                              📦
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-pb-text">{it.name}</p>
                          <p className="text-xs text-pb-text-secondary">
                            {t("orderDetail.table.productId")}: {it.productId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-medium text-pb-text">{it.quantity}</td>
                    <td className="px-6 py-4 text-right font-medium text-pb-text">{formatMoneyUSD(unit)}</td>
                    <td className="px-6 py-4 text-right font-bold text-pb-text">{formatMoneyUSD(line)}</td>
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
          <div className="flex justify-between text-pb-text-secondary">
            <span>{t("orderDetail.total")}</span>
            <span className="font-medium text-pb-text">
              {String(order?.totals?.currency || "").toUpperCase() === "USD"
                ? formatMoneyUSD(derived.totalUSD)
                : `${order?.totals?.amountPaid ?? 0} ${order?.totals?.currency || ""}`}
            </span>
          </div>

          <div className="flex items-end justify-between border-t border-pb-border pt-3">
            <span className="text-lg font-bold uppercase tracking-tight text-pb-text">
              {t("orderDetail.totalOrder")}
            </span>
            <span className="text-3xl font-bold text-orange-400">
              {String(order?.totals?.currency || "").toUpperCase() === "USD"
                ? formatMoneyUSD(derived.totalUSD)
                : `${order?.totals?.amountPaid ?? 0} ${order?.totals?.currency || ""}`}
            </span>
          </div>

          <p className="text-right text-[10px] italic text-pb-text-secondary">
            {order?.totals?.currency ? t("orderDetail.pricesIn", { currency: order.totals.currency }) : ""}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-pb-border py-6 md:flex-row">
        <p className="text-sm text-pb-text-secondary">
          {t("orderDetail.needHelp")}{" "}
          <a className="font-bold text-orange-400 hover:underline" href={supportLinks.support} target="_blank" rel="noreferrer">
            {t("orderDetail.contactSupport")}
          </a>{" "}
          {t("orderDetail.or")}{" "}
          <a className="font-bold text-orange-400 hover:underline" href={supportLinks.problem} target="_blank" rel="noreferrer">
            {t("orderDetail.reportProblem")}
          </a>
        </p>

        <div className="flex gap-4">
          <a
            href={tracking.url || "#"}
            target="_blank"
            rel="noreferrer"
            className={cx(
              "rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors",
              tracking.canTrack ? "hover:bg-orange-500/90" : "opacity-50 pointer-events-none"
            )}
            aria-disabled={!tracking.canTrack}
          >
            {t("orderDetail.trackShipment")}
          </a>
        </div>
      </div>
    </main>
  );
}