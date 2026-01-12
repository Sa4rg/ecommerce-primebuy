import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryPaymentsRepository } from "../payments.memory.repository";

describe("InMemoryPaymentsRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryPaymentsRepository();
  });

  test("create(payment) should store the payment and return { paymentId }", async () => {
    const payment = {
      paymentId: "payment-123",
      checkoutId: "checkout-456",
      method: "zelle",
      currency: "USD",
      amount: 1000,
      status: "pending",
      proof: null,
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    const result = await repo.create(payment);

    expect(result).toEqual({ paymentId: "payment-123" });
  });

  test("findById(paymentId) should return the stored payment", async () => {
    const payment = {
      paymentId: "payment-789",
      checkoutId: "checkout-abc",
      method: "pago_movil",
      currency: "VES",
      amount: 36000,
      status: "submitted",
      proof: {
        reference: "REF123456",
        date: "2026-01-12",
      },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T01:00:00.000Z",
    };

    await repo.create(payment);

    const found = await repo.findById("payment-789");

    expect(found).toEqual(payment);
    expect(found).toBe(payment); // Same reference
  });

  test("findById(nonexistent) should return null", async () => {
    const found = await repo.findById("nonexistent-payment-id");

    expect(found).toBeNull();
  });

  test("save(payment) should overwrite existing payment state", async () => {
    const payment = {
      paymentId: "payment-update",
      checkoutId: "checkout-xyz",
      method: "zinli",
      currency: "USD",
      amount: 500,
      status: "pending",
      proof: null,
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    await repo.create(payment);

    // Mutate payment (simulate submission)
    const updatedPayment = {
      ...payment,
      status: "submitted",
      proof: {
        reference: "ZINLI-987654",
      },
      updatedAt: "2026-01-12T02:00:00.000Z",
    };

    await repo.save(updatedPayment);

    const found = await repo.findById("payment-update");

    expect(found).toEqual(updatedPayment);
    expect(found.status).toBe("submitted");
    expect(found.proof).toEqual({ reference: "ZINLI-987654" });
  });

  test("save(payment) preserves reference behavior for service mutations", async () => {
    const payment = {
      paymentId: "payment-ref",
      checkoutId: "checkout-ref",
      method: "bank_transfer",
      currency: "VES",
      amount: 18000,
      status: "pending",
      proof: null,
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T00:00:00.000Z",
    };

    await repo.create(payment);

    const retrieved = await repo.findById("payment-ref");

    // Mutate the retrieved object (as service does)
    retrieved.status = "submitted";
    retrieved.proof = { reference: "TRANSFER-001" };
    retrieved.updatedAt = "2026-01-12T03:00:00.000Z";

    await repo.save(retrieved);

    const found = await repo.findById("payment-ref");

    expect(found.status).toBe("submitted");
    expect(found.proof).toEqual({ reference: "TRANSFER-001" });
    expect(found).toBe(retrieved); // Same reference
  });

  test("save(payment) with review field (confirmed)", async () => {
    const payment = {
      paymentId: "payment-confirm",
      checkoutId: "checkout-123",
      method: "zelle",
      currency: "USD",
      amount: 250,
      status: "submitted",
      proof: { reference: "ZELLE-111" },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T01:00:00.000Z",
    };

    await repo.create(payment);

    const retrieved = await repo.findById("payment-confirm");

    // Admin confirms
    retrieved.status = "confirmed";
    retrieved.review = { note: "Verified" };
    retrieved.updatedAt = "2026-01-12T04:00:00.000Z";

    await repo.save(retrieved);

    const found = await repo.findById("payment-confirm");

    expect(found.status).toBe("confirmed");
    expect(found.review).toEqual({ note: "Verified" });
  });

  test("save(payment) with review field (rejected)", async () => {
    const payment = {
      paymentId: "payment-reject",
      checkoutId: "checkout-456",
      method: "pago_movil",
      currency: "VES",
      amount: 9000,
      status: "submitted",
      proof: { reference: "PAGO-222" },
      createdAt: "2026-01-12T00:00:00.000Z",
      updatedAt: "2026-01-12T01:00:00.000Z",
    };

    await repo.create(payment);

    const retrieved = await repo.findById("payment-reject");

    // Admin rejects
    retrieved.status = "rejected";
    retrieved.review = { reason: "Invalid reference" };
    retrieved.updatedAt = "2026-01-12T05:00:00.000Z";

    await repo.save(retrieved);

    const found = await repo.findById("payment-reject");

    expect(found.status).toBe("rejected");
    expect(found.review).toEqual({ reason: "Invalid reference" });
  });
});
