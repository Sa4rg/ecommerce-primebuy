import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";
import { PaymentStatus } from "../../constants/paymentStatus.js";

const require = createRequire(import.meta.url);

// CommonJS modules from your backend
const paymentsModule = require("../payments.service");

let paymentsService;
let checkoutService;
let paymentsStore;
let checkoutsStore;
const TEST_USER_ID = "user-test-1";

beforeEach(() => {
  // Stub checkoutService with DI
  checkoutsStore = new Map();
  
  checkoutService = {
    getCheckoutById: async (checkoutId) => {
      const checkout = checkoutsStore.get(checkoutId);
      if (!checkout) {
        const { AppError } = require("../../utils/errors");
        throw new AppError("Checkout not found", 404);
      }
      return checkout;
    },
  };

  // Create isolated paymentsStore
  paymentsStore = new Map();

  // Create payments service with factory
  paymentsService = paymentsModule.createPaymentsService({
    checkoutService,
    paymentsStore,
    idGenerator: () => "payment-1",
  });
});

describe("createPayment", () => {
  test("should create a USD payment for zelle using subtotalUSD", async () => {
    // Arrange: create a checkout with both USD and VES totals
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
      exchangeRate: { provider: "BCV", usdToVes: 40, asOf: "2023-01-01" },
      paymentMethods: { usd: ["zelle", "zinli"], ves: ["pago_movil", "bank_transfer"] },
    };
    checkoutsStore.set("checkout-1", checkout);

    // Act
    const payment = await paymentsService.createPayment("checkout-1", "zelle");

    // Assert
    expect(payment.paymentId).toBe("payment-1");
    expect(payment.checkoutId).toBe("checkout-1");
    expect(payment.method).toBe("zelle");
    expect(payment.currency).toBe("USD");
    expect(payment.amount).toBe(20);
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.proof).toBeNull();
    expect(typeof payment.createdAt).toBe("string");
    expect(typeof payment.updatedAt).toBe("string");
    expect(paymentsStore.has("payment-1")).toBe(true);
  });

  test("should create a VES payment for pago_movil using subtotalVES", async () => {
    // Arrange: create a checkout
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
      exchangeRate: { provider: "BCV", usdToVes: 40, asOf: "2023-01-01" },
      paymentMethods: { usd: ["zelle", "zinli"], ves: ["pago_movil", "bank_transfer"] },
    };
    checkoutsStore.set("checkout-1", checkout);

    // Act
    const payment = await paymentsService.createPayment("checkout-1", "pago_movil");

    // Assert
    expect(payment.method).toBe("pago_movil");
    expect(payment.currency).toBe("VES");
    expect(payment.amount).toBe(800);
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });

  test("should throw 400 when method is invalid", async () => {
    // Arrange
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    // Act + Assert
    await expect(
      paymentsService.createPayment("checkout-1", "cash")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment method",
    });
  });

  test("should throw 404 when checkout does not exist", async () => {
    // Act + Assert
    await expect(
      paymentsService.createPayment("invalid-checkout", "zelle")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Checkout not found",
    });
  });

  test("should throw 400 when VES method requires exchange rate but subtotalVES is null", async () => {
    // Arrange: checkout without exchange rate (subtotalVES is null)
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: null },
      exchangeRate: null,
    };
    checkoutsStore.set("checkout-1", checkout);

    // Act + Assert
    await expect(
      paymentsService.createPayment("checkout-1", "pago_movil")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Exchange rate required",
    });
  });
});

describe("submitPayment", () => {
  test("should submit a pending payment and set status submitted + store proof", async () => {
    // Arrange: create checkout and payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    const createdPayment = await paymentsService.createPayment("checkout-1", "zelle");
    const initialUpdatedAt = createdPayment.updatedAt;

    // Act
    const submittedPayment = await paymentsService.submitPayment("payment-1", {
      reference: "ABC123",
    });

    // Assert
    expect(submittedPayment.status).toBe(PaymentStatus.SUBMITTED);
    expect(submittedPayment.proof).toEqual({ reference: "ABC123" });
    expect(submittedPayment.updatedAt).not.toBe(initialUpdatedAt);
    expect(typeof submittedPayment.updatedAt).toBe("string");
  });

  test("should throw 404 when payment not found", async () => {
    // Act + Assert
    await expect(
      paymentsService.submitPayment("invalid-payment", { reference: "X" })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Payment not found",
    });
  });

  test("should throw 409 when payment is not pending", async () => {
    // Arrange: create and submit payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    await paymentsService.submitPayment("payment-1", { reference: "ABC123" });

    // Act + Assert: try to submit again
    await expect(
      paymentsService.submitPayment("payment-1", { reference: "XYZ789" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Payment is not pending",
    });
  });

  test("should throw 400 when proof is invalid", async () => {
    // Arrange: create payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");

    // Act + Assert: submit with invalid proof (no reference)
    await expect(
      paymentsService.submitPayment("payment-1", {})
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment proof",
    });
  });
});

