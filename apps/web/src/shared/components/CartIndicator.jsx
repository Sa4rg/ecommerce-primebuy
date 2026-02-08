import { useCart } from "../../context/CartContext.jsx";

export function CartIndicator() {
  const { itemsCount } = useCart();

  if (!itemsCount || itemsCount <= 0) return null;

  return <div className="cart-indicator">Cart ({itemsCount})</div>;
}
