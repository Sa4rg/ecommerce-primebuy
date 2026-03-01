// web/src/features/payment/components/PaymentStatusPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { paymentService } from "../paymentService";
import { clearCheckoutId } from "../../checkout/CheckoutStorage";
import { clearAllPaymentsForCheckouts } from "../paymentStorage";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutById } from "../../checkout/checkoutQuery"; // ajusta ruta real

function unwrapApiResponse(res) {
  // supports: axios-like { data: { success, data } } or { data } or plain object
  return res?.data?.data ?? res?.data ?? res;
}

function methodLabel(method) {
  if (method === "zelle") return "Zelle";
  if (method === "zinli") return "Zinli";
  if (method === "pago_movil") return "Pago Móvil";
  if (method === "bank_transfer") return "Transferencia Bancaria";
  return method;
}

function instructionsByMethod(method) {
  if (method === "zelle") {
    return {
      title: "Instrucciones de Pago",
      subtitle: "Realiza tu pago vía Zelle con los siguientes datos:",
      receiverLabel: "Correo del Receptor",
      receiverValue: "payments@tienda.com",
      note: "Incluye el ID del pedido en la nota de la transferencia.",
    };
  }
  if (method === "zinli") {
    return {
      title: "Instrucciones de Pago",
      subtitle: "Realiza tu pago vía Zinli con los siguientes datos:",
      receiverLabel: "Cuenta / Correo",
      receiverValue: "payments@tienda.com",
      note: "Incluye el ID del pedido en la nota.",
    };
  }
  if (method === "pago_movil") {
    return {
      title: "Instrucciones de Pago",
      subtitle: "Realiza tu Pago Móvil con los siguientes datos:",
      receiverLabel: "Datos",
      receiverValue: "Banco 0102, CI..., Tel...",
      note: "Incluye el ID del pedido en la referencia.",
    };
  }
  if (method === "bank_transfer") {
    return {
      title: "Instrucciones de Pago",
      subtitle: "Realiza tu transferencia con los siguientes datos:",
      receiverLabel: "Cuenta",
      receiverValue: "Cuenta: 0102-... Titular: ...",
      note: "Incluye el ID del pedido en la referencia.",
    };
  }
  return null;
}

