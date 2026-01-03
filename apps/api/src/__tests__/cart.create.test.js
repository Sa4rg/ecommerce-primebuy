import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("POST /api/cart", () => {
  test("should return 201 and a cartId", async () => {
    const response = await request(app)
      .post("/api/cart");

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: { cartId: expect.any(String) }
      })
    );

    expect(response.body.data.cartId.length).toBeGreaterThan(0);
  });
});