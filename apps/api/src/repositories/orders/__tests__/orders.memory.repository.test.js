import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryOrdersRepository } from "../orders.memory.repository";

describe("InMemoryOrdersRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryOrdersRepository();
  });

  test("create(order) should store the order and return { orderId }", async () => {
    const order = {
      orderId: "order-123",
      cartId: "cart-456",
      checkoutId: "checkout-789",
      paymentId: "payment-abc",
      status: "created",
      items: [
        {
          productId: "1",
          name: "Laptop",
          unitPriceUSD: 1000,
          quantity: 1,
          lineTotalUSD: 1000,
        },
      ],
      totals: {
        subtotalUSD: 1000,
        subtotalVES: null,
        currency: "USD",
        amountPaid: 1000,
      },
      exchangeRate: null,
      tax: { priceIncludesVAT: true, vatRate: 0.16 },
      customer: { email: "test@example.com", name: "John Doe", phone: null },
      payment: {
        method: "zelle",
        proof: { reference: "REF123" },
        review: { note: null },
      },
      shipping: {
        method: null,
        address: null,
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    const result = await repo.create(order);

    expect(result).toEqual({ orderId: "order-123" });
  });

  test("findById(orderId) should return the stored order", async () => {
    const order = {
      orderId: "order-456",
      cartId: "cart-789",
      checkoutId: "checkout-abc",
      paymentId: "payment-def",
      status: "processing",
      items: [
        {
          productId: "2",
          name: "Mouse",
          unitPriceUSD: 20,
          quantity: 2,
          lineTotalUSD: 40,
        },
      ],
      totals: {
        subtotalUSD: 40,
        subtotalVES: 1440,
        currency: "VES",
        amountPaid: 1440,
      },
      exchangeRate: { provider: "BCV", usdToVes: 36.0, asOf: "2026-01-12T00:00:00.000Z" },
      tax: { priceIncludesVAT: true, vatRate: 0.16 },
      customer: { email: "customer@example.com", name: "Jane Smith", phone: "+58424" },
      payment: {
        method: "pago_movil",
        proof: { reference: "PAGO123" },
        review: { note: "Approved" },
      },
      shipping: {
        method: "local_delivery",
        address: {
          recipientName: "Jane Smith",
          phone: "+58424",
          state: "Miranda",
          city: "Caracas",
          line1: "Calle Principal",
          reference: "Casa azul",
        },
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T01:00:00.000Z",
    };

    await repo.create(order);

    const found = await repo.findById("order-456");

    expect(found).toEqual(order);
    expect(found).toBe(order); // Same reference
  });

  test("findById(nonexistent) should return null", async () => {
    const found = await repo.findById("nonexistent-order-id");

    expect(found).toBeNull();
  });

  test("save(order) should overwrite existing order state", async () => {
    const order = {
      orderId: "order-update",
      cartId: "cart-xyz",
      checkoutId: "checkout-xyz",
      paymentId: "payment-xyz",
      status: "created",
      items: [
        {
          productId: "3",
          name: "Keyboard",
          unitPriceUSD: 50,
          quantity: 1,
          lineTotalUSD: 50,
        },
      ],
      totals: {
        subtotalUSD: 50,
        subtotalVES: null,
        currency: "USD",
        amountPaid: 50,
      },
      exchangeRate: null,
      tax: { priceIncludesVAT: true, vatRate: 0.16 },
      customer: { email: null, name: null, phone: null },
      payment: {
        method: "zinli",
        proof: { reference: "ZINLI999" },
        review: { note: null },
      },
      shipping: {
        method: null,
        address: null,
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    await repo.create(order);

    // Mutate order (simulate processing)
    const updatedOrder = {
      ...order,
      status: "processing",
      updatedAt: "2026-01-12T02:00:00.000Z",
    };

    await repo.save(updatedOrder);

    const found = await repo.findById("order-update");

    expect(found).toEqual(updatedOrder);
    expect(found.status).toBe("processing");
    expect(found.updatedAt).toBe("2026-01-12T02:00:00.000Z");
  });

  test("save(order) preserves reference behavior for service mutations", async () => {
    const order = {
      orderId: "order-ref",
      cartId: "cart-ref",
      checkoutId: "checkout-ref",
      paymentId: "payment-ref",
      status: "created",
      items: [],
      totals: { subtotalUSD: 100, subtotalVES: null, currency: "USD", amountPaid: 100 },
      exchangeRate: null,
      tax: { priceIncludesVAT: true, vatRate: 0.16 },
      customer: { email: null, name: null, phone: null },
      payment: { method: "zelle", proof: null, review: {} },
      shipping: {
        method: null,
        address: null,
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    await repo.create(order);

    const retrieved = await repo.findById("order-ref");

    // Mutate the retrieved object (as service does)
    retrieved.status = "completed";
    retrieved.shipping.method = "pickup";
    retrieved.shipping.status = "delivered";
    retrieved.updatedAt = "2026-01-12T03:00:00.000Z";

    await repo.save(retrieved);

    const found = await repo.findById("order-ref");

    expect(found.status).toBe("completed");
    expect(found.shipping.method).toBe("pickup");
    expect(found.shipping.status).toBe("delivered");
    expect(found).toBe(retrieved); // Same reference
  });

  test("save(order) with shipping details", async () => {
    const order = {
      orderId: "order-ship",
      cartId: "cart-ship",
      checkoutId: "checkout-ship",
      paymentId: "payment-ship",
      status: "processing",
      items: [],
      totals: { subtotalUSD: 200, subtotalVES: 7200, currency: "VES", amountPaid: 7200 },
      exchangeRate: { provider: "BCV", usdToVes: 36.0, asOf: "2026-01-12T00:00:00.000Z" },
      tax: { priceIncludesVAT: true, vatRate: 0.16 },
      customer: { email: "ship@example.com", name: "Shipper", phone: "+584241234567" },
      payment: { method: "bank_transfer", proof: { reference: "BANK777" }, review: {} },
      shipping: {
        method: null,
        address: null,
        carrier: { name: null, trackingNumber: null },
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    await repo.create(order);

    const retrieved = await repo.findById("order-ship");

    // Add shipping details
    retrieved.shipping.method = "national_shipping";
    retrieved.shipping.address = {
      recipientName: "Shipper",
      phone: "+584241234567",
      state: "Zulia",
      city: "Maracaibo",
      line1: "Av. Principal",
      reference: "Edificio azul",
    };
    retrieved.shipping.carrier = { name: "MRW", trackingNumber: "MRW12345" };
    retrieved.shipping.status = "dispatched";
    retrieved.shipping.dispatchedAt = "2026-01-12T04:00:00.000Z";
    retrieved.updatedAt = "2026-01-12T04:00:00.000Z";

    await repo.save(retrieved);

    const found = await repo.findById("order-ship");

    expect(found.shipping.method).toBe("national_shipping");
    expect(found.shipping.address).toEqual({
      recipientName: "Shipper",
      phone: "+584241234567",
      state: "Zulia",
      city: "Maracaibo",
      line1: "Av. Principal",
      reference: "Edificio azul",
    });
    expect(found.shipping.carrier).toEqual({ name: "MRW", trackingNumber: "MRW12345" });
    expect(found.shipping.status).toBe("dispatched");
    expect(found.shipping.dispatchedAt).toBe("2026-01-12T04:00:00.000Z");
  });
});
