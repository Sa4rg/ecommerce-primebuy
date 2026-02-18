import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { getCheckoutById } from "./checkoutQuery";
import { updateCheckoutCustomer, updateCheckoutShipping } from "./checkoutCommand";
import { CheckoutLayout } from "./components/CheckoutLayout.jsx";
import { OrderSummaryCard } from "./components/OrderSummaryCard.jsx";
import { paymentService } from "../payment/paymentService"; // ajusta ruta real
import { getPaymentForCheckout, savePaymentForCheckout } from "../payment/paymentStorage"; // ajusta ruta real

function emptyDeliveryAddress() {
  return {
    recipientName: "",
    phone: "",
    state: "",
    city: "",
    line1: "",
    reference: "",
  };
}

function isNonEmpty(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function Field({ id, label, value, onChangeValue, type = "text", placeholder, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="block text-sm font-medium mb-1.5 opacity-70">
        {label}
      </label>
      <input
        id={id}
        name={id}
        disabled={disabled}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-orange-500/5 border border-orange-500/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500/40 focus:border-transparent transition-all outline-none disabled:opacity-60"
      />
    </div>
  );
}

function PaymentOption({ value, label, selected, onSelect }) {
  return (
    <label
      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
        selected ? "border-orange-500 bg-[#0f0a06]/30" : "border-orange-500/10 bg-[#0f0a06]/10 hover:border-orange-500/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${selected ? "opacity-100" : "opacity-70"} font-bold`}>{label}</span>
      </div>
      <div
        className={`w-5 h-5 rounded-full ${
          selected ? "border-4 border-orange-500 bg-orange-500" : "border-2 border-orange-500/20"
        }`}
      />
      <input
        className="hidden"
        type="radio"
        name="payment_method"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
      />
    </label>
  );
}

export function CheckoutView() {
  const { itemsCount } = useCart();
  const { checkoutId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);

  const [form, setForm] = useState({
    customer: { name: "", email: "", phone: "" },
    shipping: { method: "delivery", address: emptyDeliveryAddress() },
    payment: { method: "zelle" },
  });

  const [dirty, setDirty] = useState(false);
  const [dirtyWarning, setDirtyWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        const data = await getCheckoutById(checkoutId);
        if (cancelled) return;

        const customer = data?.customer ?? { name: "", email: "", phone: "" };

        const shippingFromApi = data?.shipping ?? { method: "delivery", address: null };

        // ✅ NORMALIZA address SIEMPRE (aunque venga parcial)
        const normalizedAddress = {
        ...emptyDeliveryAddress(),
        ...(shippingFromApi.address || {}),
        };

        const nextForm = {
        customer,
        shipping: {
            method: shippingFromApi.method || "delivery",
            address: normalizedAddress,
        },
        payment: { method: "zelle" },
        };

        setCheckout(data);
        setForm(nextForm);

        setDirty(false);
        setDirtyWarning("");
        setSaved(false);
        setSaveError("");

        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Unknown error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [checkoutId]);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const blockedReason = useMemo(() => {
    if (saving) return "Saving...";
    if (dirty) return "Please save your information first.";
    return "";
  }, [saving, dirty]);

  function markDirty() {
    setSaved(false);
    setDirty(true);
    setDirtyWarning("Unsaved changes. Please save to continue.");
    setSaveError("");
  }

  function onChangeCustomer(key, value) {
    setForm((f) => ({ ...f, customer: { ...f.customer, [key]: value } }));
    markDirty();
  }

  function onChangeShippingAddress(key, value) {
    setForm((f) => ({
      ...f,
      shipping: {
        ...f.shipping,
        address: { ...(f.shipping.address || emptyDeliveryAddress()), [key]: value },
      },
    }));
    markDirty();
  }

  function onChangePaymentMethod(value) {
    setForm((f) => ({ ...f, payment: { method: value } }));
    markDirty();
  }

  async function onSave() {
    if (saving) return;

    const a = form.shipping.address || {};
    const missing =
      !isNonEmpty(form.customer.name) ||
      !isNonEmpty(a.line1) ||
      !isNonEmpty(a.city) ||
      !isNonEmpty(a.state) ||
      !isNonEmpty(form.customer.phone);

    if (missing) {
      setSaveError("Please complete shipping address");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      setSaved(false);

      const updatedCustomer = await updateCheckoutCustomer(checkoutId, {
        name: form.customer.name,
        email: form.customer.email,
        phone: form.customer.phone,
      });

       const shippingPayload = {
        method: "delivery",
        address: {
          ...(form.shipping.address || emptyDeliveryAddress()),
          recipientName: (form.shipping.address?.recipientName || form.customer.name || "").trim(),
          phone: (form.shipping.address?.phone || form.customer.phone || "").trim(),
        },
      };

      const updatedShipping = await updateCheckoutShipping(checkoutId, shippingPayload);

      const committed = {
        customer: updatedCustomer?.customer ?? form.customer,
        shipping: updatedShipping?.shipping ?? form.shipping,
        payment: form.payment,
      };

      setForm(committed);
      setCheckout((prev) => ({
        ...(prev || {}),
        customer: committed.customer,
        shipping: committed.shipping,
      }));

      setDirty(false);
      setDirtyWarning("");
      setSaved(true);
    } catch (err) {
      setSaveError(err?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleProceedToPayment(id) {
    if (saving || dirty) return;
    const existing = getPaymentForCheckout(id);
    if (existing) return navigate(`/payments/${existing}`);

    try {
        const method = form.payment.method; // zelle | zinli | pago_movil | bank_transfer
        const payment = await paymentService.createPayment({ checkoutId: id, method });
        savePaymentForCheckout(id, payment.paymentId);
        navigate(`/payments/${payment.paymentId}`);
    } catch (e) {
        // aquí puedes mostrar un toast o setear error local
        console.error(e);
    }
  }

  return (
    <section className="min-h-screen bg-[#0f0a06]">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Cart ({itemsCount})</div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>🔒</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-slate-400">Loading checkout...</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <div className="mb-3 text-3xl">⚠️</div>
          <p className="font-semibold text-white">Something went wrong</p>
          <p className="mt-2 text-sm text-slate-300" role="alert">
            {error}
          </p>
        </div>
      )}

      {status === "success" && checkout && (
        <CheckoutLayout
          left={
            <div className="space-y-10">
                <section className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    1
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Shipping Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field
                      id="name"
                      label="Name"
                      value={form.customer.name}
                      onChangeValue={(v) => onChangeCustomer("name", v)}
                      placeholder="Alexander Wright"
                      disabled={saving}
                    />
            </div>

            <div className="md:col-span-2">
                    <Field
                      id="email"
                      label="Email"
                      value={form.customer.email}
                      onChangeValue={(v) => onChangeCustomer("email", v)}
                      placeholder="your@email.com"
                      type="email"
                      disabled={saving}
                    />
                  </div>

                  <Field
                    id="city"
                    label="City"
                    value={form.shipping.address?.city}
                    onChangeValue={(v) => onChangeShippingAddress("city", v)}
                    placeholder="Toronto"
                    disabled={saving}
                  />

                  <Field
                    id="state"
                    label="State"
                    value={form.shipping.address?.state}
                    onChangeValue={(v) => onChangeShippingAddress("state", v)}
                    placeholder="Carabobo"
                    disabled={saving}
                    />

                  <Field
                    id="phone"
                    label="Phone"
                    value={form.customer.phone}
                    onChangeValue={(v) => onChangeCustomer("phone", v)}
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    disabled={saving}
                  />

                  <div className="md:col-span-2">
                    <Field
                      id="line1"
                      label="Street Address"
                      value={form.shipping.address?.line1}
                      onChangeValue={(v) => onChangeShippingAddress("line1", v)}
                      placeholder="123 Logistics Way, Suite 400"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-lg bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>

                  {saved && <span className="text-sm text-green-400">Saved</span>}
                </div>{dirtyWarning && <p className="mt-3 text-xs text-center text-slate-400">{dirtyWarning}</p>}

                {saveError && (
                  <div role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {saveError}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    2
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Payment Method</h2>
                </div>

                <div className="space-y-4">

                    <PaymentOption
                    value="zelle"
                    label="Zelle"
                    selected={form.payment.method === "zelle"}
                    onSelect={onChangePaymentMethod}
                  />
                  <PaymentOption
                    value="zinli"
                    label="Zinli"
                    selected={form.payment.method === "zinli"}
                    onSelect={onChangePaymentMethod}
                  />
                  <PaymentOption
                    value="transferencia"
                    label="Transferencia Bancaria"
                    selected={form.payment.method === "transferencia"}
                    onSelect={onChangePaymentMethod}
                  />
                  <PaymentOption
                    value="pago_movil"
                    label="Pago Móvil"
                    selected={form.payment.method === "pago_movil"}
                    onSelect={onChangePaymentMethod}
                  />
                </div>
              </section>
            </div>
          }
          right={
            <OrderSummaryCard
              checkout={checkout}
              checkoutId={checkoutId}
              onProceedToPayment={handleProceedToPayment}
              disabled={saving || dirty}
              blockedReason={blockedReason}
            />
          }
        />
      )}
    </section>
  );
}