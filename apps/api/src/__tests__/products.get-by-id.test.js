import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createTestProduct } from "../test_helpers/productHelper.js";

describe("GET /api/products/:id", () => {
  test("should return 200 and the product when it exists", async () => {
    // Crea un producto antes de hacer el GET
    const { productId, product } = await createTestProduct(app, { id: "1" });
    const response = await request(app).get(`/api/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: productId,
      })
    );
  });

  test("should return 404 when the product does not exist", async () => {
    const response = await request(app).get("/api/products/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Product not found",
      })
    );
  });
});
