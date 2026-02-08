import { useState } from "react";
import { useCart } from "../../../context/CartContext.jsx";

export function CartItem({ item }) {
  const { updateQuantity, removeItem  } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  async function changeQuantity(nextQuantity) {
    if (nextQuantity < 1) return;

    try {
      setIsUpdating(true);
      console.log("CartItem item", item);
      await updateQuantity({ productId: item.productId, quantity: nextQuantity });
           console.log("CartItem item", item);
    } catch (err) {
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemove() {
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
