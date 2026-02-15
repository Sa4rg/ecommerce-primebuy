import { Link } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";

export function CartSessionExpired() {
  const { startNewCart } = useCart();

  return (
    <div className="session-expired" role="alert">
      <h2>Session Expired</h2>
      <p>
        Your session has expired. This cart was linked to your account.
      </p>
      <p>You can:</p>
      <ul>
        <li>
          <Link to="/login">Log in</Link> to recover your cart
        </li>
        <li>
          <button type="button" onClick={startNewCart}>
            Continue as guest
          </button>{" "}
          with a new empty cart
        </li>
      </ul>
    </div>
  );
}
