import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// CommonJS modules from your backend
const cartModule = require("../cart.service");
const checkoutModule = require("../checkout.service");
const paymentsModule = require("../payments.service");
const ordersModule = require("../orders.service");

let cartService;
let checkoutService;
let paymentsService;
let ordersService;
let productsService;
let cartsStore;
let checkoutsStore;
let paymentsStore;
let ordersStore;

beforeEach(() => {
  // Stub productsService with deterministic behavior
  productsService = {
    getProductById: async (productId) => {
      return {
        id: productId,
        name: "Test Product",
        priceUSD: 10,
        stock: 5,
        inStock: true,
        category: "Test",
      };
    },
  };

  // Create isolated stores
  cartsStore = new Map();
  checkoutsStore = new Map();
  paymentsStore = new Map();
  ordersStore = new Map();

  // Create cart service with real factory
  cartService = cartModule.createCartService({
    productsService,
    cartsStore,
    idGenerator: () => "cart-1",
  });

  // Create checkout service with factory
  checkoutService = checkoutModule.createCheckoutService({
    cartService,
    productsService,
    checkoutsStore,
    idGenerator: () => "checkout-1",
  });

  // Create payments service with factory
  paymentsService = paymentsModule.createPaymentsService({
    checkoutService,
    paymentsStore,
    idGenerator: () => "payment-1",
  });

  // Wrap paymentsService to add getPaymentById for test setup
  // (production code may not have this yet)
  const originalPaymentsService = paymentsService;
  paymentsService = {
    ...originalPaymentsService,
    getPaymentById: async (paymentId) => {
      const payment = paymentsStore.get(paymentId);
      if (!payment) {
        const { AppError } = require("../../utils/errors");
        throw new AppError("Payment not found", 404);
      }
      return payment;
    },
  };

  // Create orders service with factory
  ordersService = ordersModule.createOrdersService({
    cartService,
    checkoutService,
    paymentsService,
    ordersStore,
    idGenerator: () => "order-1",
  });
});

describe("createOrderFromPayment", () => {
  test("should create an order from a confirmed payment and set cart to checked_out", async () => {
    // Arrange: create full flow: cart → product → checkout → payment → submit → confirm
    const { cartId } = await cartService.createCart();
    await cartService.addItem(cartId, "product-1", 2);
    await cartService.updateMetadata(cartId, {
      displayCurrency: "USD",
      customer: {
        email: "test@example.com",
        name: "Test User",
        phone: "+1234567890",
      },
      exchangeRate: {
        usdToVes: 40,
        asOf: "2023-01-01T00:00:00.000Z",
      },
    });

    const checkout = await checkoutService.createCheckout(cartId);
    const checkoutId = checkout.checkoutId;

    const payment = await paymentsService.createPayment(checkoutId, "zelle");
    const paymentId = payment.paymentId;

    await paymentsService.submitPayment(paymentId, { reference: "ZELLE-REF-123" });
    await paymentsService.confirmPayment(paymentId, "Verified payment");

    // Act
    const order = await ordersService.createOrderFromPayment(paymentId);

    // Assert
    expect(order.orderId).toBe("order-1");
    expect(order.paymentId).toBe(paymentId);
    expect(order.checkoutId).toBe(checkoutId);
    expect(order.cartId).toBe(cartId);
    expect(order.status).toBe("created");

    // Verify items snapshot
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toEqual(
      expect.objectContaining({
        productId: "product-1",
        quantity: 2,
        unitPriceUSD: 10,
        lineTotalUSD: 20,
      })
    );

    // Verify totals
    expect(order.totals.subtotalUSD).toBe(20);
    expect(order.totals.subtotalVES).toBe(800);
    expect(order.totals.currency).toBe("USD");
    expect(order.totals.amountPaid).toBe(20);

    // Verify exchangeRate snapshot
    expect(order.exchangeRate).toEqual(
      expect.objectContaining({
        provider: "BCV",
        usdToVes: 40,
        asOf: "2023-01-01T00:00:00.000Z",
      })
    );

    // Verify tax snapshot
    expect(order.tax).toEqual(
      expect.objectContaining({
        priceIncludesVAT: true,
        vatRate: 0.16,
      })
    );

    // Verify customer snapshot
    expect(order.customer).toEqual(
      expect.objectContaining({
        email: "test@example.com",
        name: "Test User",
        phone: "+1234567890",
      })
    );

    // Verify payment snapshot
    expect(order.payment.method).toBe("zelle");
    expect(order.payment.proof).toEqual(
      expect.objectContaining({
        reference: "ZELLE-REF-123",
      })
    );
    expect(order.payment.review).toEqual(
      expect.objectContaining({
        note: "Verified payment",
      })
    );

    // Verify timestamps
    expect(typeof order.createdAt).toBe("string");
    expect(order.createdAt.length).toBeGreaterThan(0);
    expect(typeof order.updatedAt).toBe("string");
    expect(order.updatedAt.length).toBeGreaterThan(0);

    // Verify order is persisted
    expect(ordersStore.has("order-1")).toBe(true);

    // Verify cart status is checked_out
    const updatedCart = await cartService.getCart(cartId);
    expect(updatedCart.metadata.status).toBe("checked_out");
  });

  test("should throw 404 when payment does not exist", async () => {
    // Act + Assert
    await expect(ordersService.createOrderFromPayment("invalid-payment")).rejects.toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: "Payment not found",
      })
    );
  });

  test("should throw 409 when payment is not confirmed", async () => {
    // Arrange: create payment but keep it pending
    const { cartId } = await cartService.createCart();
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId);
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle");

    // Act + Assert: payment is still pending
    await expect(ordersService.createOrderFromPayment(payment.paymentId)).rejects.toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: "Payment is not confirmed",
      })
    );
  });

  test("should throw 409 when order already exists for payment", async () => {
    // Arrange: create confirmed payment
    const { cartId } = await cartService.createCart();
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId);
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle");
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    // Create order once
    await ordersService.createOrderFromPayment(payment.paymentId);

    // Act + Assert: try to create again
    await expect(ordersService.createOrderFromPayment(payment.paymentId)).rejects.toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: "Order already exists for payment",
      })
    );
  });
});

