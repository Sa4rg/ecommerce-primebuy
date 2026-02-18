import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient } from "../../infrastructure/apiClient";
import { useCart } from "../../context/CartContext.jsx";

/**
 * NOTA:
 * - Tu backend aún no devuelve imageUrl/description/specs, etc.
 * - Para igualar Stitch ahora, usamos placeholders (luego conectas campos reales).
 */

const GALLERY = [
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

function SpecRow({ label, value }) {
  return (
    <div className="group border-b border-orange-500/10 py-4 flex justify-between gap-6">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-right text-slate-100">{value}</span>
    </div>
  );
}

export function ProductDetailView() {
  const { id } = useParams();
  const cart = useCart();

  const [status, setStatus] = useState("idle"); // loading | success | error
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  const [activeImg, setActiveImg] = useState(GALLERY[0]);
  const [favorited, setFavorited] = useState(false);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setStatus("loading");
        setError("");

        const res = await apiClient.get(`/api/products/${id}`);
        const data = res?.data ?? res;

        if (cancelled) return;

        // Payload: { success, message, data: {...} }
        const p = data?.data ?? data;
        setProduct(p);

        setActiveImg(GALLERY[0]);
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

  const price = useMemo(() => formatUSD(product?.priceUSD), [product?.priceUSD]);

  // ✅ Disponibilidad (sin mostrar stock numérico)
  // Si tu API a veces NO trae inStock, igual funciona por stock > 0
  const inStock = Number(product?.stock || 0) > 0;

  async function onAddToCart() {
    if (!product || !inStock || adding) return;

    setActionErr("");
    setAdded(false);

    try {
      setAdding(true);

      // ✅ Tu CartContext espera: addItem({ productId, quantity })
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
        <p className="mt-4 text-slate-400">Loading product...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-white font-semibold">Something went wrong</p>
          <p className="mt-2 text-sm text-red-200" role="alert">
            {error}
          </p>
          <div className="mt-4">
            <Link className="text-orange-400 hover:underline" to="/">
              Back to catalog
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
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link className="hover:text-orange-400 transition-colors" to="/">
          Home
        </Link>
        <span className="opacity-60">›</span>
        <span className="opacity-80">Products</span>
        <span className="opacity-60">›</span>
        <span className="text-white font-medium truncate">{product.name}</span>
      </nav>

      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12 mb-16">
        {/* Gallery */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Thumbs */}
          <div className="flex flex-row md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-visible pb-1">
            {GALLERY.map((src) => {
              const isActive = src === activeImg;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(src)}
                  className={[
                    "w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                    isActive ? "border-orange-500" : "border-white/10 hover:border-orange-500/50",
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
                // 👇 evita que la imagen se coma la pantalla
                "max-w-[640px] lg:max-w-[640px] xl:max-w-[680px]",
              ].join(" ")}
            >
              <img
                src={activeImg}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <button
                type="button"
                onClick={() => setFavorited((v) => !v)}
                className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-orange-500 transition-colors"
                aria-label="favorite"
                title="Favorite"
              >
                <span className="text-lg">{favorited ? "♥" : "♡"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider rounded-full">
              New Arrival
            </span>

            {/* ✅ Disponible / Agotado (sin número) */}
            {inStock ? (
              <span className="inline-flex items-center rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-300">
                Available
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-white/60">
                Out of stock
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Rating placeholder */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-orange-400">
              <span>★★★★★</span>
            </div>
            <span className="text-sm text-slate-400 font-medium">4.8 (1,248 reviews)</span>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-orange-400">{price}</span>
            <span className="block text-sm text-slate-400 mt-1 italic">
              Free express shipping & insurance included
            </span>
          </div>

          <div className="space-y-4 mb-8 text-slate-300">
            <p className="text-lg leading-relaxed">
              Experience a new standard of performance with this product. (Placeholder copy — luego lo conectamos al backend).
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-orange-400">●</span> Feature 1
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">●</span> Feature 2
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">●</span> Feature 3
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">●</span> Feature 4
              </li>
            </ul>
          </div>

          {/* Error al agregar */}
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
                  : "bg-white/10 text-white/50 cursor-not-allowed",
              ].join(" ")}
            >
              {adding ? "Adding..." : added ? "Added ✓" : inStock ? "Add to Cart" : "Out of stock"}
            </button>

            <button
              type="button"
              disabled={!inStock}
              className={[
                "flex-1 border-2 font-bold py-4 rounded-xl transition-all active:scale-[0.98]",
                inStock
                  ? "border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  : "border-white/10 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              Buy It Now
            </button>
          </div>

          <div className="mt-8 flex items-center gap-8 border-t border-orange-500/10 pt-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400">✔</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">2 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400">🚚</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">Global Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-400">↩</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">30-Day Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* TECH SPECS */}
      <section className="py-12 border-t border-orange-500/10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Technical Specifications</h2>
          <button type="button" className="text-orange-400 font-medium hover:underline flex items-center gap-2">
            Download Full PDF <span className="opacity-80">⬇</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
          <SpecRow label="Sensor" value="33.0MP Full-frame Exmor R CMOS" />
          <SpecRow label="Processor" value="BIONZ XR image processor" />
          <SpecRow label="Video Resolution" value="4K 60p, 10-bit 4:2:2" />
          <SpecRow label="ISO Range" value="Auto, 100–51200 (Exp: 50–204800)" />
          <SpecRow label="Autofocus Points" value="759 Phase-detection Points" />
          <SpecRow label="Mount" value="Sony E-mount" />
          <SpecRow label="LCD Screen" value='3.0" Vari-angle Touchscreen' />
          <SpecRow label="Weight" value="Approx. 658g (with battery/card)" />
        </div>
      </section>

      {/* Reviews: después */}
    </div>
  );
}
