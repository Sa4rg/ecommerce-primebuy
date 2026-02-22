import { useState } from "react";
import { useCart } from "../../../context/CartContext.jsx";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

function formatMoneyUSD(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toFixed(2);
}

export function CartItem({ item }) {
  const { t } = useTranslation();
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  async function changeQuantity(nextQuantity) {
    if (isUpdating) return;
    if (nextQuantity < 1) return;

    try {
      setIsUpdating(true);
      await updateQuantity({ productId: item.productId, quantity: nextQuantity });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove() {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await removeItem({ productId: item.productId });
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  const imgUrl =
    item.imageUrl ||
    item.image ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Crect width='100%25' height='100%25' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23888888' font-family='Arial' font-size='18'%3ENo image%3C/text%3E%3C/svg%3E";

  return (
    <div className="group rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Image */}
        <div className="w-full sm:w-40 aspect-square rounded-xl overflow-hidden bg-black/20 border border-white/10">
          <img
            src={imgUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {t("cart.item.productId")}: <span className="font-mono">{item.productId}</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-orange-400">${formatMoneyUSD(item.lineTotalUSD)}</p>
              <p className="text-xs text-slate-400">
                {t("cart.item.qty")} {item.quantity}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            {/* Qty control */}
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => changeQuantity(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="px-3 py-2 text-slate-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("cart.item.decrease")}
              >
                −
              </button>

              <span className="px-4 py-2 text-sm font-semibold text-white">{item.quantity}</span>

              <button
                type="button"
                onClick={() => changeQuantity(item.quantity + 1)}
                disabled={isUpdating}
                className="px-3 py-2 text-slate-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("cart.item.increase")}
              >
                +
              </button>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t("cart.item.removeAria", { name: item.name })}
            >
              <span className="text-base">🗑️</span>
              {t("cart.item.remove")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}