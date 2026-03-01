// apps/api/src/services/orders.service.js
const crypto = require("crypto");
const { AppError } = require("../utils/errors");
const { InMemoryOrdersRepository } = require("../repositories/orders/orders.memory.repository");
const { OrderStatus } = require("../constants/orderStatus");
const { ShippingStatus } = require("../constants/shippingStatus");
const { nextUpdatedAt } = require("../utils/updatedAt");

const defaultCartService = require("./cart.service");
const defaultCheckoutService = require("./checkout.service");
const defaultPaymentsService = require("./payments.service");

const VALID_SHIPPING_METHODS = ["pickup", "local_delivery", "national_shipping"];
const VALID_CARRIER_NAMES = ["MRW", "ZOOM", "OTHER"];

function createMapAdapter(map) {
  return {
    async create(order) {
      for (const existingOrder of map.values()) {
        if (existingOrder.paymentId === order.paymentId) {
          const error = new Error(
            `Duplicate entry '${order.paymentId}' for key 'orders_payment_id_unique'`
          );
          error.code = "ER_DUP_ENTRY";
          error.sqlMessage = `Duplicate entry '${order.paymentId}' for key 'orders_payment_id_unique'`;
          throw error;
        }
      }

      const orderId = order.orderId;
      map.set(orderId, order);
      return { orderId };
    },
    async findById(orderId) {
      const order = map.get(orderId);
      return order || null;
    },
    async save(order) {
      map.set(order.orderId, order);
    },
    async findAll() {
      return Array.from(map.values());
    },
    async findByPaymentId(paymentId) {
      for (const order of map.values()) {
        if (order.paymentId === paymentId) return order;
      }
      return null;
    },
    async findByUserId(userId) {
      const orders = [];
      for (const order of map.values()) {
        if (order.userId === userId) orders.push(order);
      }
      return orders;
    },
  };
}

