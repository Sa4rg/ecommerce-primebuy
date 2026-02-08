import { useEffect, useState } from "react";
import "./App.css";
import { fetchProducts } from "./api/products";
import { ProductCard } from "./shared/components/ProductCard.jsx";
import { CartIndicator } from "./shared/components/CartIndicator.jsx";
import { CartView } from "./features/shopping-cart/components/CartView.jsx";

function App() {
  const [view, setView] = useState("catalog"); // catalog | cart

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (view !== "catalog") return;

    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setError("");

        const data = await fetchProducts();
        if (cancelled) return;

        setProducts(data);
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
  }, [view]);

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__header-row">
          <div>
            <h1>{view === "catalog" ? "Catalog" : "Cart"}</h1>
            <p className="page__subtitle">
              {view === "catalog" ? "Products available" : "Your selected items"}
            </p>
          </div>

          <div className="page__actions">
            <CartIndicator />

            {view === "catalog" ? (
              <button onClick={() => setView("cart")}>View cart</button>
            ) : (
              <button onClick={() => setView("catalog")}>Back to catalog</button>
            )}
          </div>
        </div>
      </header>

      {view === "catalog" && (
        <>
          {status === "loading" && <p>Loading products...</p>}
          {status === "error" && <p className="error">Error: {error}</p>}
          {status === "success" && products.length === 0 && <p>No products available.</p>}

          {status === "success" && products.length > 0 && (
            <section className="grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </section>
          )}
        </>
      )}

      {view === "cart" && <CartView />}
    </div>
  );
}

export default App;
