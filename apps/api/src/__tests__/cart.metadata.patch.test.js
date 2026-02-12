import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("PATCH /api/cart/:cartId/metadata", () => {
  test("should patch cart metadata and return updated cart", async () => {
    // Create cart
    const createResponse = await request(app).post("/api/cart");

    expect(createResponse.status).toBe(201);
    const cartId = createResponse.body.data.cartId;
    const cartSecret = createResponse.body.data.cartSecret;

    // Get cart to capture previousUpdatedAt
    const getResponse = await request(app).get(`/api/cart/${cartId}`);

    expect(getResponse.status).toBe(200);
    const previousUpdatedAt = getResponse.body.data.metadata.updatedAt;

    // Patch metadata
    const patchResponse = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set("X-Cart-Secret", cartSecret)
      .send({
        customer: { email: "test@example.com" },
        displayCurrency: "VES",
        exchangeRate: { usdToVes: 40, asOf: "2023-01-01T00:00:00.000Z" },
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(patchResponse.body.data.cartId).toBe(cartId);
    expect(patchResponse.body.data.metadata.displayCurrency).toBe("VES");
    expect(patchResponse.body.data.metadata.customer.email).toBe("test@example.com");
    expect(patchResponse.body.data.metadata.exchangeRate.usdToVes).toBe(40);
    expect(patchResponse.body.data.metadata.exchangeRate.asOf).toBe(
      "2023-01-01T00:00:00.000Z"
    );
    expect(patchResponse.body.data.metadata.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("should return 404 when cart does not exist", async () => {
    const response = await request(app)
      .patch("/api/cart/invalid-cart-id/metadata")
      .send({ displayCurrency: "USD" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found",
      })
    );
  });

  test("should return 400 when displayCurrency is invalid", async () => {
    // Create cart
    const createResponse = await request(app).post("/api/cart");

    expect(createResponse.status).toBe(201);
    const cartId = createResponse.body.data.cartId;
    const cartSecret = createResponse.body.data.cartSecret;

    const response = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set("X-Cart-Secret", cartSecret)
      .send({ displayCurrency: "EUR" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid cart metadata",
      })
    );
  });

  test("should return 400 when displayCurrency is VES but exchangeRate is missing or invalid", async () => {
    // Create cart
    const createResponse = await request(app).post("/api/cart");

    expect(createResponse.status).toBe(201);
    const cartId = createResponse.body.data.cartId;
    const cartSecret = createResponse.body.data.cartSecret;

    // Test missing exchangeRate
    let response = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set("X-Cart-Secret", cartSecret)
      .send({ displayCurrency: "VES" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid cart metadata",
      })
    );

    // Test invalid exchangeRate
    response = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set("X-Cart-Secret", cartSecret)
      .send({ displayCurrency: "VES", exchangeRate: { usdToVes: 0 } });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid cart metadata",
      })
    );
  });
});
