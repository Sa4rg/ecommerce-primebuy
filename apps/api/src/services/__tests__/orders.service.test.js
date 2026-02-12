import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";
import { OrderStatus } from "../../constants/orderStatus.js";
import { ShippingStatus } from "../../constants/shippingStatus.js";


const require = createRequire(import.meta.url);

// Test user ID for ownership tests
const TEST_USER_ID = "user-123";

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
    cartService,
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
    const { cartId } = await cartService.createCart(TEST_USER_ID);
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

    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID );
    const checkoutId = checkout.checkoutId;

    // Complete checkout with customer and shipping (required for payment)
    await checkoutService.updateCustomer(checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });

    const payment = await paymentsService.createPayment(checkoutId, "zelle", TEST_USER_ID);
    const paymentId = payment.paymentId;

    await paymentsService.submitPayment(paymentId, { reference: "ZELLE-REF-123" });
    await paymentsService.confirmPayment(paymentId, "Verified payment");

    // Act
    const order = await ordersService.createOrderFromPayment(paymentId, TEST_USER_ID);

    // Assert
    expect(order.orderId).toBe("order-1");
    expect(order.paymentId).toBe(paymentId);
    expect(order.checkoutId).toBe(checkoutId);
    expect(order.cartId).toBe(cartId);
    expect(order.status).toBe(OrderStatus.PAID);

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
    await expect(ordersService.createOrderFromPayment("invalid-payment", TEST_USER_ID)).rejects.toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: "Payment not found",
      })
    );
  });

  test("should throw 409 when payment is not confirmed", async () => {
    // Arrange: create payment but keep it pending
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID );
    await checkoutService.updateCustomer(checkout.checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkout.checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle", TEST_USER_ID);

    // Act + Assert: payment is still pending
    await expect(ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID)).rejects.toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: "Payment is not confirmed",
      })
    );
  });

  test("should throw 409 when order already exists for payment", async () => {
    // Arrange: create confirmed payment
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID );
    await checkoutService.updateCustomer(checkout.checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkout.checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle", TEST_USER_ID);
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    // Create order once
    await ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID);

    // Act + Assert: try to create again
    await expect(ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID)).rejects.toEqual(
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
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID );
    await checkoutService.updateCustomer(checkout.checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkout.checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle", TEST_USER_ID);
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    const createdOrder = await ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID);
    const orderId = createdOrder.orderId;

    // Act
    const order = await ordersService.getOrderById(orderId);

    // Assert
    expect(order.orderId).toBe(orderId);
    expect(order.status).toBe(OrderStatus.PAID);
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
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId,  TEST_USER_ID );
    await checkoutService.updateCustomer(checkout.checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkout.checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle", TEST_USER_ID);
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    const order = await ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID);
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

  test("processOrder should throw 409 when order is not in paid status", async () => {
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

  test("completeOrder should set status to completed from paid and update updatedAt", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    const previousUpdatedAt = order.updatedAt;

    // Act
    const updatedOrder = await ordersService.completeOrder(order.orderId);

    // Assert
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);
    expect(updatedOrder.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("completeOrder should set status to completed from processing", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    await ordersService.processOrder(order.orderId);

    // Act
    const updatedOrder = await ordersService.completeOrder(order.orderId);

    // Assert
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);
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

  test("cancelOrder should cancel an order in paid status and store cancellation reason", async () => {
    // Arrange
    const order = await createOrderInCreatedStatus();
    const previousUpdatedAt = order.updatedAt;

    // Act
    const updatedOrder = await ordersService.cancelOrder(order.orderId, "Customer requested");

    // Assert
    expect(updatedOrder.status).toBe(OrderStatus.CANCELLED);
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
    expect(updatedOrder.status).toBe(OrderStatus.CANCELLED);
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

describe("shipping", () => {
  // Helper to create an order in "created" status for shipping tests
  async function createOrderForShipping() {
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, {
      customer: { email: "test@example.com", name: "Test", phone: "+123" },
    });

    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID);
    await checkoutService.updateCustomer(checkout.checkoutId, TEST_USER_ID, {
      name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });
    await checkoutService.updateShipping(checkout.checkoutId, TEST_USER_ID, {
      method: "delivery",
      address: {
        recipientName: "Test User",
        phone: "+1234567890",
        state: "Test State",
        city: "Test City",
        line1: "123 Test St",
        reference: "Near the park",
      },
    });
    const payment = await paymentsService.createPayment(checkout.checkoutId, "zelle", TEST_USER_ID);
    await paymentsService.submitPayment(payment.paymentId, { reference: "REF-123" });
    await paymentsService.confirmPayment(payment.paymentId, null);

    const order = await ordersService.createOrderFromPayment(payment.paymentId, TEST_USER_ID);
    return order;
  }

  // Valid address for tests
  const validAddress = {
    recipientName: "John Doe",
    phone: "+584141234567",
    state: "Miranda",
    city: "Caracas",
    line1: "Av. Principal, Edificio Centro",
    reference: "Frente al banco",
  };

  // --- Default shipping on order creation ---

  test("should create orders with default shipping state", async () => {
    // Arrange + Act
    const order = await createOrderForShipping();

    // Assert
    expect(order.shipping).toBeDefined();
    expect(order.shipping.status).toBe(ShippingStatus.PENDING);
    expect(order.shipping.method).toBeNull();
    expect(order.shipping.address).toBeNull();
    expect(order.shipping.carrier).toEqual({ name: null, trackingNumber: null });
    expect(order.shipping.dispatchedAt).toBeNull();
    expect(order.shipping.deliveredAt).toBeNull();
  });

  // --- setShippingDetails ---

  test("setShippingDetails should set shipping method pickup with null address", async () => {
    // Arrange
    const order = await createOrderForShipping();

    // Act
    const updatedOrder = await ordersService.setShippingDetails(order.orderId, {
      method: "pickup",
      address: null,
    });

    // Assert
    expect(updatedOrder.shipping.method).toBe("pickup");
    expect(updatedOrder.shipping.address).toBeNull();
    expect(updatedOrder.shipping.status).toBe(ShippingStatus.PENDING);
  });

  test("setShippingDetails should set shipping method local_delivery with valid address", async () => {
    // Arrange
    const order = await createOrderForShipping();

    // Act
    const updatedOrder = await ordersService.setShippingDetails(order.orderId, {
      method: "local_delivery",
      address: validAddress,
    });

    // Assert
    expect(updatedOrder.shipping.method).toBe("local_delivery");
    expect(updatedOrder.shipping.address).toEqual(
      expect.objectContaining({
        recipientName: "John Doe",
        phone: "+584141234567",
        state: "Miranda",
        city: "Caracas",
        line1: "Av. Principal, Edificio Centro",
      })
    );
  });

  test("setShippingDetails should throw 400 when method is invalid", async () => {
    // Arrange
    const order = await createOrderForShipping();

    // Act + Assert
    await expect(
      ordersService.setShippingDetails(order.orderId, {
        method: "airdrop",
        address: null,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid shipping details",
    });
  });

  test("setShippingDetails should throw 400 when address is missing for local_delivery", async () => {
    // Arrange
    const order = await createOrderForShipping();

    // Act + Assert
    await expect(
      ordersService.setShippingDetails(order.orderId, {
        method: "local_delivery",
        address: null,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid shipping details",
    });
  });

  test("setShippingDetails should throw 400 when required address fields are missing", async () => {
    // Arrange
    const order = await createOrderForShipping();
    const incompleteAddress = {
      recipientName: "John Doe",
      // missing phone, state, city, line1
    };

    // Act + Assert
    await expect(
      ordersService.setShippingDetails(order.orderId, {
        method: "national_shipping",
        address: incompleteAddress,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid shipping details",
    });
  });

  test("setShippingDetails should throw 409 when setting shipping on a completed order", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.completeOrder(order.orderId);

    // Act + Assert
    await expect(
      ordersService.setShippingDetails(order.orderId, {
        method: "pickup",
        address: null,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Order cannot be updated for shipping",
    });
  });

  test("setShippingDetails should throw 409 when setting shipping on a cancelled order", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.cancelOrder(order.orderId, "Test cancellation");

    // Act + Assert
    await expect(
      ordersService.setShippingDetails(order.orderId, {
        method: "pickup",
        address: null,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Order cannot be updated for shipping",
    });
  });

  // --- markDispatched ---

  test("markDispatched should mark dispatched for local_delivery without carrier/tracking", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.setShippingDetails(order.orderId, {
      method: "local_delivery",
      address: validAddress,
    });

    // Act
    const updatedOrder = await ordersService.markDispatched(order.orderId, null);

    // Assert
    expect(updatedOrder.shipping.status).toBe(ShippingStatus.DISPATCHED);
    expect(typeof updatedOrder.shipping.dispatchedAt).toBe("string");
    expect(updatedOrder.shipping.dispatchedAt.length).toBeGreaterThan(0);
    expect(updatedOrder.shipping.carrier).toEqual({ name: null, trackingNumber: null });
  });

  test("markDispatched should require carrier and tracking for national_shipping", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.setShippingDetails(order.orderId, {
      method: "national_shipping",
      address: validAddress,
    });

    // Act + Assert: null carrier should fail
    await expect(ordersService.markDispatched(order.orderId, null)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid shipping carrier",
    });

    // Act: valid carrier should succeed
    const updatedOrder = await ordersService.markDispatched(order.orderId, {
      name: "MRW",
      trackingNumber: "123456789",
    });

    // Assert
    expect(updatedOrder.shipping.status).toBe(ShippingStatus.DISPATCHED);
    expect(updatedOrder.shipping.carrier).toEqual({
      name: "MRW",
      trackingNumber: "123456789",
    });
  });

  test("markDispatched should throw 409 when shipping is not pending", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.setShippingDetails(order.orderId, {
      method: "pickup",
      address: null,
    });
    await ordersService.markDispatched(order.orderId, null);

    // Act + Assert: try to dispatch again
    await expect(ordersService.markDispatched(order.orderId, null)).rejects.toMatchObject({
      statusCode: 409,
      message: "Shipping cannot be dispatched",
    });
  });

  // --- markDelivered ---

  test("markDelivered should mark delivered only from dispatched and auto-complete order", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.setShippingDetails(order.orderId, {
      method: "pickup",
      address: null,
    });
    await ordersService.markDispatched(order.orderId, null);

    // Act
    const updatedOrder = await ordersService.markDelivered(order.orderId);

    // Assert
    expect(updatedOrder.shipping.status).toBe(ShippingStatus.DELIVERED);
    expect(typeof updatedOrder.shipping.deliveredAt).toBe("string");
    expect(updatedOrder.shipping.deliveredAt.length).toBeGreaterThan(0);
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);
  });

  test("markDelivered should throw 409 when shipping is not dispatched", async () => {
    // Arrange
    const order = await createOrderForShipping();
    await ordersService.setShippingDetails(order.orderId, {
      method: "pickup",
      address: null,
    });
    // Note: NOT dispatching

    // Act + Assert
    await expect(ordersService.markDelivered(order.orderId)).rejects.toMatchObject({
      statusCode: 409,
      message: "Shipping cannot be delivered",
    });
  });
});
