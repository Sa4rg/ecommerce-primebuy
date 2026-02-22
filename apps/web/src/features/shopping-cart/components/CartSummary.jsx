import { useTranslation } from "../../../shared/i18n/useTranslation.js";

function formatMoneyUSD(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toFixed(2);
}

export function CartSummary({ summary, disabled, onCheckout }) {
  const { t } = useTranslation();

  const subtotal = summary?.subtotalUSD ?? 0;
  const taxes = 0;
  const total = Number(subtotal) + taxes;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-white mb-6">{t("cart.summary.title")}</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm text-slate-300">
          <span>{t("cart.summary.subtotal")}</span>
          <span className="text-white font-semibold">${formatMoneyUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm text-slate-300 pb-4 border-b border-white/10">
          <span>{t("cart.summary.taxes")}</span>
          <span className="text-white font-semibold">${formatMoneyUSD(taxes)}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-white">{t("cart.summary.total")}</span>
          <span className="text-2xl font-bold text-orange-400">${formatMoneyUSD(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled}
        className="w-full rounded-lg bg-orange-500 py-4 font-bold text-lg text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.99]"
      >
        {t("cart.summary.checkout")}
      </button>

      <div className="mt-8">
        <p className="text-[10px] uppercase tracking-widest text-center text-slate-400 mb-2">
          {t("cart.summary.securePayments")}
        </p>
        <div className="flex justify-center items-center gap-4 opacity-70">
          <span className="text-xl">💳</span>
          <span className="text-xl">🔒</span>
          <span className="text-xl">📶</span>
        </div>
      </div>
    </div>
  );
}