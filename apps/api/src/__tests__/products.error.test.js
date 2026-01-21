import request from "supertest";
import app from "../app.js";
import { vi } from "vitest";

const { services } = require("../composition/root");

describe("GET /api/products - Error Handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should return 500 when service fails", async () => {
    vi.spyOn(services.productsService, "getProducts")
      .mockRejectedValue(new Error("Service error"));

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(typeof response.body.message).toBe("string");
  });
});
