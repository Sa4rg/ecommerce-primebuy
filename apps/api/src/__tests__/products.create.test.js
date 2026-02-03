import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import jwt from "jsonwebtoken";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("POST /api/products", () => {
  test("should return 201 and the created product when input is valid", async () => {
    const payload = {
      name: "Headphones",
      priceUSD: 120,
      stock: 15,
      category: "Electronics",
    };

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: "Headphones",
        priceUSD: 120,
        stock: 15,
        category: "Electronics",
        inStock: true,
      })
    );
  });

  test("should return 400 when input is invalid", async () => {
    const payload = {
      name: "Bad product",
      priceUSD: 0,
      stock: 10,
      category: "Electronics",
    };

    const response = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid product input",
      })
    );
  });
});
