import { describe, test, expect, beforeEach } from "vitest";
import { createPaymentsService } from "../services/payments.service.js";
import { PaymentStatus } from "../constants/paymentStatus.js";

/**
 * Test: Compensation when order creation fails
 * 
 * This test validates that if createOrderFromPayment fails after
 * confirming a payment, the payment is reverted to SUBMITTED status.
 * This prevents inconsistent state (CONFIRMED payment without order).
 */
describe("Payment confirmation compensation", () => {
  let paymentsService;
  let paymentsRepository;

  // Mock checkout service
  const mockCheckoutService = {
    findById: async () => ({
      checkoutId: "checkout-1",
      cartId: "cart-1",
      status: "pending",
      totals: { subtotalUSD: 100, subtotalVES: 5000 },
      customer: { name: "Test", email: "test@example.com", phone: "123" },
      shipping: { method: "delivery", address: { line1: "123 St" } },
    }),
  };

  // Mock cart service
  const mockCartService = {
    getCart: async () => ({
      cartId: "cart-1",
      userId: "user-1",
      items: [{ productId: "p1", quantity: 1 }],
    }),
    lockCart: async () => {},
  };

  beforeEach(() => {
    // Fresh in-memory repository for each test
    const { InMemoryPaymentsRepository } = require("../repositories/payments/payments.memory.repository.js");
    paymentsRepository = new InMemoryPaymentsRepository();

    paymentsService = createPaymentsService({
      paymentsRepository,
      checkoutService: mockCheckoutService,
      cartService: mockCartService,
    });
  });

  test("should revert payment to SUBMITTED if order creation fails", async () => {
    // 1) Create a payment in SUBMITTED status
    const payment = await paymentsService.createPayment("checkout-1", "zelle", "user-1");
    const paymentId = payment.paymentId;

    // Submit the payment
    await paymentsService.submitPayment(paymentId, { reference: "REF-123" });

    // Verify it's SUBMITTED
    let currentPayment = await paymentsService.getPaymentById(paymentId);
    expect(currentPayment.status).toBe(PaymentStatus.SUBMITTED);

    // 2) Inject a failing ordersService
    paymentsService.setOrdersService({
      createOrderFromPayment: async () => {
        throw new Error("Database connection failed");
      },
    });

    // 3) Try to confirm - should fail
    await expect(paymentsService.confirmPayment(paymentId, "Approved")).rejects.toThrow(
      "Order creation failed after payment confirmation"
    );

    // 4) Verify payment is back to SUBMITTED (not CONFIRMED)
    currentPayment = await paymentsService.getPaymentById(paymentId);
    expect(currentPayment.status).toBe(PaymentStatus.SUBMITTED);
    expect(currentPayment.review.orderCreationFailed).toBe(true);
  });

  test("should successfully confirm payment when order creation succeeds", async () => {
    // 1) Create a payment in SUBMITTED status
    const payment = await paymentsService.createPayment("checkout-1", "zelle", "user-1");
    const paymentId = payment.paymentId;

    // Submit the payment
    await paymentsService.submitPayment(paymentId, { reference: "REF-123" });

    // 2) Inject a working ordersService
    paymentsService.setOrdersService({
      createOrderFromPayment: async (pId, userId) => ({
        orderId: "order-1",
        paymentId: pId,
        userId,
        status: "pending",
      }),
      getOrderByPaymentId: async () => ({
        orderId: "order-1",
      }),
    });

    // 3) Confirm payment
    const result = await paymentsService.confirmPayment(paymentId, "Looks good");

    // 4) Verify payment is CONFIRMED and order was created
    expect(result.payment.status).toBe(PaymentStatus.CONFIRMED);
    expect(result.order).toBeDefined();
    expect(result.order.orderId).toBe("order-1");

    // Double-check in repository
    const currentPayment = await paymentsService.getPaymentById(paymentId);
    expect(currentPayment.status).toBe(PaymentStatus.CONFIRMED);
  });

  test("should return order as null when ordersService is not initialized", async () => {
    // 1) Create a payment in SUBMITTED status
    const payment = await paymentsService.createPayment("checkout-1", "zelle", "user-1");
    const paymentId = payment.paymentId;

    // Submit the payment
    await paymentsService.submitPayment(paymentId, { reference: "REF-123" });

    // 2) Don't inject ordersService (it's null by default)
    // paymentsService.setOrdersService(null); // already null

    // 3) Confirm - should succeed with order: null
    const result = await paymentsService.confirmPayment(paymentId, null);

    // 4) Verify payment is CONFIRMED and order is null
    expect(result.payment.status).toBe(PaymentStatus.CONFIRMED);
    expect(result.order).toBeNull();
  });
});
