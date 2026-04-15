import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { createConfirmedUsdOrder } from "../test_helpers/orderHelper.js";

describe("GET /api/me/last-shipping-address", () => {
  test("should return 401 when no Authorization header", async () => {
    const res = await request(app).get("/api/me/last-shipping-address");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Unauthorized",
    });
  });

  test("should return 200 with data null when user has no previous orders", async () => {
    const token = await registerAndLogin(app, `me-address-${Date.now()}`);

    const res = await request(app)
      .get("/api/me/last-shipping-address")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Last shipping address retrieved successfully",
      data: null,
    });
  });

  test("should return 200 with last shipping address snapshot when user has a shipped order", async () => {
    const { userToken } = await createConfirmedUsdOrder(app, {
      prefix: `me-addr-${Date.now()}`,
      shippingMethod: "local_delivery",
    });

    const res = await request(app)
      .get("/api/me/last-shipping-address")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Last shipping address retrieved successfully",
      data: expect.any(Object),
    });

    expect(res.body.data).toMatchObject({
      method: "local_delivery",
      recipientName: "Test User",
      phone: "0414-1234567",
      state: "Carabobo",
      city: "Valencia",
      line1: "Av Principal",
      reference: "Near the park",
    });

    expect(res.body.data.fromOrderId).toEqual(expect.any(String));
    expect(res.body.data.createdAt).toEqual(expect.any(String));
  });

  test("should return null if the most recent order was pickup (even if a previous one had address)", async () => {
    // 1) Create first order with address
    const first = await createConfirmedUsdOrder(app, {
      prefix: `me-pickup-${Date.now()}`,
      shippingMethod: "local_delivery",
    });

    // sanity: first should normally have an address available
    const res1 = await request(app)
      .get("/api/me/last-shipping-address")
      .set("Authorization", `Bearer ${first.userToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body).toMatchObject({
      success: true,
      message: "Last shipping address retrieved successfully",
      data: expect.any(Object),
    });

    // Wait 10ms to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // 2) Create second order with SAME user but pickup
    const second = await createConfirmedUsdOrder(app, {
      userToken: first.userToken,
      prefix: `me-pickup-${Date.now()}`,
      shippingMethod: "pickup",
    });

    expect(second.orderId).toEqual(expect.any(String));

    // 3) Now the most recent order is pickup => must return null
    const res = await request(app)
      .get("/api/me/last-shipping-address")
      .set("Authorization", `Bearer ${first.userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Last shipping address retrieved successfully",
      data: null,
    });
  });
});