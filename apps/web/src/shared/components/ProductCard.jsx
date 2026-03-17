import { useEffect, useMemo, useRef, useState } from "react";
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
  const [added, setAdded] = useState(false);
  const [localFav, setLocalFav] = useState(false);
  const [addError, setAddError] = useState("");

  const addedTimerRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

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
      setAdded(false);
      setIsAdding(true);

      await addItem({ productId: product.id, quantity: 1 });

      setAdded(true);

      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }

      addedTimerRef.current = setTimeout(() => {
        setAdded(false);
      }, 1200);
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
  const showQuickAdd = inStock && !addError;
  const forceVisibleCta = isAdding || added;

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
      <div className="relative p-2.5 xs:p-3 sm:p-4">
        <div className="relative aspect-[4/4.4] xs:aspect-[4/4.7] sm:aspect-[4/5] overflow-hidden rounded-2xl bg-pb-surface">
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

          <div className="absolute left-2.5 xs:left-3 top-2.5 xs:top-3 z-20 hidden xs:block">
            {inStock ? (
              <span className="rounded-full bg-pb-primary px-2 py-1 text-[9px] xs:text-[10px] font-bold uppercase tracking-tight text-white">
                {t("productCard.stock.available")}
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[9px] xs:text-[10px] font-bold uppercase tracking-tight text-slate-500 border border-slate-300">
                {t("productCard.stock.out")}
              </span>
            )}
          </div>

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
            className="absolute right-2.5 xs:right-3 top-2.5 xs:top-3 z-20 hidden xs:flex h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-pb-text shadow-sm hover:bg-pb-primary hover:text-white transition-colors"
            aria-label={t("productCard.favorite")}
            aria-pressed={fav}
            title={t("productCard.favorite")}
          >
            <span className="text-sm xs:text-base sm:text-lg">{fav ? "♥" : "♡"}</span>
          </button>

          {showQuickAdd && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={isDisabled}
              className={[
                "absolute bottom-2.5 xs:bottom-3 left-2.5 xs:left-3 right-2.5 xs:right-3 z-20 hidden xs:flex items-center justify-center gap-1.5 xs:gap-2 rounded-2xl py-2 xs:py-2.5 sm:py-3 text-[11px] xs:text-xs sm:text-sm font-semibold",
                "shadow-sm border",
                // Transition only opacity and transform - NOT colors (avoids ghost states on breakpoint change)
                "transition-[opacity,transform] duration-200",
                // Mobile/tablet: always visible, light/neutral style
                "opacity-100 translate-y-0 bg-white/95 backdrop-blur-md border-pb-border text-pb-text",
                "hover:border-pb-primary hover:text-pb-primary",
                // Desktop: hidden by default, revealed on hover with primary style
                "lg:opacity-0 lg:translate-y-2 lg:pointer-events-none",
                "lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:pointer-events-auto",
                "lg:bg-pb-primary lg:border-pb-primary lg:text-white lg:hover:bg-pb-primary-hover lg:hover:border-pb-primary-hover lg:hover:text-white",
                // Force visible when adding/added (both mobile and desktop)
                forceVisibleCta ? "lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto" : "",
                // Added state: green styling with lg: variants to override desktop primary colors
                added
                  ? "bg-green-500 border-green-500 text-white hover:bg-green-500 hover:text-white lg:bg-green-500 lg:border-green-500 lg:text-white lg:hover:bg-green-500 lg:hover:text-white"
                  : "",
                isAdding ? "pointer-events-none" : "",
              ].join(" ")}
            >
              <span className="text-sm xs:text-sm sm:text-base">{added ? "✓" : "🛒"}</span>
              {isAdding
                ? t("productCard.actions.adding")
                : added
                  ? t("productCard.actions.added")
                  : t("productCard.actions.addToCart")}
            </button>
          )}

          {addError && (
            <div
              role="alert"
              className="absolute bottom-2.5 xs:bottom-3 left-2.5 xs:left-3 right-2.5 xs:right-3 z-20 rounded-2xl border border-red-200 bg-white/95 px-2.5 xs:px-3 py-2 text-[10px] xs:text-[11px] sm:text-xs font-medium text-red-600 shadow-sm"
            >
              {addError}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 xs:px-4 sm:px-5 pb-3 xs:pb-4 sm:pb-5">
        <div className="flex items-start justify-between gap-2 xs:gap-3 sm:gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] xs:text-base sm:text-lg font-bold text-pb-text group-hover:text-pb-primary transition-colors">
              <Link to={`/products/${productId}`} className="hover:text-pb-primary">
                {displayName}
              </Link>
            </h3>

            <p className="mt-1 text-[11px] xs:text-xs sm:text-sm text-pb-muted">
              {product?.category ? `${product.category}` : t("productCard.category.general")}{" "}
              <span className="opacity-60">/</span>{" "}
              {inStock ? t("productCard.stock.available") : t("productCard.stock.out")}
            </p>
          </div>

          <span className="shrink-0 text-base xs:text-lg sm:text-xl font-bold text-pb-primary">
            ${formatMoneyUSD(product?.priceUSD)}
          </span>
        </div>
      </div>
    </article>
  );
}