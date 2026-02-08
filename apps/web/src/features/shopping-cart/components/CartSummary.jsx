export function CartSummary({ summary }) {
  return (
    <div className="cart-summary">
      <strong>Subtotal: ${summary.subtotalUSD}</strong>
    </div>
  );
}
