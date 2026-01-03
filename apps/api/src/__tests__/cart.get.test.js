import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("GET /api/cart/:cartId", () => {
  test("should return 200 and the cart when cartId exists", async () => {
    const createResponse = await request(app)
      .post("/api/cart");

    expect(createResponse.status).toBe(201);
    const cartId = createResponse.body.data.cartId;
    expect(cartId).toBeDefined();
    expect(typeof cartId).toBe("string");
    expect(cartId.length).toBeGreaterThan(0);

    const getResponse = await request(app)
      .get(`/api/cart/${cartId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: {
          cartId,
          items: [],
          summary: { itemsCount: 0, subtotalUSD: 0 }
        }
      })
    );
  });

  test("should return 404 when cartId does not exist", async () => {
    const response = await request(app)
      .get("/api/cart/non-existing-cart-id");

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found"
      })
    );
  });
});