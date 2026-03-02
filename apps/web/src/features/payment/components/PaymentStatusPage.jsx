// web/src/features/payment/components/PaymentStatusPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { paymentService } from "../paymentService";
import { clearCheckoutId } from "../../checkout/CheckoutStorage";
import { clearAllPaymentsForCheckouts } from "../paymentStorage";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutById } from "../../checkout/checkoutQuery";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

function unwrapApiResponse(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export function PaymentStatusPage() {
  const { t } = useTranslation();
  const { paymentId } = useParams();
  const nav = useNavigate();
  const { startNewCart } = useCart();

  const [payment, setPayment] = useState(null);
  const [checkout, setCheckout] = useState(null);

  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const status = payment?.status;
  const didCreateNewCartRef = useRef(false);

  // Helper: Get method label via i18n
  function methodLabel(method) {
    const key = `payment.methods.${method}`;
    const translated = t(key);
    return translated !== key ? translated : method;
  }

  // Helper: Get payment instructions via i18n
  function getInstructions(method) {
    if (!method) return null;
    return {
      title: t("payment.instructions.title"),
      subtitle: t(`payment.instructions.${method}.subtitle`),
      receiverLabel: t(`payment.instructions.${method}.receiverLabel`),
      receiverValue: t(`payment.instructions.${method}.receiverValue`),
      note: t(`payment.instructions.${method}.note`),
    };
  }

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

    const pollTimer = setInterval(() => {
      load().catch(() => {});
    }, 3000);

    return () => clearInterval(pollTimer);
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
    return getInstructions(payment.method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      let proofUrl = null;

      // Step 1: Upload file to Cloudinary if present
      if (proofFile) {
        setUploading(true);
        const uploadResult = await paymentService.uploadProof(proofFile);
        proofUrl = uploadResult?.url || null;
        setUploading(false);
      }

      // Step 2: Submit payment with reference + proofUrl
      const updatedRes = await paymentService.submitPayment({ paymentId, reference, proofUrl });
      const updated = unwrapApiResponse(updatedRes);
      setPayment(updated);

      if ((updated?.status === "submitted" || updated?.status === "confirmed") && !didCreateNewCartRef.current) {
        didCreateNewCartRef.current = true;
        await startNewCart();
      }
    } catch (e) {
      setUploading(false);
      setErr(e?.message || t("payment.errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  // ✅ File handling
  function handleFileSelect(file) {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErr(t("payment.errors.invalidFileType"));
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErr(t("payment.errors.fileTooLarge"));
      return;
    }

    setErr("");
    setProofFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Form validation: both reference AND file are required
  const canSubmit = reference.trim().length > 0 && proofFile !== null && !loading;

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!payment) return <p className="p-8 text-white/60">{err || t("payment.loading")}</p>;

  const orderIdText = payment.orderId ? `#${payment.orderId}` : `#${payment.checkoutId || "—"}`;

  return (
    <section className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-10 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 space-y-8">
            {/* Breadcrumb / Back */}
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Link className="hover:text-orange-400 transition-colors" to="/cart">
                {t("payment.breadcrumb.cart")}
              </Link>
              <span className="text-white/30">›</span>
              {payment?.checkoutId && status === "pending" ? (
                <Link
                  className="flex items-center gap-1 hover:text-orange-400 transition-colors"
                  to={`/checkout/${payment.checkoutId}`}
                >
                  ← {t("payment.breadcrumb.backToCheckout")}
                </Link>
              ) : (
                <span className="text-white/30">{t("payment.breadcrumb.checkoutLocked")}</span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">{t("payment.title")}</h1>
              <p className="text-white/60">{t("payment.subtitle")}</p>
            </div>

            {/* Status card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">{t("payment.status.orderId")}</p>
                <p className="text-lg font-medium">{orderIdText}</p>
              </div>

              <div className="space-y-1 md:border-l md:pl-6 border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">{t("payment.status.method")}</p>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">💳</span>
                  <p className="text-lg font-medium">{methodLabel(payment.method)}</p>
                </div>
              </div>

              <div className="space-y-1 md:border-l md:pl-6 border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 font-bold">{t("payment.status.totalToPay")}</p>
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
                    {copied ? t("payment.instructions.copied") : t("payment.instructions.copy")}
                  </button>
                </div>

                <p className="text-xs text-orange-200/80 italic font-medium">
                  * {t("payment.instructions.important")}: {instructions.note}
                </p>
              </div>
            )}

            {/* Proof Section */}
            <div className="space-y-6 bg-white/5 border border-white/10 rounded-xl p-6 lg:p-8">
              <h3 className="text-xl font-bold flex items-center gap-2">🧾 {t("payment.proof.title")}</h3>

              {err && (
                <p className="text-red-300" role="alert">
                  {err}
                </p>
              )}

              {status === "pending" && (
                <div className="space-y-6">
                  {/* Reference input - REQUIRED */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      {t("payment.proof.referenceLabel")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none transition-all placeholder:text-white/20"
                      placeholder={t("payment.proof.referencePlaceholder")}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      aria-required="true"
                    />
                  </div>

                  {/* File upload - REQUIRED */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/70">
                      {t("payment.proof.fileLabel")} <span className="text-red-400">*</span>
                    </label>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = "";
                      }}
                      aria-label={t("payment.proof.fileLabel")}
                    />

                    {/* Dropzone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={preventDefaults}
                      onDragEnter={preventDefaults}
                      onDragLeave={preventDefaults}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${
                        proofFile
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-white/10 bg-black/20 hover:border-orange-500/50"
                      }`}
                    >
                      {uploading ? (
                        <p className="text-sm text-orange-400">{t("payment.proof.uploading")}</p>
                      ) : proofFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl text-green-400">✅</span>
                          <p className="text-sm text-white/80 font-medium">{proofFile.name}</p>
                          <p className="text-xs text-white/40">
                            {(proofFile.size / 1024).toFixed(1)} KB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProofFile(null);
                            }}
                            className="text-xs text-red-400 hover:text-red-300 mt-1"
                          >
                            {t("payment.proof.removeFile")}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-4xl text-white/20 group-hover:text-orange-400 transition-colors">☁️</div>
                          <p className="mt-2 text-sm text-white/60">{t("payment.proof.dropOrClick")}</p>
                          <p className="text-xs text-white/30 mt-1">{t("payment.proof.fileHint")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Validation message */}
                  {!canSubmit && (reference.trim() || proofFile) && (
                    <p className="text-xs text-orange-200/80">
                      {!reference.trim() && !proofFile
                        ? t("payment.proof.bothRequired")
                        : !reference.trim()
                          ? t("payment.proof.referenceRequired")
                          : t("payment.proof.fileRequired")}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={onSubmitProof}
                    disabled={!canSubmit}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                  >
                    {loading
                      ? uploading
                        ? t("payment.proof.uploading")
                        : t("payment.proof.sending")
                      : t("payment.proof.submitButton")}
                  </button>
                </div>
              )}

              {status === "submitted" && (
                <div className="space-y-3">
                  <p className="text-white/70">{t("payment.submitted.message")}</p>
                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {t("payment.actions.continueShopping")}
                  </button>
                </div>
              )}

              {status === "confirmed" && (
                <div className="space-y-3">
                  <p className="text-green-300 font-semibold">{t("payment.confirmed.message")}</p>
                  {payment.orderId && (
                    <Link className="text-orange-400 hover:underline" to={`/orders/${payment.orderId}`}>
                      {t("payment.confirmed.viewOrder")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {t("payment.actions.continueShopping")}
                  </button>
                </div>
              )}

              {status === "rejected" && (
                <div className="space-y-3">
                  <p className="text-red-300">
                    {t("payment.rejected.message")}: {payment.review?.reason || t("payment.rejected.noReason")}
                  </p>

                  <button
                    type="button"
                    onClick={() => nav(`/checkout/${payment.checkoutId}`)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {t("payment.actions.backToCheckout")}
                  </button>

                  <button
                    type="button"
                    onClick={continueShopping}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    {t("payment.actions.continueShopping")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-28">
              <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-4">{t("payment.summary.title")}</h4>

              {!checkout ? (
                <p className="text-sm text-white/50">{t("payment.summary.loading")}</p>
              ) : (
                <>
                  {/* Show in VES if payment currency is VES */}
                  {(() => {
                    const isVES = payment?.currency === "VES";
                    const rate = isVES && payment?.amount && checkout?.totals?.subtotalUSD
                      ? payment.amount / checkout.totals.subtotalUSD
                      : null;

                    return (
                      <>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                          {(checkout.items || []).map((it) => {
                            const unit = Number(it.unitPriceUSD ?? 0);
                            const qty = Number(it.quantity ?? 0);
                            const lineTotal = unit * qty;
                            const lineTotalDisplay = isVES && rate
                              ? `Bs. ${(lineTotal * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `$${lineTotal.toFixed(2)}`;

                            return (
                              <div key={it.productId} className="flex gap-3">
                                <div className="h-12 w-12 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                                  {it.imageUrl ? (
                                    <img
                                      src={it.imageUrl}
                                      alt={it.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.parentElement.textContent = "📦";
                                      }}
                                    />
                                  ) : (
                                    "📦"
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{it.name}</p>
                                  <p className="text-xs text-white/40">{t("payment.summary.qty")}: {qty}</p>
                                  <p className="text-sm font-bold mt-1">{lineTotalDisplay}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <div className="flex justify-between text-sm text-white/60">
                            <span>{t("payment.summary.subtotal")}</span>
                            <span>
                              {isVES && rate
                                ? `Bs. ${(Number(checkout.totals?.subtotalUSD || 0) * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `$${Number(checkout.totals?.subtotalUSD || 0).toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-white/60">
                            <span>{t("payment.summary.shipping")}</span>
                            <span className="text-green-400 font-medium">{t("payment.summary.free")}</span>
                          </div>
                          <div className="flex justify-between text-xl font-bold pt-2 text-white">
                            <span>{t("payment.summary.total")}</span>
                            <span className="text-orange-400">
                              {isVES
                                ? `Bs. ${Number(payment.amount).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `$${Number(checkout.totals?.subtotalUSD || 0).toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              <div className="mt-8 bg-white/5 rounded-lg p-3 flex items-center gap-3">
                <span className="text-orange-400/80">🛡️</span>
                <p className="text-[10px] text-white/40 leading-tight uppercase font-bold tracking-widest">
                  {t("payment.trust")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}