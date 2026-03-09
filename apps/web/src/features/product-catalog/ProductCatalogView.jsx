import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../../api/products";
import { ProductCard } from "../../shared/components/ProductCard.jsx";
import { useTranslation } from "../../shared/i18n/useTranslation.js";
import { PRODUCT_CATEGORIES, productMatchesCategory } from "../../shared/constants/productCategories.js";

const PAGE_SIZE = 9;
const FAVORITES_STORAGE_KEY = "primebuy:favorites";

function sortProducts(list, sortKey) {
  const arr = [...list];
  if (sortKey === "newest") return arr;
  if (sortKey === "price_asc") return arr.sort((a, b) => Number(a.priceUSD) - Number(b.priceUSD));
  if (sortKey === "price_desc") return arr.sort((a, b) => Number(b.priceUSD) - Number(a.priceUSD));
  if (sortKey === "stock_desc") return arr.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
  return arr;
}

function clampNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function ProductCatalogView() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Read initial values from URL
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState(() => {
    const urlCategory = searchParams.get("category");
    const validSlugs = PRODUCT_CATEGORIES.map((c) => c.slug);
    return urlCategory && validSlugs.includes(urlCategory) ? urlCategory : "all";
  });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
      return new Set();
    }
  });
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch {}
  }, [favoriteIds]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setStatus("loading");
        setError("");
        const data = await fetchProducts();
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Unknown error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const onToggleFavorite = useCallback((productId) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const key = String(productId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = products;
    // Filter by category using normalized matching
    if (category !== "all") {
      list = list.filter((p) => productMatchesCategory(p, category));
    }
    if (query) {
      list = list.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const cat = String(p.category || "").toLowerCase();
        return name.includes(query) || cat.includes(query);
      });
    }
    const min = minPrice === "" ? null : clampNumber(minPrice, null);
    const max = maxPrice === "" ? null : clampNumber(maxPrice, null);
    if (min !== null) list = list.filter((p) => Number(p.priceUSD) >= min);
    if (max !== null) list = list.filter((p) => Number(p.priceUSD) <= max);
    if (favoritesOnly) {
      list = list.filter((p) => favoriteIds.has(String(p.id)));
    }
    return sortProducts(list, sort);
  }, [products, q, sort, category, minPrice, maxPrice, favoritesOnly, favoriteIds]);

  // Sync category to URL when it changes
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (category && category !== "all") {
        next.set("category", category);
      } else {
        next.delete("category");
      }
      return next;
    }, { replace: true });
  }, [category, setSearchParams]);

  useEffect(() => { setPage(1); }, [category, sort, minPrice, maxPrice, favoritesOnly, q]);

  const totalCount = products.length;
  const showingCount = filtered.length;
  const favoritesCount = favoriteIds.size;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  function goToPage(nextPage) {
    const n = clampNumber(nextPage, 1);
    const clamped = Math.min(Math.max(1, n), totalPages);
    setPage(clamped);
  }

  // Get page title from selected category
  const selectedCat = PRODUCT_CATEGORIES.find((c) => c.slug === category);
  const pageTitle = category === "all"
    ? t("productCatalog.header.titleElectronics")
    : t(selectedCat?.tKey || "productCatalog.header.titleElectronics");

  return (
    <section className="mx-auto max-w-[1440px]">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-pb-muted">
        <Link to="/" className="hover:text-pb-primary cursor-pointer">
          {t("productCatalog.breadcrumbs.home")}
        </Link>
        <span className="opacity-50">›</span>
        <span className="text-pb-text">{t("productCatalog.breadcrumbs.electronics")}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
          {/* Categories */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-pb-text">
              <span className="text-pb-primary">▦</span> {t("productCatalog.sidebar.categories")}
            </h3>

            <ul className="space-y-3">
              {PRODUCT_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    className={[
                      "w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors border",
                      category === c.slug
                        ? "bg-pb-primary/10 text-pb-primary border-pb-primary/30"
                        : "bg-pb-bg-subtle text-pb-text border-pb-border hover:bg-pb-surface hover:border-pb-primary/20",
                    ].join(" ")}
                  >
                    <span className="text-sm font-semibold">{t(c.tKey)}</span>
                    <span
                      className={[
                        "text-xs rounded-full px-2.5 py-0.5 font-bold",
                        category === c.slug
                          ? "bg-pb-primary/20 text-pb-primary"
                          : "bg-pb-border/50 text-pb-muted",
                      ].join(" ")}
                    >
                      {c.slug === "all"
                        ? totalCount
                        : products.filter((p) => productMatchesCategory(p, c.slug)).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price range */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-pb-text">
              <span className="text-pb-primary">$</span> {t("productCatalog.sidebar.priceRange")}
            </h3>

            <div className="rounded-2xl border border-pb-border bg-pb-surface p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-pb-muted font-medium">
                  {t("productCatalog.sidebar.minPrice")}
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl bg-white border border-pb-border px-3 py-2 text-sm text-pb-text placeholder:text-pb-muted focus:outline-none focus:ring-2 focus:ring-pb-primary/30 focus:border-pb-primary"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="text-xs text-pb-muted font-medium">
                  {t("productCatalog.sidebar.maxPrice")}
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl bg-white border border-pb-border px-3 py-2 text-sm text-pb-text placeholder:text-pb-muted focus:outline-none focus:ring-2 focus:ring-pb-primary/30 focus:border-pb-primary"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="2500"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                className="w-full rounded-xl border border-pb-border bg-white px-3 py-2 text-sm font-semibold text-pb-text hover:bg-pb-bg-subtle transition-colors"
              >
                {t("productCatalog.sidebar.resetPrice")}
              </button>
            </div>
          </div>
        </aside>

        {/* Main grid area */}
        <div className="flex-1">
          {/* Controls */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-pb-text">{pageTitle}</h2>
              <p className="text-sm text-pb-muted">
                {t("productCatalog.header.showing", { showing: showingCount, total: totalCount })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setFavoritesOnly((v) => !v)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                  favoritesOnly
                    ? "bg-pb-primary/10 text-pb-primary border-pb-primary/30"
                    : "bg-white text-pb-text border-pb-border hover:bg-pb-bg-subtle",
                ].join(" ")}
              >
                {t("productCatalog.controls.favorites")}
                {favoritesCount > 0 ? ` (${favoritesCount})` : ""}
              </button>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl bg-white border border-pb-border px-4 py-2 text-sm font-semibold text-pb-text focus:outline-none focus:ring-2 focus:ring-pb-primary/30"
              >
                <option value="newest">{t("productCatalog.controls.sortNewest")}</option>
                <option value="price_asc">{t("productCatalog.controls.sortPriceAsc")}</option>
                <option value="price_desc">{t("productCatalog.controls.sortPriceDesc")}</option>
                <option value="stock_desc">{t("productCatalog.controls.sortStockDesc")}</option>
              </select>
            </div>
          </div>

          {/* States */}
          {status === "loading" && <p className="text-pb-muted">{t("productCatalog.states.loading")}</p>}

          {status === "error" && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
              <p className="font-bold text-red-700">{t("productCatalog.states.errorTitle")}</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {status === "success" && filtered.length === 0 && (
            <div className="rounded-2xl border border-pb-border bg-pb-surface p-6">
              <p className="text-pb-text font-medium">{t("productCatalog.states.emptyTitle")}</p>
              <p className="text-sm text-pb-muted mt-1">{t("productCatalog.states.emptyHint")}</p>
            </div>
          )}

          {/* Grid */}
          {status === "success" && pageItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {pageItems.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isFavorite={favoriteIds.has(String(p.id))}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {status === "success" && filtered.length > 0 && totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={!canPrev}
                className={[
                  "h-10 w-10 rounded-xl border border-pb-border transition-colors",
                  canPrev ? "hover:bg-pb-primary hover:text-white hover:border-pb-primary" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => String(i + 1)).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  className={[
                    "h-10 w-10 rounded-xl transition-colors font-semibold",
                    String(safePage) === n
                      ? "bg-pb-primary text-white"
                      : "hover:bg-pb-bg-subtle text-pb-text",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={!canNext}
                className={[
                  "h-10 w-10 rounded-xl border border-pb-border transition-colors",
                  canNext ? "hover:bg-pb-primary hover:text-white hover:border-pb-primary" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
