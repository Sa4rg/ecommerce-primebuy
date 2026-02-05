import { useEffect, useState } from "react";
import "./App.css";
import { fetchProducts } from "./api/products";
import { ProductCard } from "./components/ProductCard";

function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Catalog</h1>
        <p className="page__subtitle">Products available</p>
      </header>

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
    </div>
  );
}

export default App;
