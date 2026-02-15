import { useEffect, useState } from "react";
import { useParams, useNavigate  } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { getCheckoutById } from "../checkoutQuery";
import { updateCheckoutCustomer, updateCheckoutShipping } from "../checkoutCommand";

function isDeliveryShippingInvalid(shipping) {
  if (!shipping) return true;
  if (shipping.method !== "delivery") return false; // por ahora solo validamos delivery

  const a = shipping.address || {};
  // mínimos que normalmente exige el backend
  return (
    !a.recipientName?.trim() ||
    !a.phone?.trim() ||
    !a.state?.trim() ||
    !a.city?.trim() ||
    !a.line1?.trim()
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
    shipping: {
      method: "delivery",
      address: { recipientName: "", phone: "", state: "", city: "", line1: "", reference: "" },
    },
  });

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

        setCheckout(data);
        setForm({
          customer: data.customer || { name: "", email: "", phone: "" },
          shipping: data.shipping || {
            method: "delivery",
            address: { recipientName: "", phone: "", state: "", city: "", line1: "", reference: "" },
          },
        });

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

  function onChangeCustomer(key, value) {
    setForm((f) => ({ ...f, customer: { ...f.customer, [key]: value } }));
    setSaved(false);
  }

  function onChangeShippingAddress(key, value) {
    setForm((f) => ({
      ...f,
      shipping: { ...f.shipping, address: { ...f.shipping.address, [key]: value } },
    }));
    setSaved(false);
  }

    function onChangeShippingMethod(value) {
    setForm((f) => ({
      ...f,
      shipping: {
        ...f.shipping,
        method: value,
        // ✅ si pickup, limpiamos address para evitar enviar basura
        address:
          value === "pickup"
            ? { recipientName: "", phone: "", state: "", city: "", line1: "", reference: "" }
            : f.shipping.address,
      },
    }));
    setSaved(false);
  }

  function isNonEmpty(v) {
   return typeof v === "string" && v.trim().length > 0;
 }


  async function onSave() {
  if (saving) return;

  // ✅ validación frontend (evita pegarle al backend con payload incompleto)
  if (form.shipping.method === "delivery") {
    const a = form.shipping.address || {};
    const required = ["recipientName", "phone", "state", "city", "line1"];
    const missing = required.some((k) => !isNonEmpty(a[k]));
    if (missing) {
      setSaveError("Please complete shipping address");
      return;
    }
  }

  try {
    setSaving(true);
    setSaveError("");
    setSaved(false);

    // Update customer info
    const updatedCustomer = await updateCheckoutCustomer(checkoutId, form.customer);

    // ✅ Si pickup, enviamos solo method (address opcional)
    const shippingPayload =
      form.shipping.method === "pickup"
        ? { method: "pickup" }
        : form.shipping;

    const updatedShipping = await updateCheckoutShipping(checkoutId, shippingPayload);

    setCheckout((prev) => ({
      ...prev,
      customer: updatedCustomer?.customer ?? prev?.customer,
      shipping: updatedShipping?.shipping ?? prev?.shipping,
    }));

    setSaved(true);
  } catch (err) {
    setSaveError(err?.message || "Unknown error");
  } finally {
    setSaving(false);
  }
}


  return (
    <section>
      <p>Cart ({itemsCount})</p>

      {status === "loading" && <p>Loading checkout...</p>}

      {status === "error" && (
        <div role="alert" className="error">
          <p>Something went wrong.</p>
          <p>{error}</p>
        </div>
      )}

      {status === "success" && checkout && (
        <>
          <h2>Order summary</h2>

          {checkout.items?.length > 0 && (
            <ul>
              {checkout.items.map((i) => (
                <li key={i.productId}>
                  {i.name} — Qty: {i.quantity} — ${i.lineTotalUSD}
                </li>
              ))}
            </ul>
          )}

          <p>
            Subtotal: ${checkout.totals?.subtotalUSD}
            {checkout.totals?.subtotalVES != null
              ? ` / Bs ${checkout.totals.subtotalVES}`
              : ""}
          </p>

          <h3>Payment methods</h3>
            <ul>
              <li>USD: {(checkout.paymentMethods?.usd || []).join(", ") || "—"}</li>
              <li>VES: {(checkout.paymentMethods?.ves || []).join(", ") || "—"}</li>
            </ul>

            <button onClick={() => navigate(`/checkout/${checkoutId}/payment`)}>
              Proceed to payment
            </button>

          <h3>Customer</h3>
          <label>
            Name
            <input value={form.customer.name} onChange={(e) => onChangeCustomer("name", e.target.value)} />
          </label>
          <label>
            Email
            <input value={form.customer.email} onChange={(e) => onChangeCustomer("email", e.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.customer.phone} onChange={(e) => onChangeCustomer("phone", e.target.value)} />
          </label>

          <h3>Shipping</h3>

          <h3>Shipping</h3>

            <label>
              Method
              <select
                value={form.shipping.method}
                onChange={(e) => onChangeShippingMethod(e.target.value)}
              >
                <option value="pickup">pickup</option>
                <option value="delivery">delivery</option>
              </select>
            </label>

            {form.shipping.method === "delivery" && (
              <>
                <label>
                  Recipient name
                  <input
                    value={form.shipping.address.recipientName}
                onChange={(e) => onChangeShippingAddress("recipientName", e.target.value)}
              />
            </label>

            <label>
              Recipient phone
              <input
                value={form.shipping.address.phone}
                onChange={(e) => onChangeShippingAddress("phone", e.target.value)}
              />
            </label>

            <label>
              State
              <input
                value={form.shipping.address.state}
                onChange={(e) => onChangeShippingAddress("state", e.target.value)}
              />
            </label>

            <label>
              City
              <input
                value={form.shipping.address.city}
                onChange={(e) => onChangeShippingAddress("city", e.target.value)}
              />
            </label>

            <label>
              Address line 1
              <input
                value={form.shipping.address.line1}
                onChange={(e) => onChangeShippingAddress("line1", e.target.value)}
              />
            </label>

            <label>
              Reference
              <input
                value={form.shipping.address.reference}
                onChange={(e) => onChangeShippingAddress("reference", e.target.value)}
              />
            </label>
              </>
            )}

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {saveError && (
            <div role="alert" className="error">
              <p>{saveError}</p>
            </div>
          )}

          {saved && <p>Saved</p>}
        </>
      )}

    </section>
  );
}
