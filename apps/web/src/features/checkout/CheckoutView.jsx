// web/src/features/checkout/CheckoutView.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCheckout,
  updateCheckoutCustomer,
  updateCheckoutShipping,
} from "./checkoutCommand";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { accountService } from "../account/accountService";

// i18n
import { useTranslation } from "../../shared/i18n/useTranslation.js";

// Payments
import { paymentService } from "../payment/paymentService";
import { savePaymentForCheckout, getPaymentForCheckout, clearPaymentForCheckout } from "../payment/paymentStorage";
import { clearCheckoutId } from "./CheckoutStorage";

const SHIPPING_METHODS = [
  { value: "pickup", icon: "store", tKey: "checkout.methods.shipping.pickup" },
  { value: "local_delivery", icon: "moped", tKey: "checkout.methods.shipping.localDelivery" },
  { value: "national_shipping", icon: "local_shipping", tKey: "checkout.methods.shipping.nationalShipping" },
];

const PAYMENT_METHODS = [
  { value: "zelle", icon: "account_balance_wallet", tKey: "checkout.methods.payment.zelle" },
  { value: "zinli", icon: "payments", tKey: "checkout.methods.payment.zinli" },
  { value: "transferencia", icon: "account_balance", tKey: "checkout.methods.payment.bankTransfer" },
  { value: "pago_movil", icon: "smartphone", tKey: "checkout.methods.payment.pagoMovil" },
];

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function isValidEmail(value) {
  const v = String(value || "").trim();
  if (v.length < 3) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function RadioCard({ checked, onClick, icon, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
        checked ? "border-orange-500 bg-black/20" : "border-white/10 bg-black/10 hover:border-orange-500/40",
      ].join(" ")}
      aria-pressed={checked}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "material-symbols-outlined text-xl",
            checked ? "text-orange-400" : "text-slate-400",
          ].join(" ")}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className={checked ? "font-bold text-slate-100" : "font-bold text-slate-200/80"}>
          {title}
        </span>
      </div>

      <span
        className={[
          "w-5 h-5 rounded-full",
          checked ? "bg-orange-500 border-4 border-orange-500" : "border-2 border-white/20",
        ].join(" ")}
        aria-hidden="true"
      />
    </button>
  );
}

function isCheckoutLockedError(e) {
  const msg = String(e?.message || "");
  // be pragmatic: backend returns "Checkout is not editable"
  return msg.toLowerCase().includes("checkout is not editable") || msg.includes("409");
}

