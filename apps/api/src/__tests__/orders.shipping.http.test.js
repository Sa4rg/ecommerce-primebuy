import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { OrderStatus } from "../constants/orderStatus.js";
import { ShippingStatus } from "../constants/shippingStatus.js";
import { createConfirmedUsdOrder } from "../test_helpers/orderHelper.js";

describe("Orders Shipping HTTP Endpoints", () => {
  describe("PATCH /api/orders/:orderId/shipping", () => {
    test("should set shipping to pickup with null address", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "pickup", address: null });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shipping.method).toBe("pickup");
      expect(res.body.data.shipping.address).toBe(null);
      expect(res.body.data.shipping.status).toBe(ShippingStatus.PENDING);
    });

    test("should set shipping to local_delivery with valid address", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      const validAddress = {
        recipientName: "Juan Pérez",
        phone: "+58 412 1234567",
        state: "Carabobo",
        city: "Valencia",
        line1: "Av. Bolívar Norte, Edificio Centro, Piso 3, Apt 3-A",
        reference: "Frente al centro comercial",
      };

      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "local_delivery", address: validAddress });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shipping.method).toBe("local_delivery");
      expect(res.body.data.shipping.address).toEqual(
        expect.objectContaining({
          recipientName: "Juan Pérez",
          phone: "+58 412 1234567",
          state: "Carabobo",
          city: "Valencia",
          line1: "Av. Bolívar Norte, Edificio Centro, Piso 3, Apt 3-A",
        })
      );
      expect(res.body.data.shipping.status).toBe(ShippingStatus.PENDING);
    });

    test("should return 400 when method is invalid", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "airdrop", address: null });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid shipping details",
        })
      );
    });

    test("should return 400 when address is missing for local_delivery", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "local_delivery", address: null });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid shipping details",
        })
      );
    });
  });

  describe("PATCH /api/orders/:orderId/shipping/dispatch", () => {
    test("should dispatch local_delivery without carrier", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      // Set shipping first
      const setShippingRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({
          method: "local_delivery",
          address: {
            recipientName: "María García",
            phone: "+58 414 9876543",
            state: "Aragua",
            city: "Maracay",
            line1: "Calle Principal, Casa 10",
          },
        });
      expect(setShippingRes.status).toBe(200);

      // Dispatch without carrier
      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shipping.status).toBe(ShippingStatus.DISPATCHED);
      expect(typeof res.body.data.shipping.dispatchedAt).toBe("string");
      expect(res.body.data.shipping.dispatchedAt.length).toBeGreaterThan(0);
      expect(res.body.data.shipping.carrier.name).toBe(null);
      expect(res.body.data.shipping.carrier.trackingNumber).toBe(null);
    });

    test("should require carrier for national_shipping dispatch", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      // Set shipping to national_shipping
      const setShippingRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({
          method: "national_shipping",
          address: {
            recipientName: "Carlos López",
            phone: "+58 416 5551234",
            state: "Zulia",
            city: "Maracaibo",
            line1: "Av. 5 de Julio, Edificio Sol, Piso 8",
          },
        });
      expect(setShippingRes.status).toBe(200);

      // Try to dispatch without carrier - should fail
      const failRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({});

      expect(failRes.status).toBe(400);
      expect(failRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid shipping carrier",
        })
      );

      // Dispatch with valid carrier - should succeed
      const successRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({
          carrier: {
            name: "MRW",
            trackingNumber: "MRW-123456789",
          },
        });

      expect(successRes.status).toBe(200);
      expect(successRes.body.success).toBe(true);
      expect(successRes.body.data.shipping.status).toBe(ShippingStatus.DISPATCHED);
      expect(successRes.body.data.shipping.carrier.name).toBe("MRW");
      expect(successRes.body.data.shipping.carrier.trackingNumber).toBe("MRW-123456789");
    });

    test("should return 409 when dispatching twice", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      // Set shipping to pickup
      const setShippingRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "pickup", address: null });
      expect(setShippingRes.status).toBe(200);

      // First dispatch - should succeed
      const firstDispatch = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({});
      expect(firstDispatch.status).toBe(200);

      // Second dispatch - should fail with 409
      const secondDispatch = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({});

      expect(secondDispatch.status).toBe(409);
      expect(secondDispatch.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Shipping cannot be dispatched",
        })
      );
    });
  });

  describe("PATCH /api/orders/:orderId/shipping/deliver", () => {
    test("should deliver only from dispatched and auto-complete order", async () => {
      const { orderId } = await createConfirmedUsdOrder(app, 'shipping');

      // Set shipping to pickup
      const setShippingRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping`)
        .send({ method: "pickup", address: null });
      expect(setShippingRes.status).toBe(200);

      // Dispatch
      const dispatchRes = await request(app)
        .patch(`/api/orders/${orderId}/shipping/dispatch`)
        .send({});
      expect(dispatchRes.status).toBe(200);

      // Deliver
      const res = await request(app)
        .patch(`/api/orders/${orderId}/shipping/deliver`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shipping.status).toBe(ShippingStatus.DELIVERED);
      expect(typeof res.body.data.shipping.deliveredAt).toBe("string");
      expect(res.body.data.shipping.deliveredAt.length).toBeGreaterThan(0);
      // Order should be auto-completed
      expect(res.body.data.status).toBe(OrderStatus.COMPLETED);
    });
  });
});
