import { Link } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { useTranslation } from "../../../shared/i18n/useTranslation.js";

export function CartSessionExpired() {
  const { t } = useTranslation();
  const { startNewCart } = useCart();

  return (
    <div className="session-expired" role="alert">
      <h2>{t("cart.sessionExpired.title")}</h2>
      <p>{t("cart.sessionExpired.description")}</p>
      <p>{t("cart.sessionExpired.youCan")}</p>
      <ul>
        <li>
          <Link to="/login">{t("cart.sessionExpired.login")}</Link> {t("cart.sessionExpired.loginHint")}
        </li>
        <li>
          <button type="button" onClick={startNewCart}>
            {t("cart.sessionExpired.continueGuest")}
          </button>{" "}
          {t("cart.sessionExpired.continueGuestHint")}
        </li>
      </ul>
    </div>
  );
}