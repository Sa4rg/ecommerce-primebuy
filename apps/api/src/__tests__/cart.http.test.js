import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Cart security", () => {
  test("POST /api/cart should return cartSecret", async () => {
    const res = await request(app).post("/api/cart");
    expect(res.status).toBe(201);
    expect(res.body.data.cartSecret).toBeDefined();
    expect(typeof res.body.data.cartSecret).toBe("string");
    expect(res.body.data.cartSecret.length).toBeGreaterThan(0);
  });

  test("GET /api/cart/:cartId should NOT return cartSecret", async () => {
    const create = await request(app).post("/api/cart");
    const cartId = create.body.data.cartId;

    const getRes = await request(app).get(`/api/cart/${cartId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.cartSecret).toBeUndefined();
  });
});
