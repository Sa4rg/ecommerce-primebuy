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
  const s = String(u || "").trim();
  return s;
}

function getFirstGalleryUrl(product) {
  const g = Array.isArray(product?.gallery) ? product.gallery : [];
  if (!g.length) return "";

  // gallery puede venir como strings o como objetos {url, publicId}
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
  const inStock = typeof product?.inStock === "boolean" ? product.inStock && baseStock > 0 : baseStock > 0;
  const isDisabled = isAdding || !inStock;

  const displayName = useMemo(() => {
    if (language === "es") return product?.nameES || product?.name || "";
    return product?.nameEN || product?.name || "";
  }, [language, product]);

  function getErrorMessage(message) {
    if (/insufficient stock/i.test(message)) return t("productCard.errors.insufficientStock");
    return message;
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
    <div className="group relative">
      {/* Media */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-pb-surface border border-pb-border">
        {/* Click in image opens detail */}
        <Link to={`/products/${productId}`} className="absolute inset-0 z-10" aria-label={displayName || product?.name} />

        <img
          src={imgUrl}
          alt={displayName || product?.name || "Product"}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            // si la URL falla, baja opacidad (para depurar rápido)
            e.currentTarget.style.opacity = "0.35";
          }}
        />

        {/* Badge */}
        <div className="absolute left-4 top-4 z-20">
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
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-pb-text shadow-sm hover:bg-pb-primary hover:text-white transition-colors"
          aria-label={t("productCard.favorite")}
          aria-pressed={fav}
          title={t("productCard.favorite")}
        >
          <span className="text-lg">{fav ? "♥" : "♡"}</span>
        </button>

        {/* Quick add */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleAddToCart();
          }}
          disabled={isDisabled}
          className={[
            "absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg",
            "opacity-0 translate-y-4 transition-all duration-300",
            "group-hover:opacity-100 group-hover:translate-y-0",
            isDisabled ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-pb-primary text-white hover:bg-pb-primary-hover",
          ].join(" ")}
        >
          <span className="text-base">🛒</span>
          {isAdding ? t("productCard.actions.adding") : inStock ? t("productCard.actions.addToCart") : t("productCard.stock.out")}
        </button>

        {/* Inline error */}
        {addError && (
          <div
            role="alert"
            className="absolute bottom-2 left-4 right-4 z-20 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {addError}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-pb-text group-hover:text-pb-primary transition-colors">
            <Link to={`/products/${productId}`} className="hover:text-pb-primary">
              {displayName}
            </Link>
          </h3>

          <p className="mt-1 text-sm text-pb-muted">
            {product?.category ? `${product.category}` : t("productCard.category.general")} <span className="opacity-60">/</span>{" "}
            {inStock ? t("productCard.stock.available") : t("productCard.stock.out")}
          </p>
        </div>

        <span className="shrink-0 text-xl font-bold text-pb-primary">${formatMoneyUSD(product?.priceUSD)}</span>
      </div>
    </div>
  );
}