import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../../api/products";
import { ProductCard } from "../../shared/components/ProductCard.jsx";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "Photography", label: "Photography" },
  { key: "Audio", label: "Audio & Sound" },
  { key: "Wearables", label: "Wearables" },
  { key: "Home Office", label: "Home Office" },
];

function sortProducts(list, sortKey) {
  const arr = [...list];
  if (sortKey === "newest") return arr; // no createdAt en tu API (por ahora)
  if (sortKey === "price_asc") return arr.sort((a, b) => Number(a.priceUSD) - Number(b.priceUSD));
  if (sortKey === "price_desc") return arr.sort((a, b) => Number(b.priceUSD) - Number(a.priceUSD));
  if (sortKey === "stock_desc") return arr.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
  return arr;
}

export function ProductCatalogView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  // UI State
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

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

  // ✅ Opción B: optimistic stock update (sin refetch)
  const onOptimisticStock = useCallback((productId, qty) => {
    const qn = Math.max(1, Number(qty || 1));

    setProducts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(productId)) return p;

        const currentStock = Number(p.stock || 0);
        const nextStock = Math.max(0, currentStock - qn);

        return {
          ...p,
          stock: nextStock,
          inStock: nextStock > 0,
        };
      })
    );
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = products;

    if (category !== "all") {
      list = list.filter((p) => String(p.category || "").toLowerCase().includes(category.toLowerCase()));
    }

    if (query) {
      list = list.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const cat = String(p.category || "").toLowerCase();
        return name.includes(query) || cat.includes(query);
      });
    }

    return sortProducts(list, sort);
  }, [products, q, sort, category]);

  const showingCount = filtered.length;
  const totalCount = products.length;

  function onChangeLocalSearch(nextValue) {
    setQ(nextValue);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      const v = nextValue.trim();
      if (v) p.set("q", v);
      else p.delete("q");
      return p;
    });
  }

  return (
    <section className="mx-auto max-w-[1440px]">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400">
        <span className="hover:text-orange-400 cursor-pointer">Home</span>
        <span className="opacity-50">›</span>
        <span className="opacity-80">Electronics</span>
        <span className="opacity-50">›</span>
        <span className="text-white font-medium">Cameras & Gadgets</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
          {/* Categories */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-orange-400">▦</span> Categories
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
                    <span className="text-sm font-semibold">{c.label}</span>
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

          {/* Price range (visual placeholder) */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-orange-400">$</span> Price Range
            </h3>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="h-2 w-full rounded-full bg-white/10 relative">
                <div className="absolute left-1/4 right-1/4 h-full rounded-full bg-orange-500"></div>
                <div className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-orange-500"></div>
                <div className="absolute right-1/4 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-orange-500"></div>
              </div>

              <div className="mt-4 flex justify-between text-sm font-semibold text-slate-300">
                <span>$100</span>
                <span>$2,500</span>
              </div>

              <p className="mt-3 text-xs text-slate-400">(UI placeholder — luego lo conectamos de verdad)</p>
            </div>
          </div>

          {/* Featured card */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-400">Member Special</p>
            <h4 className="mb-4 text-lg font-bold text-white">Get 15% off electronics</h4>
            <button
              type="button"
              className="text-xs font-bold underline decoration-orange-400 underline-offset-4 hover:text-orange-300 transition-colors"
            >
              Upgrade plan
            </button>

            <div className="pointer-events-none absolute -bottom-6 -right-6 text-8xl text-orange-500/10 rotate-12">
              ⚡
            </div>
          </div>
        </aside>

        {/* Main grid area */}
        <div className="flex-1">
          {/* Controls */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Cameras & Gear</h2>
              <p className="text-sm text-slate-400">
                Showing {showingCount} of {totalCount} products
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 w-full sm:w-[320px]">
                <span className="text-slate-400 text-sm">🔎</span>
                <input
                  value={q}
                  onChange={(e) => onChangeLocalSearch(e.target.value)}
                  className="bg-transparent outline-none border-none text-sm w-full placeholder:text-slate-400 text-white"
                  placeholder="Search gadgets..."
                  type="text"
                />
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_desc">Stock: High to Low</option>
              </select>
            </div>
          </div>

          {/* States */}
          {status === "loading" && <p className="text-slate-300/80">Loading products...</p>}

          {status === "error" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-bold text-red-200">Error</p>
              <p className="text-red-200/80">{error}</p>
            </div>
          )}

          {status === "success" && filtered.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">No products found.</p>
              <p className="text-sm text-slate-400 mt-1">Try another search or category.</p>
            </div>
          )}

          {/* Grid */}
          {status === "success" && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onOptimisticStock={onOptimisticStock} />
              ))}
            </div>
          )}

          {/* Pagination placeholder */}
          {status === "success" && filtered.length > 0 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button
                type="button"
                className="h-10 w-10 rounded-lg border border-white/10 hover:bg-orange-500 hover:text-white transition-colors"
              >
                ‹
              </button>
              <button type="button" className="h-10 w-10 rounded-lg bg-orange-500 text-white font-bold">
                1
              </button>
              <button
                type="button"
                className="h-10 w-10 rounded-lg hover:bg-white/5 font-semibold text-slate-200 transition-colors"
              >
                2
              </button>
              <button
                type="button"
                className="h-10 w-10 rounded-lg hover:bg-white/5 font-semibold text-slate-200 transition-colors"
              >
                3
              </button>
              <span className="px-2 opacity-50 text-slate-300">…</span>
              <button
                type="button"
                className="h-10 w-10 rounded-lg hover:bg-white/5 font-semibold text-slate-200 transition-colors"
              >
                12
              </button>
              <button
                type="button"
                className="h-10 w-10 rounded-lg border border-white/10 hover:bg-orange-500 hover:text-white transition-colors"
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