describe("admin review", () => {
  test("confirmPayment should confirm a submitted payment and update updatedAt", async () => {
    // Arrange: create checkout and payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    const submittedPayment = await paymentsService.submitPayment("payment-1", {
      reference: "ABC123",
    });
    const previousUpdatedAt = submittedPayment.updatedAt;

    // Act
    const confirmedPayment = await paymentsService.confirmPayment("payment-1", "Confirmed in bank");

    // Assert
    expect(confirmedPayment.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmedPayment.review.note).toBe("Confirmed in bank");
    expect(confirmedPayment.updatedAt).not.toBe(previousUpdatedAt);
    expect(typeof confirmedPayment.updatedAt).toBe("string");
  });

  test("confirmPayment should allow null/undefined note and still confirm", async () => {
    // Arrange: create checkout and payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    const submittedPayment = await paymentsService.submitPayment("payment-1", {
      reference: "ABC123",
    });
    const previousUpdatedAt = submittedPayment.updatedAt;

    // Act
    const confirmedPayment = await paymentsService.confirmPayment("payment-1");

    // Assert
    expect(confirmedPayment.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmedPayment.review.note).toBeNull();
    expect(confirmedPayment.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("confirmPayment should throw 404 when payment not found", async () => {
    // Act + Assert
    await expect(
      paymentsService.confirmPayment("invalid-payment", "x")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Payment not found",
    });
  });

  test("confirmPayment should throw 409 when payment is not submitted", async () => {
    // Arrange: create payment (still pending)
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");

    // Act + Assert
    await expect(
      paymentsService.confirmPayment("payment-1", "x")
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Payment is not submitted",
    });
  });

  test("confirmPayment should throw 400 when note is invalid", async () => {
    // Arrange: create and submit payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    await paymentsService.submitPayment("payment-1", { reference: "ABC123" });

    // Act + Assert
    await expect(
      paymentsService.confirmPayment("payment-1", "")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment review",
    });

    await expect(
      paymentsService.confirmPayment("payment-1", "   ")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment review",
    });
  });

  test("rejectPayment should reject a submitted payment and update updatedAt", async () => {
    // Arrange: create checkout and payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    const submittedPayment = await paymentsService.submitPayment("payment-1", {
      reference: "ABC123",
    });
    const previousUpdatedAt = submittedPayment.updatedAt;

    // Act
    const rejectedPayment = await paymentsService.rejectPayment("payment-1", "Reference not found");

    // Assert
    expect(rejectedPayment.status).toBe(PaymentStatus.REJECTED);
    expect(rejectedPayment.review.reason).toBe("Reference not found");
    expect(rejectedPayment.updatedAt).not.toBe(previousUpdatedAt);
    expect(typeof rejectedPayment.updatedAt).toBe("string");
  });

  test("rejectPayment should throw 404 when payment not found", async () => {
    // Act + Assert
    await expect(
      paymentsService.rejectPayment("invalid-payment", "x")
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Payment not found",
    });
  });

  test("rejectPayment should throw 409 when payment is not submitted", async () => {
    // Arrange: create payment (still pending)
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");

    // Act + Assert
    await expect(
      paymentsService.rejectPayment("payment-1", "x")
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Payment is not submitted",
    });
  });

  test("rejectPayment should throw 400 when reason is invalid", async () => {
    // Arrange: create and submit payment
    const checkout = {
      checkoutId: "checkout-1",
      cartId: "cart-1",
      totals: { subtotalUSD: 20, subtotalVES: 800 },
    };
    checkoutsStore.set("checkout-1", checkout);

    await paymentsService.createPayment("checkout-1", "zelle");
    await paymentsService.submitPayment("payment-1", { reference: "ABC123" });

    // Act + Assert
    await expect(
      paymentsService.rejectPayment("payment-1", "")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment review",
    });

    await expect(
      paymentsService.rejectPayment("payment-1", "   ")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid payment review",
    });
  });
});
