import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Cart security (guest secret)", () => {
  test("should return cartSecret when creating a cart", async () => {
    const res = await request(app).post("/api/cart");
    expect(res.status).toBe(201);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.cartId).toBe("string");
    expect(typeof res.body.data.cartSecret).toBe("string");
    expect(res.body.data.cartSecret.length).toBeGreaterThan(10);
  });

  test("should require X-Cart-Secret to add item when cart is anonymous", async () => {
    // create cart
    const cartRes = await request(app).post("/api/cart");
    const { cartId } = cartRes.body.data;

    // try to add item without secret
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId: "any", quantity: 1 });

    expect(addRes.status).toBe(403);
    expect(addRes.body).toMatchObject({
      success: false,
      message: "Forbidden",
    });
  });
});
