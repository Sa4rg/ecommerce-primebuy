import { useEffect, useState } from "react";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";
import { fxService } from "../../fx/fxService.js";

function formatMoneyUSD(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toFixed(2);
}

function formatMoneyVES(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CartSummary({ summary, disabled, onCheckout }) {
  const { t } = useTranslation();
  const [fxRate, setFxRate] = useState(null);

  useEffect(() => {
    fxService.getUsdVesRate()
      .then((data) => {
        if (data) setFxRate(data.rate);
      })
      .catch(() => {
        // Silently ignore - FX rate display is optional
      });
  }, []);

  const subtotal = summary?.subtotalUSD ?? 0;
  const taxes = 0;
  const total = Number(subtotal) + taxes;
  const totalVES = fxRate ? total * fxRate : null;

  return (
    <div className="rounded-xl border border-pb-border bg-white shadow-sm p-6 lg:p-8">
      <h2 className="text-xl font-bold text-pb-text mb-6">{t("cart.summary.title")}</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm text-pb-text-secondary">
          <span>{t("cart.summary.subtotal")}</span>
          <span className="text-pb-text font-semibold">${formatMoneyUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm text-pb-text-secondary pb-4 border-b border-pb-border">
          <span>{t("cart.summary.taxes")}</span>
          <span className="text-pb-text font-semibold">${formatMoneyUSD(taxes)}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-pb-text">{t("cart.summary.total")}</span>
          <span className="text-2xl font-bold text-orange-400">${formatMoneyUSD(total)}</span>
        </div>

        {/* Equivalencia en VES */}
        {totalVES && (
          <div className="flex justify-between items-center text-sm text-pb-text-secondary">
            <span>{t("cart.summary.equivalentVES")}</span>
            <span className="text-pb-text-secondary">Bs. {formatMoneyVES(totalVES)}</span>
          </div>
        )}

        {fxRate && (
          <p className="text-xs text-pb-text-secondary text-right">
            {t("cart.summary.rateInfo", { rate: fxRate.toLocaleString("es-VE") })}
          </p>
        )}
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
        <p className="text-[10px] uppercase tracking-widest text-center text-pb-text-secondary mb-2">
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