describe("getOrderById", () => {
  test("should return an existing order", async () => {
    // Arrange: create confirmed payment and order
    const { cartId } = await cartService.createCart();
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId);
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle");
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    const createdOrder = await ordersService.createOrderFromPayment(payment.paymentId);
    const orderId = createdOrder.orderId;

    // Act
    const order = await ordersService.getOrderById(orderId);

    // Assert
    expect(order.orderId).toBe(orderId);
    expect(order.status).toBe("created");
    expect(order.paymentId).toBe(payment.paymentId);
  });

  test("should throw 404 when order not found", async () => {
    // Act + Assert
    await expect(ordersService.getOrderById("invalid-order")).rejects.toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: "Order not found",
      })
    );
  });
});

describe("fulfillment", () => {
  // Helper to create an order in "created" status
  async function createOrderInCreatedStatus() {
    const { cartId } = await cartService.createCart();
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId);
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle");
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    const order = await ordersService.createOrderFromPayment(payment.paymentId);
    return order;
  }

  // --- processOrder ---

  test("processOrder should set status to processing and update updatedAt", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    const previousUpdatedAt = order.updatedAt;

    // Act
    const updatedOrder = await ordersService.processOrder(order.orderId);

    // Assert
    expect(updatedOrder.status).toBe("processing");
    expect(updatedOrder.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("processOrder should throw 404 when order does not exist", async () => {
    await expect(ordersService.processOrder("invalid-order")).rejects.toMatchObject({
      statusCode: 404,
      message: "Order not found",
    });
  });

  test("processOrder should throw 409 when order is not in created status", async () => {
    // Arrange: create order and process it first
    const order = await createOrderInCreatedStatus();
    await ordersService.processOrder(order.orderId);

    // Act + Assert: try to process again
    await expect(ordersService.processOrder(order.orderId)).rejects.toMatchObject({
      statusCode: 409,
      message: "Order cannot be processed",
    });
  });

  // --- completeOrder ---

  test("completeOrder should set status to completed from created and update updatedAt", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    const previousUpdatedAt = order.updatedAt;

    // Act
    const updatedOrder = await ordersService.completeOrder(order.orderId);

    // Assert
    expect(updatedOrder.status).toBe("completed");
    expect(updatedOrder.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("completeOrder should set status to completed from processing", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    await ordersService.processOrder(order.orderId);

    // Act
    const updatedOrder = await ordersService.completeOrder(order.orderId);

    // Assert
    expect(updatedOrder.status).toBe("completed");
  });

  test("completeOrder should throw 409 when order is cancelled", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    await ordersService.cancelOrder(order.orderId, "Customer requested");

    // Act + Assert
    await expect(ordersService.completeOrder(order.orderId)).rejects.toMatchObject({
      statusCode: 409,
      message: "Order cannot be completed",
    });
  });

  // --- cancelOrder ---

  test("cancelOrder should cancel an order in created status and store cancellation reason", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    const previousUpdatedAt = order.updatedAt;

    // Act
    const updatedOrder = await ordersService.cancelOrder(order.orderId, "Customer requested");

    // Assert
    expect(updatedOrder.status).toBe("cancelled");
    expect(updatedOrder.cancellation).toEqual(
      expect.objectContaining({
        reason: "Customer requested",
      })
    );
    expect(updatedOrder.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("cancelOrder should cancel an order in processing status", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    await ordersService.processOrder(order.orderId);

    // Act
    const updatedOrder = await ordersService.cancelOrder(order.orderId, "Out of stock");

    // Assert
    expect(updatedOrder.status).toBe("cancelled");
    expect(updatedOrder.cancellation.reason).toBe("Out of stock");
  });

  test("cancelOrder should throw 409 when trying to cancel a completed order", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    await ordersService.completeOrder(order.orderId);

    // Act + Assert
    await expect(ordersService.cancelOrder(order.orderId, "Changed mind")).rejects.toMatchObject({
      statusCode: 409,
      message: "Order cannot be cancelled",
    });
  });

  test("cancelOrder should throw 400 when reason is invalid", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();

    // Act + Assert: empty string
    await expect(ordersService.cancelOrder(order.orderId, "")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid cancellation reason",
    });

    // Act + Assert: whitespace only
    await expect(ordersService.cancelOrder(order.orderId, "   ")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid cancellation reason",
    });
  });
});
