export function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-card__header">
        <h3 className="product-card__title">{product.name}</h3>
        <span className={`badge ${product.inStock ? "badge--ok" : "badge--no"}`}>
          {product.inStock ? "In stock" : "Out of stock"}
        </span>
      </div>

      <p className="product-card__price">${product.priceUSD}</p>

      <div className="product-card__meta">
        <span>Category: {product.category}</span>
        <span>Stock: {product.stock}</span>
      </div>

      <button className="product-card__btn" disabled={!product.inStock || product.stock <= 0}>
        Add to cart
      </button>
    </div>
  );
}
