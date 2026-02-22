import { useTranslation } from "../../../shared/i18n/useTranslation.js";

export function CartError({ message }) {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <div className="cart-error" role="alert">
      <strong>{t("cart.error.title")}</strong>
      <div>{message}</div>
    </div>
  );
}