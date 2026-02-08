export function CartError({ message }) {
  if (!message) return null;

  return (
    <div className="cart-error" role="alert">
      <strong>Something went wrong.</strong>
      <div>{message}</div>
    </div>
  );
}
