/**
 * Order Status Constants
 * 
 * Centralized order status strings.
 * Orders are created from confirmed payments with status "paid".
 */

const OrderStatus = {
  PAID: "paid",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

module.exports = { OrderStatus };