function createOrdersService(deps = {}) {
  const cartService = deps.cartService || defaultCartService;
  const checkoutService = deps.checkoutService || defaultCheckoutService;
  const paymentsService = deps.paymentsService || defaultPaymentsService;
  const productsService = deps.productsService || null;
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  let ordersRepository;
  if (deps.ordersRepository) {
    ordersRepository = deps.ordersRepository;
  } else if (deps.ordersStore) {
    ordersRepository = createMapAdapter(deps.ordersStore);
  } else {
    ordersRepository = new InMemoryOrdersRepository();
  }

  async function getExistingOrder(orderId) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  function assertOrderEditableForShipping(order) {
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new AppError("Order cannot be updated for shipping", 409);
    }
  }

  function validateShippingDetails(details) {
    if (!details || typeof details !== "object") throw new AppError("Invalid shipping details", 400);

    if (!VALID_SHIPPING_METHODS.includes(details.method)) {
      throw new AppError("Invalid shipping details", 400);
    }

    if (details.method === "pickup") {
      if (details.address !== null && details.address !== undefined) {
        throw new AppError("Invalid shipping details", 400);
      }
    } else {
      if (!details.address || typeof details.address !== "object") {
        throw new AppError("Invalid shipping details", 400);
      }

      const requiredFields = ["recipientName", "phone", "state", "city", "line1"];
      for (const field of requiredFields) {
        const value = details.address[field];
        if (typeof value !== "string" || value.trim().length === 0) {
          throw new AppError("Invalid shipping details", 400);
        }
      }
    }
  }

  function normalizeAddress(address) {
    if (!address) return null;

    return {
      recipientName: address.recipientName.trim(),
      phone: address.phone.trim(),
      state: address.state.trim(),
      city: address.city.trim(),
      line1: address.line1.trim(),
      reference: address.reference ? address.reference.trim() : null,
    };
  }

  function validateCarrierForDispatch(order, carrier) {
    if (order.shipping.method === "national_shipping") {
      if (!carrier || typeof carrier !== "object") {
        throw new AppError("Invalid shipping carrier", 400);
      }

      if (!VALID_CARRIER_NAMES.includes(carrier.name)) {
        throw new AppError("Invalid shipping carrier", 400);
      }

      if (
        typeof carrier.trackingNumber !== "string" ||
        carrier.trackingNumber.trim().length === 0
      ) {
        throw new AppError("Invalid shipping carrier", 400);
      }
    }
  }

  async function getOrderById(orderId) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  /**
   * Business rule:
   * - We only consider the MOST RECENT order.
   * - If most recent order is pickup or has no address => return null.
   * - Do NOT fallback to older addresses.
   */
  async function getLastShippingAddressByUserId(userId) {
    if (!userId || typeof userId !== "string") throw new AppError("Unauthorized", 401);

    // Preferred: repository can answer efficiently
    if (typeof ordersRepository.findLastShippingAddressByUserId === "function") {
      return await ordersRepository.findLastShippingAddressByUserId(userId);
    }

    const orders = await ordersRepository.findByUserId(userId);
    if (!Array.isArray(orders) || orders.length === 0) return null;

    const sorted = [...orders].sort((a, b) => {
      const ta = Date.parse(a.createdAt || "") || 0;
      const tb = Date.parse(b.createdAt || "") || 0;
      return tb - ta;
    });

    const last = sorted[0];
    const method = last?.shipping?.method ?? null;
    if (!method || method === "pickup") return null;

    const addr = last?.shipping?.address ?? null;
    if (!addr || typeof addr !== "object") return null;

    const hasAny =
      (typeof addr.recipientName === "string" && addr.recipientName.trim().length > 0) ||
      (typeof addr.phone === "string" && addr.phone.trim().length > 0) ||
      (typeof addr.state === "string" && addr.state.trim().length > 0) ||
      (typeof addr.city === "string" && addr.city.trim().length > 0) ||
      (typeof addr.line1 === "string" && addr.line1.trim().length > 0) ||
      (typeof addr.reference === "string" && addr.reference.trim().length > 0);

    if (!hasAny) return null;

    return {
      method,
      recipientName: addr.recipientName || null,
      phone: addr.phone || null,
      state: addr.state || null,
      city: addr.city || null,
      line1: addr.line1 || null,
      reference: addr.reference || null,
      fromOrderId: last.orderId,
      createdAt: last.createdAt,
    };
  }

  async function createOrderFromPayment(paymentId, userId) {
    if (!userId || typeof userId !== "string") throw new AppError("Unauthorized", 401);

    const payment = await paymentsService.getPaymentById(paymentId);
    if (payment.userId !== userId) throw new AppError("Forbidden", 403);
    if (payment.status !== "confirmed") throw new AppError("Payment is not confirmed", 409);

    const checkout = await checkoutService.findById(payment.checkoutId);
    const cart = await cartService.getCart(checkout.cartId);

    if (productsService && typeof productsService.decrementStockForItems === "function") {
      await productsService.decrementStockForItems(cart.items);
    }

    const orderId = idGenerator();
    const now = new Date().toISOString();

    const order = {
      orderId,
      userId,
      cartId: cart.cartId,
      checkoutId: checkout.checkoutId,
      paymentId: payment.paymentId,
      status: OrderStatus.PAID,
      items: cart.items.map((item) => ({ ...item })),
      totals: {
        subtotalUSD: checkout.totals.subtotalUSD,
        subtotalVES: checkout.totals.subtotalVES,
        currency: payment.currency,
        amountPaid: payment.amount,
      },
      exchangeRate: checkout.exchangeRate,
      tax: cart.metadata.tax,
      customer: checkout.customer ?? { name: null, email: null, phone: null },
      payment: {
        method: payment.method,
        proof: payment.proof,
        review: payment.review,
      },
      shipping: {
        method: checkout.shipping?.method ?? null,
        address: checkout.shipping?.method === "pickup" ? null : (checkout.shipping?.address ?? null),
        carrier: { name: null, trackingNumber: null },
        status: ShippingStatus.PENDING,
        dispatchedAt: null,
        deliveredAt: null,
      },
      createdAt: now,
      updatedAt: now,
    };

    await cartService.updateMetadata(cart.cartId, { status: "checked_out" });

    try {
      await ordersRepository.create(order);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" && error.sqlMessage?.includes("orders_payment_id_unique")) {
        throw new AppError("Order already exists for payment", 409);
      }
      throw error;
    }

    return order;
  }

  async function processOrder(orderId) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== OrderStatus.PAID) throw new AppError("Order cannot be processed", 409);

    order.status = "processing";
    order.updatedAt = nextUpdatedAt(order.updatedAt);
    await ordersRepository.save(order);
    return order;
  }

  async function completeOrder(orderId) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);
    if (![OrderStatus.PAID, "processing"].includes(order.status)) {
      throw new AppError("Order cannot be completed", 409);
    }

    order.status = OrderStatus.COMPLETED;
    order.updatedAt = nextUpdatedAt(order.updatedAt);
    await ordersRepository.save(order);
    return order;
  }

  async function cancelOrder(orderId, reason) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw new AppError("Invalid cancellation reason", 400);
    }

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new AppError("Order cannot be cancelled", 409);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancellation = { reason: reason.trim() };
    order.updatedAt = nextUpdatedAt(order.updatedAt);
    await ordersRepository.save(order);
    return order;
  }

  async function setShippingDetails(orderId, details) {
    const order = await getExistingOrder(orderId);
    assertOrderEditableForShipping(order);
    validateShippingDetails(details);

    order.shipping.method = details.method;
    order.shipping.address = details.method === "pickup" ? null : normalizeAddress(details.address);
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    await ordersRepository.save(order);
    return order;
  }

  async function markDispatched(orderId, carrier) {
    const order = await getExistingOrder(orderId);
    assertOrderEditableForShipping(order);

    if (order.shipping.status !== ShippingStatus.PENDING) {
      throw new AppError("Shipping cannot be dispatched", 409);
    }

    if (order.shipping.method === null) throw new AppError("Invalid shipping details", 400);

    if (["local_delivery", "national_shipping"].includes(order.shipping.method) && order.shipping.address === null) {
      throw new AppError("Invalid shipping details", 400);
    }

    validateCarrierForDispatch(order, carrier);

    order.shipping.status = ShippingStatus.DISPATCHED;
    order.shipping.dispatchedAt = new Date().toISOString();

    if (order.shipping.method === "national_shipping" && carrier) {
      order.shipping.carrier = {
        name: carrier.name,
        trackingNumber: carrier.trackingNumber.trim(),
      };
    }

    order.updatedAt = nextUpdatedAt(order.updatedAt);
    await ordersRepository.save(order);
    return order;
  }

  async function markDelivered(orderId) {
    const order = await getExistingOrder(orderId);
    assertOrderEditableForShipping(order);

    if (order.shipping.status !== ShippingStatus.DISPATCHED) {
      throw new AppError("Shipping cannot be delivered", 409);
    }

    order.shipping.status = ShippingStatus.DELIVERED;
    order.shipping.deliveredAt = new Date().toISOString();
    order.status = OrderStatus.COMPLETED;
    order.updatedAt = nextUpdatedAt(order.updatedAt);

    await ordersRepository.save(order);
    return order;
  }

  async function getOrderByPaymentId(paymentId) {
    return await ordersRepository.findByPaymentId(paymentId);
  }

  async function getOrdersByUserId(userId) {
    return await ordersRepository.findByUserId(userId);
  }

  return {
    createOrderFromPayment,
    getOrderById,
    getOrderByPaymentId,
    getOrdersByUserId,
    processOrder,
    completeOrder,
    cancelOrder,
    setShippingDetails,
    markDispatched,
    markDelivered,
    getLastShippingAddressByUserId,
  };
}

const ordersService = createOrdersService();

module.exports = ordersService;
module.exports.createOrdersService = createOrdersService;