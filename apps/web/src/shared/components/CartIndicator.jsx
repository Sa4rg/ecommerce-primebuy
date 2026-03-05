import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";

export function CartIndicator() {
  const { itemsCount } = useCart();
  const count = Number(itemsCount || 0);

  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-slate-100 border border-pb-border transition-colors"
      aria-label="Go to cart"
      title="Cart"
    >
      <span className="text-lg leading-none">🛍️</span>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </Link>
  );
}
