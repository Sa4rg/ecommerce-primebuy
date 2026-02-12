// src/features/orders/pages/OrderDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { orderService } from "../orderService";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    orderService.getOrder(orderId)
      .then(setOrder)
      .catch((e) => setErr(e.message || "Failed to load order"));
  }, [orderId]);

  if (!order) return <p>{err ? err : "Loading..."}</p>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Order</h1>
      <p><b>ID:</b> {order.orderId}</p>
      <p><b>Status:</b> {order.status}</p>

      <h3>Items</h3>
      <ul>
        {order.items.map((it) => (
          <li key={it.productId}>
            {it.name} x{it.quantity} — ${it.lineTotalUSD}
          </li>
        ))}
      </ul>

      <h3>Totals</h3>
      <p>{order.totals.amountPaid} {order.totals.currency}</p>
    </div>
  );
}
