// web/src/features/product-detail/ProductDetailPage (ProductDetailView.jsx)
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient } from "../../infrastructure/apiClient";
import { useCart } from "../../context/CartContext.jsx";
import { useTranslation } from "../../shared/i18n/useTranslation";

const FAVORITES_STORAGE_KEY = "primebuy:favorites";

/**
 * Fallback placeholder (si el producto no tiene imágenes aún)
 */
const FALLBACK_GALLERY = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCebbBrJwsvNUMlWqWjM7yaYoXP67m-Rva4IO5Mm7Ud20CxbrU6gjqk074WhBll4vR6uzz3V26aYu7LGqAWXB1LsxI7sIw2dUBHOi7Ac5xBq7_HHB5FeqgZxOIJVe00xfIQ3lgLYdR7AMjRbHcP6qzyo0FSDiEJZ9Wi82xDqXDXevx1cXujob4Kqj5wxjhLbUcXOn8Nrp8Pg9_snZmCPliJt-Q3YrIVwrV2PrAkcGyj_jOsE8spv2UMejqOUt3sDqErFRtLj2sIQSwb",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDi3OI33qa3ZU014dkfTeHqqGogAIVE0Z7FYbwO8Mvb6cjs-Gke263i1u3RlvqPcaro2H0E2J2HatOHFkG8n9_nsz1IjKxTnjdTbDPBml2Ej50IfbWFo7jkaJqoldAaXkjBH4mEW2e3MzgjDN-OrJKyUsiPPwPhiLnfSmW9a1HX9maJfU8TXK4v6EsxuVZy88LmrEog9j7_c9UO7yhxmleFgog4Css5F7Sve_zTs0_AyKuE5waoVwSLEmgUbjwC3fSFXSc1Ly5Amlkz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA_ugTFo7vXac0zggJj9f5AfiB68myts08oOF2KRTSnOiZg3_ELZKl1QE8jjwawa2QF_R-Fr2U49ikBmFSnIDI0kbKT3MLi5y3-w6aQiKvg7IStb_mezo6ZpDa_MszTYFThIVAPa7UYFXx7SQt2Ube9PVQPg1h3D-TQBJf_rXlOllZc-wv1uefitNKlPQz-KqiptmocetsXgSOOJmP4P3i5qPgiIpLVxjZ-CkKF8kGBP2bpdInwA-35lHdg9fGapajc62yYrsSj9_gU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDo_26bYDLhlXsFFki-sH9xt9E1xQhgigQW_7VkZWT2PpRBjhltom-9f4VzRDH_aBgYTm7g7hfAXKaTfFSkmvpU7PTzqINUjLmFzK6XwcEOuoq0a3C_kJAgOuQBl1654qUrblDi8Z5aAp-pPuknS2EErNI1-pg_1HqrSMVSLWKJsoZtIWvJJ05l2EHzQ7zhL12V8jZktLi9VcW060lM7vi5u4Ch9xDquW6x3aGTg30tvFNLhlGg7m73Q4x1DAEssyeIAbbLLMj2EDaS",
];

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function uniq(list) {
  const out = [];
  const seen = new Set();
  for (const x of list || []) {
    const v = String(x || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function extractGalleryUrls(product) {
  const cover = String(product?.imageUrl || "").trim();

  const raw = Array.isArray(product?.gallery) ? product.gallery : [];
  // gallery puede venir como:
  // - [{url, publicId}]
  // - ["url1", "url2"] (backward)
  const urls = raw
    .map((x) => {
      if (!x) return "";
      if (typeof x === "string") return x.trim();
      if (typeof x === "object" && typeof x.url === "string") return x.url.trim();
      return "";
    })
    .filter(Boolean);

  const merged = uniq([...(cover ? [cover] : []), ...urls]);

  return merged.length > 0 ? merged : FALLBACK_GALLERY;
}

function SpecRow({ label, value }) {
  return (
    <div className="group border-b border-orange-500/10 py-4 flex justify-between gap-6">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-right text-pb-text">{value}</span>
    </div>
  );
}

export function ProductDetailView() {
  const { id } = useParams();
  const cart = useCart();
  const { language, t } = useTranslation();

  const [status, setStatus] = useState("idle"); // loading | success | error
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  const gallery = useMemo(() => extractGalleryUrls(product), [product]);

  const [activeImg, setActiveImg] = useState(FALLBACK_GALLERY[0]);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
      return new Set();
    }
  });

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    // cuando cambia la galería (por carga / cambio de producto), re-selecciona la primera
    if (gallery?.length) setActiveImg(gallery[0]);
  }, [gallery]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch {}
  }, [favoriteIds]);

  const isFavorited = useMemo(() => {
    return product?.id ? favoriteIds.has(String(product.id)) : false;
  }, [product?.id, favoriteIds]);

  function toggleFavorite() {
    if (!product?.id) return;

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const key = String(product.id);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        const res = await apiClient.get(`/api/products/${id}`);
        const data = res?.data ?? res;
        if (cancelled) return;

        const p = data?.data ?? data;
        setProduct(p);

        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e?.message || "Failed to load product");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayName =
    language === "es" ? product?.nameES || product?.name || "" : product?.nameEN || product?.name || "";

  const shortDesc = language === "es" ? product?.shortDescES || "" : product?.shortDescEN || "";

  const specs = Array.isArray(product?.specs) ? product.specs : [];

  const price = useMemo(() => formatUSD(product?.priceUSD), [product?.priceUSD]);

  const inStock = Number(product?.stock || 0) > 0;

  async function onAddToCart() {
    if (!product || !inStock || adding) return;

    setActionErr("");
    setAdded(false);

    try {
      setAdding(true);
      await cart.addItem({ productId: product.id, quantity: 1 });

      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } catch (e) {
      setActionErr(String(e?.message || "Failed to add to cart"));
    } finally {
      setAdding(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="w-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="mt-4 text-slate-400">{t("productDetail.states.loading")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-pb-text font-semibold">{t("productDetail.states.errorTitle")}</p>
          <p className="mt-2 text-sm text-red-200" role="alert">
            {error}
          </p>
          <div className="mt-4">
            <Link className="text-orange-400 hover:underline" to="/">
              {t("productDetail.states.backToCatalog")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-5 xs:mb-6 sm:mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          {t("productDetail.breadcrumbs.home")}
        </Link>
        <span className="opacity-60">›</span>
        <Link className="hover:text-orange-400 transition-colors" to={`/products`}>
        {t("productDetail.breadcrumbs.products")}
        </Link>
        <span className="opacity-60">›</span>
        <span className="text-pb-text font-medium truncate">{displayName}</span>
      </nav>

      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-8 lg:gap-10 xl:gap-12 mb-10 xs:mb-12 sm:mb-16">
        {/* Gallery */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Thumbs */}
          <div className="flex flex-row md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-visible pb-1">
            {gallery.map((src) => {
              const isActive = src === activeImg;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(src)}
                  className={[
                    "w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                    isActive ? "border-orange-500" : "border-pb-border hover:border-pb-primary",
                  ].join(" ")}
                  aria-label="thumbnail"
                >
                  <img src={src} alt="Product thumbnail" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>

          {/* Main image */}
          <div className="flex-1 order-1 md:order-2">
            <div
              className={[
                "bg-orange-500/5 border border-orange-500/10 rounded-2xl overflow-hidden relative group",
                "aspect-square w-full",
                "max-w-[640px] lg:max-w-[640px] xl:max-w-[680px]",
              ].join(" ")}
            >
              <img
                src={activeImg}
                alt={displayName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <button
                type="button"
                onClick={toggleFavorite}
                className="absolute top-4 right-4 p-2 bg-white shadow-md rounded-full text-pb-text hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="favorite"
                title="Favorite"
              >
                <span className="text-lg">{isFavorited ? "♥" : "♡"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-3 flex items-center gap-3">
            {inStock ? (
              <span className="inline-flex items-center rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-300">
                {t("productDetail.stock.available")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-pb-border px-3 py-1 text-xs font-bold text-pb-text-secondary">
                {t("productDetail.stock.out")}
              </span>
            )}
          </div>

          <h1 className="text-2xl xs:text-3xl md:text-5xl font-bold text-pb-text mb-4 leading-tight">{displayName}</h1>

          <div className="mb-6">
            <span className="text-4xl font-bold text-orange-400">{price}</span>
            {shortDesc ? <p className="mt-3 text-slate-600 leading-relaxed">{shortDesc}</p> : null}
          </div>

          {actionErr && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {actionErr}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!inStock || adding}
              className={[
                "flex-1 font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                inStock && !adding
                  ? "bg-orange-500 hover:bg-orange-500/90 text-white shadow-orange-500/20"
                  : "bg-slate-100 text-pb-text-secondary cursor-not-allowed",
              ].join(" ")}
            >
              {adding
                ? t("productDetail.actions.adding")
                : added
                ? t("productDetail.actions.added")
                : inStock
                ? t("productDetail.actions.addToCart")
                : t("productDetail.stock.out")}
            </button>
          </div>

          {/* Perks */}
          <div className="mt-8 flex items-center gap-8 border-t border-orange-500/10 pt-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400">🚚</span>
              <span className="text-[10px] uppercase font-bold text-slate-600">{t("productDetail.perks.shipping")}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400">↩</span>
              <span className="text-[10px] uppercase font-bold text-slate-600">{t("productDetail.perks.returns")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* TECH SPECS */}
      <section className="py-8 xs:py-10 sm:py-12 border-t border-orange-500/10">
        <div className="mb-6 xs:mb-8 flex items-center justify-between">
          <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-pb-text">{t("productDetail.specs.title")}</h2>
        </div>

        {specs.length === 0 ? (
          <p className="text-slate-400">{t("productDetail.specs.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
            {specs.map((s, idx) => {
              const label = language === "es" ? s.labelES || s.label || "" : s.labelEN || s.label || "";
              const value = language === "es" ? s.valueES || s.value || "" : s.valueEN || s.value || "";
              if (!label && !value) return null;
              return <SpecRow key={idx} label={label} value={value} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}