export function CheckoutView() {
  const { t } = useTranslation();

  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const { cart, status: cartStatus, initializeCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ Last shipping address prefill
  const [savedAddress, setSavedAddress] = useState(null);
  const addressLoadedRef = useRef(false);

  // Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [reference, setReference] = useState("");

  const [shippingMethod, setShippingMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("zelle");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (cartStatus !== "idle") return;
      try {
        await initializeCart();
      } catch (e) {
        if (!cancelled) setError(e?.message || t("checkout.errors.failedToLoad"));
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartStatus]);

  // ✅ Load last shipping address for authenticated users (once)
  useEffect(() => {
    if (!isAuthenticated || addressLoadedRef.current) return;
    addressLoadedRef.current = true;

    async function loadSavedAddress() {
      try {
        const res = await accountService.getLastShippingAddress();
        const addr = res?.data ?? res;
        // Backend returns null if pickup or no address
        if (addr && addr.method && addr.method !== "pickup") {
          setSavedAddress(addr);
        }
      } catch {
        // Silently ignore - prefill is optional
      }
    }

    loadSavedAddress();
  }, [isAuthenticated]);

  /**
   * Apply the saved address to form fields
   */
  function applyLastAddress() {
    if (!savedAddress) return;

    // Set shipping method first (enables address fields)
    if (savedAddress.method) {
      setShippingMethod(savedAddress.method);
    }

    // Prefill address fields
    if (savedAddress.recipientName) setFullName(savedAddress.recipientName);
    if (savedAddress.phone) setPhone(savedAddress.phone);
    if (savedAddress.state) setStateRegion(savedAddress.state);
    if (savedAddress.city) setCity(savedAddress.city);
    if (savedAddress.line1) setStreet(savedAddress.line1);
    if (savedAddress.reference) setReference(savedAddress.reference);

    // Clear the offer after applying
    setSavedAddress(null);
  }

  const items = cart?.items || [];

  const subtotalUSD = useMemo(() => {
    const totals = cart?.totals || {};
    const fromTotals =
      totals.subtotalUSD ??
      totals.amountUSD ??
      totals.totalUSD ??
      totals.subtotal ??
      totals.total ??
      cart?.subtotalUSD ??
      cart?.amountUSD ??
      null;

    if (fromTotals != null && !Number.isNaN(Number(fromTotals))) {
      return Number(fromTotals);
    }

    return (cart?.items || []).reduce((acc, it) => {
      const price = Number(it.unitPriceUSD ?? it.priceUSD ?? it.price ?? 0);
      const qty = Number(it.quantity ?? 0);
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const taxRate = cart?.metadata?.tax?.vatRate ?? 0.16;
  const priceIncludesVAT = cart?.metadata?.tax?.priceIncludesVAT ?? true;

  const estimatedTaxesUSD = useMemo(() => {
    const sub = Number(subtotalUSD) || 0;
    if (priceIncludesVAT) return sub * (taxRate / (1 + taxRate));
    return sub * taxRate;
  }, [subtotalUSD, taxRate, priceIncludesVAT]);

  const totalUSD = useMemo(() => Number(subtotalUSD) || 0, [subtotalUSD]);

  const needsAddress = shippingMethod !== "pickup";

  const canContinue = useMemo(() => {
    const nameOk = fullName.trim().length >= 2;
    const phoneOk = phone.trim().length >= 6;
    const emailOk = isValidEmail(email);

    if (!nameOk || !phoneOk || !emailOk) return false;

    if (needsAddress) {
      const streetOk = street.trim().length >= 3;
      const cityOk = city.trim().length >= 2;
      const stateOk = stateRegion.trim().length >= 2;
      return streetOk && cityOk && stateOk;
    }

    return true;
  }, [fullName, phone, email, needsAddress, street, city, stateRegion]);

  async function recreateCheckoutAndRedirect() {
    if (!cart?.cartId) {
      throw new Error(t("checkout.errors.noCart"));
    }

    // Clean stale linkage for the old checkout
    if (checkoutId) {
      clearPaymentForCheckout(checkoutId);
    }
    clearCheckoutId();

    const res = await createCheckout({ cartId: cart.cartId });

    const newCheckoutId =
      res?.data?.checkoutId ??
      res?.checkoutId ??
      res?.data?.data?.checkoutId;

    if (!newCheckoutId) {
      throw new Error("checkoutId is missing after createCheckout");
    }

    navigate(`/checkout/${newCheckoutId}`, { replace: true });
  }

  async function onContinue() {
    if (saving) return;
    setError("");

    if (!checkoutId) return setError(t("checkout.errors.checkoutIdMissing"));
    if (!cart?.cartId) return setError(t("checkout.errors.noCart"));
    if (items.length === 0) return setError(t("checkout.errors.emptyCart"));
    if (!canContinue) return setError(t("checkout.errors.incomplete"));

    setSaving(true);
    try {
      await updateCheckoutCustomer(checkoutId, {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      await updateCheckoutShipping(checkoutId, {
        method: shippingMethod,
        address: needsAddress
          ? {
              recipientName: fullName.trim(),
              phone: phone.trim(),
              state: stateRegion.trim(),
              city: city.trim(),
              line1: street.trim(),
              reference: reference.trim() || null,
            }
          : null,
      });

      // ✅ Only reuse a stored payment if it's still valid (pending)
      const existingPaymentId = getPaymentForCheckout(checkoutId);
      if (existingPaymentId) {
        try {
          const existingPayment = await paymentService.getPayment(existingPaymentId);
          const p = existingPayment?.data?.data ?? existingPayment?.data ?? existingPayment;
          // Reuse only if pending and belongs to this checkout
          if (p?.status === "pending" && p?.checkoutId === checkoutId) {
            navigate(`/payments/${existingPaymentId}`);
            return;
          }
          // Otherwise clear stale mapping and proceed to create new payment
          clearPaymentForCheckout(checkoutId);
        } catch {
          // Payment not found or error - clear and create new
          clearPaymentForCheckout(checkoutId);
        }
      }

      const paymentRes = await paymentService.createPayment({
        checkoutId,
        method: paymentMethod,
      });

      const paymentId =
        paymentRes?.data?.paymentId ??
        paymentRes?.paymentId ??
        paymentRes?.data?.data?.paymentId;

      if (!paymentId) throw new Error(t("checkout.errors.paymentIdMissing"));

      savePaymentForCheckout(checkoutId, paymentId);
      navigate(`/payments/${paymentId}`);
    } catch (e) {
      // ✅ Key fix: if checkout got locked, recover by creating a new checkout
      if (isCheckoutLockedError(e)) {
        try {
          await recreateCheckoutAndRedirect();
          return;
        } catch (recoveryErr) {
          setError(recoveryErr?.message || "Failed to recreate checkout");
          return;
        }
      }

      setError(e?.message || "Checkout failed");
    } finally {
      setSaving(false);
    }
  }

  const ids = {
    fullName: "checkout-full-name",
    email: "checkout-email",
    phone: "checkout-phone",
    city: "checkout-city",
    street: "checkout-street",
    state: "checkout-state",
    reference: "checkout-reference",
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-10">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100"
            >
              {error}
            </div>
          )}

          {/* Shipping Information */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                1
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                {t("checkout.title.shippingInfo")}
              </h2>
            </div>

            {/* ✅ Use last address button */}
            {savedAddress && (
              <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {t("checkout.prefill.title")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {savedAddress.city}, {savedAddress.state}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applyLastAddress}
                    className="px-4 py-2 text-sm font-bold text-orange-400 border border-orange-500/40 rounded-lg hover:bg-orange-500/20 transition-colors"
                  >
                    {t("checkout.prefill.useButton")}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor={ids.fullName} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.fullName")}
                </label>
                <input
                  id={ids.fullName}
                  name="fullName"
                  autoComplete="name"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.fullName")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor={ids.email} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.email")}
                </label>
                <input
                  id={ids.email}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={ids.city} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.city")}
                </label>
                <input
                  id={ids.city}
                  name="city"
                  autoComplete="address-level2"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.city")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label htmlFor={ids.phone} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.phone")}
                </label>
                <input
                  id={ids.phone}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.phone")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor={ids.street} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.street")}
                </label>
                <input
                  id={ids.street}
                  name="street"
                  autoComplete="address-line1"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.street")}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label htmlFor={ids.state} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.state")}
                </label>
                <input
                  id={ids.state}
                  name="state"
                  autoComplete="address-level1"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.state")}
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label htmlFor={ids.reference} className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  {t("checkout.form.reference")}
                </label>
                <input
                  id={ids.reference}
                  name="reference"
                  autoComplete="off"
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder={t("checkout.placeholders.reference")}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>
            </div>

            {!needsAddress && (
              <p className="mt-3 text-sm text-slate-400">
                {t("checkout.form.pickupHint")}
              </p>
            )}
          </section>

          <hr className="border-orange-500/10" />

          {/* Shipping + Payment */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                    2
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                    {t("checkout.title.deliveryType")}
                  </h2>
                </div>

                <div className="space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                  {SHIPPING_METHODS.map((m) => (
                    <RadioCard
                      key={m.value}
                      checked={shippingMethod === m.value}
                      icon={m.icon}
                      title={t(m.tKey)}
                      onClick={() => setShippingMethod(m.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                    3
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                    {t("checkout.title.paymentMethod")}
                  </h2>
                </div>

                <div className="space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                  {PAYMENT_METHODS.map((m) => (
                    <RadioCard
                      key={m.value}
                      checked={paymentMethod === m.value}
                      icon={m.icon}
                      title={t(m.tKey)}
                      onClick={() => setPaymentMethod(m.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8">
              <h3 className="mb-6 text-xl font-bold text-slate-100">
                {t("checkout.title.orderSummary")}
              </h3>

              {items.length === 0 ? (
                <p className="text-slate-400">{t("checkout.summary.emptyCart")}</p>
              ) : (
                <div className="space-y-4">
                  {items.map((it) => {
                    const unit = Number(it.unitPriceUSD ?? it.priceUSD ?? 0);
                    const qty = Number(it.quantity ?? 0);
                    const lineTotal = unit * qty;

                    return (
                      <div key={it.productId} className="flex gap-4">
                        {/* Product image */}
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name || "Product"}
                            className="h-16 w-16 rounded-lg border border-white/10 bg-black/30 object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg border border-white/10 bg-black/30 flex items-center justify-center text-slate-500 text-xs">
                            📦
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-center">
                          <h4 className="font-bold text-slate-100">{it.name}</h4>
                          <p className="text-sm text-slate-400">
                            {t("checkout.summary.qty", { qty })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <span className="font-bold text-orange-400">
                            {formatUSD(lineTotal)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatUSD(unit)} × {qty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 space-y-4 border-t border-orange-500/10 pt-6 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">{t("checkout.summary.subtotal")}</span>
                  <span className="font-medium">{formatUSD(subtotalUSD)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">{t("checkout.summary.shipping")}</span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                    {shippingMethod === "pickup" ? t("checkout.summary.free") : t("checkout.summary.tbd")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">{t("checkout.summary.estimatedTaxes")}</span>
                  <span className="font-medium">{formatUSD(estimatedTaxesUSD)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-orange-500/10 pt-4">
                  <span className="text-xl font-bold tracking-tight text-slate-100">
                    {t("checkout.summary.total")}
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-orange-400">
                    {formatUSD(totalUSD)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={saving || !canContinue}
                onClick={onContinue}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-bold text-white transition-all hover:bg-orange-500/90 disabled:opacity-60"
              >
                {saving ? t("checkout.actions.processing") : t("checkout.actions.continueToPayment")}
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}