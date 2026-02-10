import { useEffect, useState } from "react";
import { fetchProducts } from "../../api/products";
import { ProductCard } from "../../shared/components/ProductCard.jsx";

export function ProductCatalogView() {
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

  if (status === "loading") return <p>Loading products...</p>;
  if (status === "error") return <p className="error">Error: {error}</p>;
  if (status === "success" && products.length === 0) return <p>No products available.</p>;

  return (
    <section className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </section>
  );
}