export function PaymentStatusPage() {
  const { paymentId } = useParams();
  const nav = useNavigate();
  const { startNewCart } = useCart();

  const [payment, setPayment] = useState(null);
  const [checkout, setCheckout] = useState(null);

  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const status = payment?.status;
  const didCreateNewCartRef = useRef(false);

  async function load() {
    // 1) payment
    const paymentRes = await paymentService.getPayment(paymentId);
    const p = unwrapApiResponse(paymentRes);
    setPayment(p);

    // 2) checkout snapshot for sidebar
    if (p?.checkoutId) {
      try {
        const checkoutRes = await getCheckoutById(p.checkoutId);
        const c = unwrapApiResponse(checkoutRes);
        setCheckout(c);
      } catch {
        // don't block page if summary fails
        setCheckout(null);
      }
    } else {
      setCheckout(null);
    }

    return p;
  }

  useEffect(() => {
    setErr("");
    didCreateNewCartRef.current = false;

    load().catch((e) => setErr(e?.message || "Failed to load payment"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  useEffect(() => {
    if (!status) return;
    if (!["pending", "submitted"].includes(status)) return;

    const t = setInterval(() => {
      load().catch(() => {});
    }, 3000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]);

  // ✅ Business rule:
  // Start a new cart ONLY after proof is submitted (SUBMITTED) or confirmed.
  useEffect(() => {
    if (!status) return;

    if ((status === "submitted" || status === "confirmed") && !didCreateNewCartRef.current) {
      didCreateNewCartRef.current = true;
      startNewCart().catch(() => {});
    }
  }, [status, startNewCart]);

  const instructions = useMemo(() => {
    if (!payment) return null;
    return instructionsByMethod(payment.method);
  }, [payment]);

  async function continueShopping() {
    try {
      // ✅ reset local persistence so next purchase doesn't reuse old payment/checkout
      clearCheckoutId();
      clearAllPaymentsForCheckouts();

      await startNewCart();
    } catch {}
    nav("/", { replace: true });
  }

  async function onSubmitProof() {
    setErr("");
    setLoading(true);

    try {
      const updatedRes = await paymentService.submitPayment({ paymentId, reference });
      const updated = unwrapApiResponse(updatedRes);
      setPayment(updated);

      if ((updated?.status === "submitted" || updated?.status === "confirmed") && !didCreateNewCartRef.current) {
        didCreateNewCartRef.current = true;
        await startNewCart();
      }
    } catch (e) {
      setErr(e?.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!payment) return <p>{err ? err : "Loading..."}</p>;

  const orderIdText = payment.orderId ? `#${payment.orderId}` : `#${payment.checkoutId || "—"}`;

  return (
    <section className="min-h-screen bg-[#0f0a06] text-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-10 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 space-y-8">
            {/* Breadcrumb / Back */}
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Link className="hover:text-orange-400 transition-colors" to="/cart">
                Carrito
              </Link>
              <span className="text-white/30">›</span>
              {payment?.checkoutId && status === "pending" ? (
                <Link
                  className="flex items-center gap-1 hover:text-orange-400 transition-colors"
                  to={`/checkout/${payment.checkoutId}`}
                >
                  ← Volver al checkout
                </Link>
              ) : (
                <span className="text-white/30">Checkout bloqueado</span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Confirmación de Pago</h1>
              <p className="text-white/60">Por favor, completa tu transferencia para finalizar el pedido.</p>
            </div>

            {/* Status card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">ID del Pedido</p>
                <p className="text-lg font-medium">{orderIdText}</p>
              </div>

              <div className="space-y-1 md:border-l md:pl-6 border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">Método Seleccionado</p>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">💳</span>
                  <p className="text-lg font-medium">{methodLabel(payment.method)}</p>
                </div>
              </div>

              <div className="space-y-1 md:border-l md:pl-6 border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">Total a Pagar</p>
                <p className="text-2xl font-bold text-orange-400">
                  {payment.amount} {payment.currency}
                </p>
              </div>
            </div>

            {/* Instructions */}
            {instructions && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                    <span className="text-white">i</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{instructions.title}</h3>
                    <p className="text-sm text-white/70">{instructions.subtitle}</p>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white/40 font-bold uppercase">{instructions.receiverLabel}</p>
                    <p className="text-lg font-mono">{instructions.receiverValue}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(instructions.receiverValue)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all border border-white/5 active:scale-95"
                  >
                    {copied ? "Copiado ✅" : "📋 Copiar"}
                  </button>
                </div>

                <p className="text-xs text-orange-200/80 italic font-medium">
                  * Importante: {instructions.note}
                </p>
              </div>
            )}

            {/* Proof */}
            <div className="space-y-6 bg-white/5 border border-white/10 rounded-xl p-6 lg:p-8">
              <h3 className="text-xl font-bold flex items-center gap-2">🧾 Enviar Comprobante</h3>

              {err && (
                <p className="text-red-300" role="alert">
                  {err}
                </p>
              )}

              {status === "pending" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Número de Referencia</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none transition-all placeholder:text-white/20"
                      placeholder="Ej: 123456789"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>

                  {/* Upload opcional (UI listo, backend luego) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">Comprobante de Pago (Opcional)</label>
                    <label className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer group bg-black/20 block">
                      <div className="text-4xl text-white/20 group-hover:text-orange-400 transition-colors">☁️</div>
                      <p className="mt-2 text-sm text-white/60">Arrastra tu captura de pantalla o haz clic para subir</p>
                      <p className="text-xs text-white/30 mt-1">PNG, JPG hasta 5MB</p>
                      <input type="file" className="hidden" />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={onSubmitProof}
                    disabled={loading || !reference.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                  >
                    {loading ? "Enviando..." : "Enviar comprobante y finalizar compra"} ✅
                  </button>
                </div>
              )}

              {status === "submitted" && (
                <div className="space-y-3">
                  <p className="text-white/70">Comprobante enviado. Esperando confirmación del admin…</p>
                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Continuar comprando
                  </button>
                </div>
              )}

              {status === "confirmed" && (
                <div className="space-y-3">
                  <p className="text-green-300 font-semibold">¡Pago confirmado!</p>
                  {payment.orderId && (
                    <Link className="text-orange-400 hover:underline" to={`/orders/${payment.orderId}`}>
                      Ver tu orden
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Continuar comprando
                  </button>
                </div>
              )}

              {status === "rejected" && (
                <div className="space-y-3">
                  <p className="text-red-300">Rechazado: {payment.review?.reason || "Sin razón especificada"}</p>

                  <button
                    type="button"
                    onClick={() => nav(`/checkout/${payment.checkoutId}`)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Volver al checkout
                  </button>

                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Continuar comprando
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-28">
              <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-4">Resumen del Pedido</h4>

              {!checkout ? (
                <p className="text-sm text-white/50">Cargando resumen…</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {(checkout.items || []).map((it) => {
                      const unit = Number(it.unitPriceUSD ?? 0);
                      const qty = Number(it.quantity ?? 0);
                      const lineTotal = unit * qty;

                      return (
                        <div key={it.productId} className="flex gap-3">
                          <div className="h-12 w-12 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                            📦
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{it.name}</p>
                            <p className="text-xs text-white/40">Cantidad: {qty}</p>
                            <p className="text-sm font-bold mt-1">${lineTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Subtotal</span>
                      <span>${Number(checkout.totals?.subtotalUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/60">
                      <span>Envío</span>
                      <span className="text-green-400 font-medium">Gratis</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 text-white">
                      <span>Total</span>
                      <span className="text-orange-400">${Number(checkout.totals?.subtotalUSD || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-8 bg-white/5 rounded-lg p-3 flex items-center gap-3">
                <span className="text-orange-400/80">🛡️</span>
                <p className="text-[10px] text-white/40 leading-tight uppercase font-bold tracking-widest">
                  Pago 100% Seguro & Verificado
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}