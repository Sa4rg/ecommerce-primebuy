import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../../api/products";
import { ProductCard } from "../../shared/components/ProductCard.jsx";
import { useTranslation } from "../../shared/i18n/useTranslation.js";

const CATEGORIES = [
  { key: "all", tKey: "productCatalog.sidebar.all" },
  { key: "Watches", tKey: "productCatalog.sidebar.watches" },
  { key: "Security Cameras", tKey: "productCatalog.sidebar.securityCameras" },
];

const PAGE_SIZE = 9;
const FAVORITES_STORAGE_KEY = "electrovar:favorites";

function sortProducts(list, sortKey) {
  const arr = [...list];
  if (sortKey === "newest") return arr; // no createdAt in API (for now)
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
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  // Query state from navbar (?q=)
  const [q, setQ] = useState(searchParams.get("q") || "");

  // UI State
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("all");

  // Price range state (controlled inputs)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Favorites (persisted)
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

  // Pagination
  const [page, setPage] = useState(1);

  // Keep q in sync with URL
  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setPage(1);
  }, [searchParams]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch {
      // ignore storage errors
    }
  }, [favoriteIds]);

  // Load products
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
    return () => {
      cancelled = true;
    };
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

    // Category filter
    if (category !== "all") {
      list = list.filter((p) => String(p.category || "").toLowerCase().includes(category.toLowerCase()));
    }

    // Search filter from navbar (?q=)
    if (query) {
      list = list.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const cat = String(p.category || "").toLowerCase();
        return name.includes(query) || cat.includes(query);
      });
    }

    // Price filter (priceUSD)
    const min = minPrice === "" ? null : clampNumber(minPrice, null);
    const max = maxPrice === "" ? null : clampNumber(maxPrice, null);

    if (min !== null) list = list.filter((p) => Number(p.priceUSD) >= min);
    if (max !== null) list = list.filter((p) => Number(p.priceUSD) <= max);

    // Favorites filter
    if (favoritesOnly) {
      list = list.filter((p) => favoriteIds.has(String(p.id)));
    }

    return sortProducts(list, sort);
  }, [products, q, sort, category, minPrice, maxPrice, favoritesOnly, favoriteIds]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, sort, minPrice, maxPrice, favoritesOnly, q]);

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

  const pageTitle =
    category === "all"
      ? t("productCatalog.header.titleElectronics")
      : category === "Watches"
        ? t("productCatalog.sidebar.watches")
        : t("productCatalog.sidebar.securityCameras");

  return (
    <section className="mx-auto max-w-[1440px]">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400">
        <span className="hover:text-orange-400 cursor-pointer">{t("productCatalog.breadcrumbs.home")}</span>
        <span className="opacity-50">›</span>
        <span className="opacity-80">{t("productCatalog.breadcrumbs.electronics")}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
          {/* Categories */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-orange-400">▦</span> {t("productCatalog.sidebar.categories")}
            </h3>

            <ul className="space-y-3">
              {CATEGORIES.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={[
                      "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors border",
                      category === c.key
                        ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
                        : "bg-transparent text-slate-300 border-white/10 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="text-sm font-semibold">{t(c.tKey)}</span>
                    <span
                      className={[
                        "text-xs rounded px-2 py-0.5 border",
                        category === c.key
                          ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
                          : "bg-white/5 text-slate-300 border-white/10",
                      ].join(" ")}
                    >
                      {c.key === "all"
                        ? totalCount
                        : products.filter((p) =>
                            String(p.category || "").toLowerCase().includes(c.key.toLowerCase())
                          ).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price range (ACTIVE) */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-orange-400">$</span> {t("productCatalog.sidebar.priceRange")}
            </h3>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-300">
                  {t("productCatalog.sidebar.minPrice")}
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    aria-label="Min price"
                  />
                </label>

                <label className="text-xs text-slate-300">
                  {t("productCatalog.sidebar.maxPrice")}
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="2500"
                    aria-label="Max price"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
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
              <h2 className="text-2xl font-bold tracking-tight text-white">{pageTitle}</h2>
              <p className="text-sm text-slate-400">
                {t("productCatalog.header.showing", { showing: showingCount, total: totalCount })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Favorites filter button */}
              <button
                type="button"
                onClick={() => setFavoritesOnly((v) => !v)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                  favoritesOnly
                    ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
                    : "bg-transparent text-slate-200 border-white/10 hover:bg-white/5",
                ].join(" ")}
              >
                {t("productCatalog.controls.favorites")}
                {favoritesCount > 0 ? ` (${favoritesCount})` : ""}
              </button>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="newest">{t("productCatalog.controls.sortNewest")}</option>
                <option value="price_asc">{t("productCatalog.controls.sortPriceAsc")}</option>
                <option value="price_desc">{t("productCatalog.controls.sortPriceDesc")}</option>
                <option value="stock_desc">{t("productCatalog.controls.sortStockDesc")}</option>
              </select>
            </div>
          </div>

          {/* States */}
          {status === "loading" && <p className="text-slate-300/80">{t("productCatalog.states.loading")}</p>}

          {status === "error" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-bold text-red-200">{t("productCatalog.states.errorTitle")}</p>
              <p className="text-red-200/80">{error}</p>
            </div>
          )}

          {status === "success" && filtered.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">{t("productCatalog.states.emptyTitle")}</p>
              <p className="text-sm text-slate-400 mt-1">{t("productCatalog.states.emptyHint")}</p>
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
                  "h-10 w-10 rounded-lg border border-white/10 transition-colors",
                  canPrev ? "hover:bg-orange-500 hover:text-white" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
                aria-label={t("productCatalog.pagination.prev")}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => String(i + 1)).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  className={[
                    "h-10 w-10 rounded-lg transition-colors font-semibold",
                    String(safePage) === n
                      ? "bg-orange-500 text-white"
                      : "hover:bg-white/5 text-slate-200",
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
                  "h-10 w-10 rounded-lg border border-white/10 transition-colors",
                  canNext ? "hover:bg-orange-500 hover:text-white" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
                aria-label={t("productCatalog.pagination.next")}
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