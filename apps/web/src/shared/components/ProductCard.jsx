import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useTranslation } from "../i18n/useTranslation.js";

function formatMoneyUSD(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function normalizeUrl(u) {
  return String(u || "").trim();
}

function getFirstGalleryUrl(product) {
  const g = Array.isArray(product?.gallery) ? product.gallery : [];
  if (!g.length) return "";

  const first = g[0];
  const url = typeof first === "string" ? first : first?.url;
  return normalizeUrl(url);
}

export function ProductCard({ product, isFavorite, onToggleFavorite }) {
  const { addItem } = useCart();
  const { t, language } = useTranslation();

  const [isAdding, setIsAdding] = useState(false);
  const [localFav, setLocalFav] = useState(false);
  const [addError, setAddError] = useState("");

  const fav = typeof isFavorite === "boolean" ? isFavorite : localFav;

  const baseStock = Number(product?.stock || 0);
  const inStock =
    typeof product?.inStock === "boolean"
      ? product.inStock && baseStock > 0
      : baseStock > 0;

  const isDisabled = isAdding || !inStock;

  const displayName = useMemo(() => {
    if (language === "es") return product?.nameES || product?.name || "";
    return product?.nameEN || product?.name || "";
  }, [language, product]);

  function getErrorMessage(message) {
    if (/insufficient stock/i.test(message)) {
      return t("productCard.errors.notEnoughStockToAdd");
    }

    return t("productCard.errors.unknown");
  }

  async function handleAddToCart() {
    if (isDisabled) return;

    try {
      setAddError("");
      setIsAdding(true);
      await addItem({ productId: product.id, quantity: 1 });
    } catch (err) {
      const msg = String(err?.message || t("productCard.errors.unknown"));
      setAddError(getErrorMessage(msg));
    } finally {
      setIsAdding(false);
    }
  }

  const imgUrl = useMemo(() => {
    const cover = normalizeUrl(product?.imageUrl);
    const firstGallery = getFirstGalleryUrl(product);
    const legacy = normalizeUrl(product?.image);

    return (
      cover ||
      firstGallery ||
      legacy ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1100'%3E%3Crect width='100%25' height='100%25' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23888888' font-family='Arial' font-size='36'%3ENo image%3C/text%3E%3C/svg%3E"
    );
  }, [product]);

  const productId = product?.productId || product?.id;

  return (
    <article
      className={[
        "group relative",
        "rounded-3xl bg-white",
        "border border-pb-border/60",
        "shadow-md hover:shadow-xl",
        "transition-shadow duration-200",
        "overflow-hidden",
      ].join(" ")}
    >
      {/* Media area */}
      <div className="relative p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-pb-surface">
          <Link
            to={`/products/${productId}`}
            className="absolute inset-0 z-10"
            aria-label={displayName || product?.name}
          />

          <img
            src={imgUrl}
            alt={displayName || product?.name || "Product"}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.opacity = "0.35";
            }}
          />

          {/* Stock badge */}
          <div className="absolute left-3 top-3 z-20">
            {inStock ? (
              <span className="rounded-full bg-pb-primary px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-white">
                {t("productCard.stock.available")}
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-500 border border-slate-300">
                {t("productCard.stock.out")}
              </span>
            )}
          </div>

          {/* Favorite */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();

              if (typeof onToggleFavorite === "function") {
                onToggleFavorite(product.id);
                return;
              }

              setLocalFav((v) => !v);
            }}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-pb-text shadow-sm hover:bg-pb-primary hover:text-white transition-colors"
            aria-label={t("productCard.favorite")}
            aria-pressed={fav}
            title={t("productCard.favorite")}
          >
            <span className="text-lg">{fav ? "♥" : "♡"}</span>
          </button>

          {/* Quick add (only when in stock and no error visible) */}
          {inStock && !addError && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={isDisabled}
              className={[
                "absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold",
                "shadow-md",
                "opacity-0 translate-y-2 transition-all duration-200",
                "group-hover:opacity-100 group-hover:translate-y-0",
                "bg-pb-primary text-white hover:bg-pb-primary-hover",
              ].join(" ")}
            >
              <span className="text-base">🛒</span>
              {isAdding ? t("productCard.actions.adding") : t("productCard.actions.addToCart")}
            </button>
          )}

          {/* Inline floating error */}
          {addError && (
            <div
              role="alert"
              className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-red-200 bg-white/95 px-3 py-2 text-xs font-medium text-red-600 shadow-sm"
            >
              {addError}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="px-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-pb-text group-hover:text-pb-primary transition-colors">
              <Link to={`/products/${productId}`} className="hover:text-pb-primary">
                {displayName}
              </Link>
            </h3>

            <p className="mt-1 text-sm text-pb-muted">
              {product?.category ? `${product.category}` : t("productCard.category.general")}{" "}
              <span className="opacity-60">/</span>{" "}
              {inStock ? t("productCard.stock.available") : t("productCard.stock.out")}
            </p>
          </div>

          <span className="shrink-0 text-xl font-bold text-pb-primary">
            ${formatMoneyUSD(product?.priceUSD)}
          </span>
        </div>
      </div>
    </article>
  );
}