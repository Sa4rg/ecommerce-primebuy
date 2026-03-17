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
  const [quantityError, setQuantityError] = useState("");

  function getErrorMessage(message) {
    if (/insufficient stock/i.test(message)) {
      return t("cart.item.errors.insufficientStock");
    }

    return t("cart.item.errors.generic");
  }

  async function changeQuantity(nextQuantity) {
    if (isUpdating) return;
    if (nextQuantity < 1) return;

    try {
      setQuantityError("");
      setIsUpdating(true);
      await updateQuantity({ productId: item.productId, quantity: nextQuantity });
    } catch (error) {
      setQuantityError(getErrorMessage(String(error?.message || "")));
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
    <div className="group rounded-xl border border-pb-border bg-white shadow-sm p-3 xs:p-4 sm:p-5">
      <div className="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6">
        {/* Image - always horizontal, compact on small screens */}
        <div className="w-16 xxs:w-20 xs:w-24 sm:w-32 md:w-40 aspect-square rounded-lg xs:rounded-xl overflow-hidden bg-slate-100 border border-pb-border flex-shrink-0">
          <img
            src={imgUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2 xxs:gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm xxs:text-base xs:text-lg font-bold text-pb-text leading-tight truncate xxs:whitespace-normal">{item.name}</h3>
              <p className="text-xs xs:text-sm text-pb-text-secondary mt-0.5 xs:mt-1">
                {t("cart.item.productId")}: <span className="font-mono">{item.productId}</span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-base xxs:text-lg xs:text-xl font-bold text-orange-400">${formatMoneyUSD(item.lineTotalUSD)}</p>
              <p className="text-[10px] xxs:text-xs text-pb-text-secondary">
                {t("cart.item.qty")} {item.quantity}
              </p>
            </div>
          </div>

          <div className="mt-3 xs:mt-4 sm:mt-5">
            <div className="flex items-center justify-between gap-2 xxs:gap-3 sm:gap-4">
              {/* Qty control */}
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-pb-border">
                <button
                  type="button"
                  onClick={() => changeQuantity(item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                  className="px-2 xxs:px-2.5 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base text-pb-text hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t("cart.item.decrease")}
                >
                  −
                </button>

                <span className="px-2 xxs:px-3 xs:px-4 py-1.5 xs:py-2 text-xs xxs:text-sm font-semibold text-pb-text">{item.quantity}</span>

                <button
                  type="button"
                  onClick={() => changeQuantity(item.quantity + 1)}
                  disabled={isUpdating}
                  className="px-2 xxs:px-2.5 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base text-pb-text hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="inline-flex items-center gap-1 xxs:gap-1.5 xs:gap-2 text-xs xxs:text-sm font-semibold text-pb-text-secondary hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("cart.item.removeAria", { name: item.name })}
              >
                <span className="text-sm xxs:text-base">🗑️</span>
                <span className="hidden xxs:inline">{t("cart.item.remove")}</span>
              </button>
            </div>

            {quantityError && (
              <div className="mt-3 max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {quantityError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}