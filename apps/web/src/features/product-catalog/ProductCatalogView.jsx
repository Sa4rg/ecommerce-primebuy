import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../../api/products";
import { ProductCard } from "../../shared/components/ProductCard.jsx";
import { ProductsGridSkeleton } from "../../shared/components/Skeleton.jsx";
import { useTranslation } from "../../shared/i18n/useTranslation.js";
import { PRODUCT_CATEGORIES, productMatchesCategory } from "../../shared/constants/productCategories.js";
import { normalizeString } from "../../shared/utils/normalizeString.js";

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
    const normalizedQuery = normalizeString(q.trim());

    let list = products;

    if (category !== "all") {
      list = list.filter((p) => productMatchesCategory(p, category));
    }

    if (normalizedQuery) {
      list = list.filter((p) => {
        const searchableText = normalizeString(
          [p?.name, p?.nameES, p?.nameEN, p?.category].filter(Boolean).join(" ")
        );

        return searchableText.includes(normalizedQuery);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  function goToPage(nextPage) {
    const n = clampNumber(nextPage, 1);
    const clamped = Math.min(Math.max(1, n), totalPages);
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-[1440px]">

      <nav className="mb-6 flex items-center gap-2 text-sm text-pb-muted">
        <Link to="/" className="hover:text-pb-primary">
          {t("productCatalog.breadcrumbs.home")}
        </Link>
        <span>›</span>
        <span className="text-pb-text">
          {t("productCatalog.breadcrumbs.catalog")}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 xl:gap-12">

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">

          <div className="grid grid-cols-1 xxs:grid-cols-2 lg:grid-cols-1 gap-4 xxs:gap-5 lg:gap-8">

            {/* Categories */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-pb-text">
                <span className="text-pb-primary">▦</span>
                {t("productCatalog.sidebar.categories")}
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
                          : "bg-pb-bg-subtle text-pb-text border-pb-border hover:bg-pb-surface",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold">
                        {t(c.tKey)}
                      </span>

                      <span className="text-xs rounded-full px-2.5 py-0.5 font-bold bg-pb-border/50">
                        {c.slug === "all"
                          ? products.length
                          : products.filter((p) =>
                              productMatchesCategory(p, c.slug)
                            ).length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price filter */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-pb-text">
                <span className="text-pb-primary">$</span>
                {t("productCatalog.sidebar.priceRange")}
              </h3>

              <div className="rounded-2xl border border-pb-border bg-pb-surface p-4 space-y-4">

                <div className="grid grid-cols-2 gap-3">

                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="rounded-xl border border-pb-border px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    placeholder="2500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="rounded-xl border border-pb-border px-3 py-2 text-sm"
                  />

                </div>

                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="w-full rounded-xl border border-pb-border px-3 py-2 text-sm font-semibold hover:bg-pb-bg-subtle"
                >
                  {t("productCatalog.sidebar.resetPrice")}
                </button>

              </div>
            </div>

          </div>

        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-pb-text">
                {t("productCatalog.header.titleCatalog")}
              </h2>

              <p className="text-sm text-pb-muted">
                {t("productCatalog.header.showing", {
                  showing: filtered.length,
                  total: products.length,
                })}
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() => {
                  setFavoritesOnly((v) => !v);
                  setPage(1);
                }}
                className={[
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                  favoritesOnly
                    ? "border-pb-primary bg-pb-primary/10 text-pb-primary"
                    : "border-pb-border text-pb-text hover:bg-pb-bg-subtle",
                ].join(" ")}
                aria-pressed={favoritesOnly}
              >
                {t("productCatalog.controls.favorites")}
              </button>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                <option value="newest">
                  {t("productCatalog.controls.sortNewest")}
                </option>

                <option value="price_asc">
                  {t("productCatalog.controls.sortPriceAsc")}
                </option>

                <option value="price_desc">
                  {t("productCatalog.controls.sortPriceDesc")}
                </option>

                <option value="stock_desc">
                  {t("productCatalog.controls.sortStockDesc")}
                </option>

              </select>

            </div>
          </div>

          {/* Loading state */}
          {status === "loading" && (
            <ProductsGridSkeleton 
              count={PAGE_SIZE} 
              gridClassName="grid grid-cols-1 xxs:grid-cols-2 lg:grid-cols-3 gap-4 xxs:gap-5 lg:gap-5 xl:gap-8"
            />
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="text-center py-12">
              <p className="text-lg text-red-600 font-semibold">
                {t("productCatalog.errors.loadFailed")}
              </p>
              <p className="text-sm text-pb-muted mt-2">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {status === "success" && pageItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-pb-muted font-semibold">
                {favoritesOnly 
                  ? t("productCatalog.empty.noFavorites")
                  : t("productCatalog.empty.noProducts")
                }
              </p>
            </div>
          )}

          {/* Products grid */}
          {status === "success" && pageItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 xxs:grid-cols-2 lg:grid-cols-3 gap-4 xxs:gap-5 lg:gap-5 xl:gap-8">

                {pageItems.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isFavorite={favoriteIds.has(String(p.id))}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}

              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="rounded-xl border border-pb-border bg-pb-surface px-4 py-2 text-sm font-semibold text-pb-text hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t("productCatalog.pagination.prev")}
                  >
                    ← {t("productCatalog.pagination.prev")}
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        Math.abs(pageNum - safePage) <= 1;

                      if (!showPage) {
                        // Show ellipsis for gaps
                        if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                          return <span key={pageNum} className="px-2 text-pb-text-secondary">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={[
                            "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                            pageNum === safePage
                              ? "bg-pb-primary text-white"
                              : "border border-pb-border bg-pb-surface text-pb-text hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="rounded-xl border border-pb-border bg-pb-surface px-4 py-2 text-sm font-semibold text-pb-text hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t("productCatalog.pagination.next")}
                  >
                    {t("productCatalog.pagination.next")} →
                  </button>

                </div>
              )}
            </>
          )}

        </div>

      </div>
    </section>
  );
}