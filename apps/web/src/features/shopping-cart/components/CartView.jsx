import { useEffect } from "react";
import { useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartError } from "./CartError";
import { CartSessionExpired } from "./CartSessionExpired";
import { Link, useNavigate } from "react-router-dom";

export function CartView() {
  const { cart, status, error, initializeCart, startNewCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") initializeCart();
  }, [status, initializeCart]);

  if (status === "session-expired") {
    return <CartSessionExpired />;
  }

  if (!cart) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-slate-300">Loading cart...</p>
      </section>
    );
  }

  const isActive = cart?.metadata?.status === "active";
  const itemsCount = cart?.summary?.itemsCount ?? cart.items?.length ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          Home
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-white font-medium">Cart</span>
      </nav>

      {/* Title */}
      <div className="flex items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
          <p className="text-slate-400 mt-1">
            {itemsCount} item{itemsCount === 1 ? "" : "s"} in your cart
          </p>
        </div>

        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-orange-400 transition-colors"
        >
          ← Continue shopping
        </Link>
      </div>

      {/* Errors */}
      {status === "error" && (
        <div className="mb-4">
          <CartError message={error} />
        </div>
      )}

      {/* Inactive cart banner */}
      {!isActive && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-orange-500/25 bg-orange-500/10 p-4 text-slate-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">This cart is not active anymore.</p>
              <p className="text-sm text-slate-300">
                It was used in a checkout/payment. Start a new cart to shop again.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                startNewCart();
                navigate("/", { replace: true });
              }}
              className="inline-flex justify-center rounded-lg border border-orange-500/30 bg-orange-500/20 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500/30 transition-colors"
            >
              Start a new cart
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Items list */}
        <div className="flex-grow lg:w-2/3 space-y-6">
          {cart.items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">Your cart is empty.</p>
              <Link
                to="/"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Browse products →
              </Link>
            </div>
          ) : (
            cart.items.map((item) => <CartItem key={item.productId} item={item} />)
          )}

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-orange-400 transition-colors"
            >
              ← Continue shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:w-1/3">
          <div className="sticky top-28">
            <CartSummary
              summary={cart.summary}
              disabled={!isActive || cart.items.length === 0}
              onCheckout={() => navigate("/checkout")}
            />

            {/* Shipping/info card */}
            <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 flex gap-4">
              <div className="h-fit rounded-lg bg-orange-500 text-white px-2 py-1 font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Free shipping applied!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Your order qualifies for standard shipping.
                </p>
              </div>
            </div>

            {/* Mobile checkout button (optional extra) */}
            <div className="mt-6 lg:hidden">
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                disabled={!isActive || cart.items.length === 0}
                className="w-full rounded-lg bg-orange-500 px-4 py-3 text-base font-bold text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Proceed to checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
