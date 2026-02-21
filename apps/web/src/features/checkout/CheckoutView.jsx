// web/src/features/checkout/CheckoutView.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateCheckoutCustomer, updateCheckoutShipping } from "./checkoutCommand";
import { useCart } from "../../context/CartContext.jsx";

// ✅ Payments
import { paymentService } from "../payment/paymentService";
import { savePaymentForCheckout, getPaymentForCheckout } from "../payment/paymentStorage";

const SHIPPING_METHODS = [
  { value: "pickup", title: "Retiro en tienda / Pickup", icon: "store" },
  { value: "local_delivery", title: "Delivery", icon: "moped" },
  { value: "national_shipping", title: "Envío nacional", icon: "local_shipping" },
];

const PAYMENT_METHODS = [
  { value: "zelle", title: "Zelle", icon: "account_balance_wallet" },
  { value: "zinli", title: "Zinli", icon: "payments" },
  { value: "transferencia", title: "Transferencia Bancaria", icon: "account_balance" },
  { value: "pago_movil", title: "Pago Móvil", icon: "smartphone" },
];

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
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
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "material-symbols-outlined text-xl",
            checked ? "text-orange-400" : "text-slate-400",
          ].join(" ")}
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
      />
    </button>
  );
}

export function CheckoutView() {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const { cart, status: cartStatus, initializeCart } = useCart();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  // --- Load cart/checkout (and show alert on failure) ---
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (cartStatus !== "idle") return;
      try {
        await initializeCart();
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load checkout");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartStatus]);

  // --- Derived cart data ---
  const items = cart?.items || [];

  // ✅ robust subtotal (supports different shapes + fallback)
  const subtotalUSD = useMemo(() => {
    const t = cart?.totals || {};

    const fromTotals =
      t.subtotalUSD ??
      t.amountUSD ??
      t.totalUSD ??
      t.subtotal ??
      t.total ??
      cart?.subtotalUSD ??
      cart?.amountUSD ??
      null;

    if (fromTotals != null && !Number.isNaN(Number(fromTotals))) {
      return Number(fromTotals);
    }

    // Fallback: sum items
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
    if (priceIncludesVAT) {
      // VAT portion = sub * (rate / (1+rate))
      return sub * (taxRate / (1 + taxRate));
    }
    return sub * taxRate;
  }, [subtotalUSD, taxRate, priceIncludesVAT]);

  const totalUSD = useMemo(() => {
    // hoy tu total = subtotal (sin shipping real)
    return Number(subtotalUSD) || 0;
  }, [subtotalUSD]);

  const needsAddress = shippingMethod !== "pickup";

  const canContinue = useMemo(() => {
    const nameOk = fullName.trim().length >= 2;
    const phoneOk = phone.trim().length >= 6;
    const emailOk = email.trim().length >= 3;

    if (!nameOk || !phoneOk || !emailOk) return false;

    if (needsAddress) {
      const streetOk = street.trim().length >= 3;
      const cityOk = city.trim().length >= 2;
      const stateOk = stateRegion.trim().length >= 2;
      return streetOk && cityOk && stateOk;
    }

    return true;
  }, [fullName, phone, email, needsAddress, street, city, stateRegion]);

  async function onContinue() {
    if (saving) return;
    setError("");

    if (!checkoutId) return setError("checkoutId missing in URL.");
    if (!cart?.cartId) return setError("No cart found. Please add items first.");
    if (items.length === 0) return setError("Your cart is empty.");
    if (!canContinue) return setError("Completa tus datos para continuar.");

    setSaving(true);
    try {
      // 1) Customer
      await updateCheckoutCustomer(checkoutId, {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      // 2) Shipping
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

      // 3) Payment
      const existingPaymentId = getPaymentForCheckout(checkoutId);
      if (existingPaymentId) {
        navigate(`/payments/${existingPaymentId}`);
        return;
      }

      const paymentRes = await paymentService.createPayment({
        checkoutId,
        method: paymentMethod,
      });

      const paymentId =
        paymentRes?.data?.paymentId ??
        paymentRes?.paymentId ??
        paymentRes?.data?.data?.paymentId;

      if (!paymentId) throw new Error("No paymentId returned from /api/payments");

      savePaymentForCheckout(checkoutId, paymentId);
      navigate(`/payments/${paymentId}`);
    } catch (e) {
      setError(e?.message || "Checkout failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left: Form */}
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
                Shipping Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  Full Name
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="Alexander Wright"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  Email
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  City
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="Caracas"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  Phone Number
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="+58 414 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  Street Address
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="Av Principal, Casa #1"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  State
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="Carabobo"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300/80">
                  Reference (optional)
                </label>
                <input
                  className="w-full rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="Near the park"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={!needsAddress}
                />
              </div>
            </div>

            {!needsAddress && (
              <p className="mt-3 text-sm text-slate-400">
                Para <b>Pickup</b> no se requiere dirección completa.
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
                    Tipo de Entrega
                  </h2>
                </div>

                <div className="space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                  {SHIPPING_METHODS.map((m) => (
                    <RadioCard
                      key={m.value}
                      checked={shippingMethod === m.value}
                      icon={m.icon}
                      title={m.title}
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
                    Método de Pago
                  </h2>
                </div>

                <div className="space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                  {PAYMENT_METHODS.map((m) => (
                    <RadioCard
                      key={m.value}
                      checked={paymentMethod === m.value}
                      icon={m.icon}
                      title={m.title}
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
              <h3 className="mb-6 text-xl font-bold text-slate-100">Order Summary</h3>

              {items.length === 0 ? (
                <p className="text-slate-400">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((it) => (
                    <div key={it.productId} className="flex gap-4">
                      <div className="h-16 w-16 rounded-lg border border-white/10 bg-black/30" />
                      <div className="flex flex-1 flex-col justify-center">
                        <h4 className="font-bold text-slate-100">{it.name}</h4>
                        <p className="text-sm text-slate-400">Qty: {it.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className="font-bold text-orange-400">
                          {formatUSD(it.unitPriceUSD ?? it.priceUSD ?? 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 space-y-4 border-t border-orange-500/10 pt-6 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">Subtotal</span>
                  <span className="font-medium">{formatUSD(subtotalUSD)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">Shipping</span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                    {shippingMethod === "pickup" ? "FREE" : "TBD"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="opacity-70">Estimated Taxes</span>
                  <span className="font-medium">{formatUSD(estimatedTaxesUSD)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-orange-500/10 pt-4">
                  <span className="text-xl font-bold tracking-tight text-slate-100">Total</span>
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
                {saving ? "Procesando..." : "Continuar con el pago"}
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400/60">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Secure Payment
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400/60">
                  <span className="material-symbols-outlined text-sm">assignment_return</span>
                  30-Day Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}