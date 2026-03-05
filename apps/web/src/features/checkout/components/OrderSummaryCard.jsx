import React from "react";

export function OrderSummaryCard({
  checkout,
  checkoutId,
  onProceedToPayment,
  disabled = false,
  blockedReason = "",
}) {
  const subtotalUSD = checkout.totals?.subtotalUSD ?? 0;
  const subtotalVES = checkout.totals?.subtotalVES ?? 0;
  const shipping = checkout.totals?.shippingUSD ?? 0;
  const taxes = checkout.totals?.taxUSD ?? 0;

  const total = subtotalUSD + shipping + taxes;

  const usdMethods = checkout.paymentMethods?.usd ?? [];
  const vesMethods = checkout.paymentMethods?.ves ?? [];

  return (
    <aside className="w-full rounded-xl border border-pb-border bg-white p-6 shadow-xl">
      {/* Header */}
      <h2 className="text-lg font-bold text-pb-text mb-5">
        Order Summary
      </h2>

      {/* Items */}
      {checkout.items?.length > 0 && (
        <div className="space-y-4 mb-6">
          {checkout.items.map((item) => (
            <div key={item.productId} className="flex gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-slate-100 border border-pb-border flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-pb-text truncate">
                  {item.name}
                </p>
                <p className="text-xs text-pb-text-secondary mt-0.5">
                  Qty: {item.quantity}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-orange-400">
                  ${Number(item.lineTotalUSD ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-pb-border pt-4 space-y-3 text-sm">
        {/* Subtotal — test depends on this exact text */}
        <div className="flex justify-between">
          <p className="text-pb-text-secondary">
            Subtotal: ${Number(subtotalUSD).toFixed(2)}
          </p>

          <p className="text-pb-text font-medium">
            Bs {Number(subtotalVES).toFixed(0)}
          </p>
        </div>

        <div className="flex justify-between">
          <span className="text-pb-text-secondary">Shipping</span>
          <span
            className={
              shipping === 0
                ? "text-green-400 font-semibold"
                : "text-pb-text font-medium"
            }
          >
            {shipping === 0
              ? "FREE"
              : `$${Number(shipping).toFixed(2)}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-pb-text-secondary">Estimated Taxes</span>
          <span className="text-pb-text font-medium">
            ${Number(taxes).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-pb-border mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-pb-text">Total</span>
          <span className="text-2xl font-bold text-orange-400">
            ${Number(total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment methods */}
      {(usdMethods.length > 0 || vesMethods.length > 0) && (
        <div className="border-t border-pb-border mt-4 pt-4 space-y-2 text-sm">
          {usdMethods.length > 0 && (
            <p className="text-pb-text-secondary">
              USD: {usdMethods.join(", ")}
            </p>
          )}
          {vesMethods.length > 0 && (
            <p className="text-pb-text-secondary">
              VES: {vesMethods.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onProceedToPayment(checkoutId)}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Continuar con el pago
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>

      {disabled && blockedReason && (
        <p className="mt-3 text-xs text-center text-pb-text-secondary">
          {blockedReason}
        </p>
      )}

      {/* Trust badges */}
      <div className="mt-6 pt-4 border-t border-pb-border flex items-center justify-center gap-6 text-xs text-pb-text-secondary">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>SECURE PAYMENT</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>30-DAY RETURNS</span>
        </div>
      </div>
    </aside>
  );
}
