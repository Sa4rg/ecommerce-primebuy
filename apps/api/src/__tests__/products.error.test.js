import request from "supertest";
import app from "../app.js";
import { vi } from "vitest";

describe("GET /api/products - Error Handling", () => {
  test("should return 500 when service fails", async () => {
    // Mock the service to throw an error
    const productsService = require("../services/products.service");
    const originalListProducts = productsService.getProducts;
    productsService.getProducts = vi.fn().mockRejectedValue(new Error("Service error"));

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(typeof response.body.message).toBe('string');

    // Restore the original function
    productsService.getProducts = originalListProducts;
  });
});