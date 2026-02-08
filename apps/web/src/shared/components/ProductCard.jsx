import { useState } from "react";
import { useCart } from "../../context/CartContext.jsx";

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  async function handleAddToCart() {
    try {
      setIsAdding(true);
      await addItem({ productId: product.id, quantity: 1 });
    } finally {
      setIsAdding(false);
    }
  }

  const isDisabled = isAdding || !product.inStock || product.stock <= 0;

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

      <button className="product-card__btn" disabled={isDisabled} onClick={handleAddToCart}>
        {isAdding ? "Adding..." : "Add to cart"}
      </button>
    </div>
  );
}
