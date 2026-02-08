import { useState } from "react";
import { useCart } from "../../../context/CartContext.jsx";

export function CartItem({ item }) {
  const { updateQuantity, removeItem  } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  async function changeQuantity(nextQuantity) {
    if (isUpdating) return;  
    if (nextQuantity < 1) return;

    try {
      setIsUpdating(true);
      await updateQuantity({ productId: item.productId, quantity: nextQuantity });
    } catch (err) {
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove() {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await removeItem({ productId: item.productId });
    } catch (err) {
    } finally {
      setIsUpdating(false);
    }
  }


  return (
    <div className="cart-item">
      <span>{item.name}</span>

      <div className="cart-item__qty">
        <button
          type="button"
          onClick={() => changeQuantity(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          aria-label="-"
        >
          -
        </button>

        <span>Qty: {item.quantity}</span>

        <button
          type="button"
          onClick={() => changeQuantity(item.quantity + 1)}
          disabled={isUpdating}
          aria-label="+"
        >
          +
        </button>
      </div>

      <span>${item.lineTotalUSD}</span>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isUpdating}
        aria-label={`Remove ${item.name}`}
      >
        Remove
      </button>
    </div>
  );
}
