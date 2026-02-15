const crypto = require("crypto");
const { AppError } = require("../utils/errors");
const { PaymentStatus } = require("../constants/paymentStatus");
const { CheckoutStatus } = require("../constants/checkoutStatus");
const { nextUpdatedAt } = require("../utils/updatedAt");
const {
  InMemoryPaymentsRepository,
} = require("../repositories/payments/payments.memory.repository");

const defaultCartService = require("./cart.service");
const defaultCheckoutService = require("./checkout.service");

/**
 * Adapter to wrap a raw Map as a repository-like interface.
 * Used for backward compatibility when deps.paymentsStore is provided.
 */
function createMapAdapter(map) {
  return {
    async create(payment) {
      map.set(payment.paymentId, payment);
      return { paymentId: payment.paymentId };
    },
    async findById(paymentId) {
      return map.get(paymentId) || null;
    },
    async save(payment) {
      map.set(payment.paymentId, payment);
    },
    async findByCheckoutId(checkoutId) {
      const payments = [];
      for (const payment of map.values()) {
        if (payment.checkoutId === checkoutId) {
          payments.push(payment);
        }
      }
      return payments;
    },
  };
}

function createPaymentsService(deps = {}) {
  const cartService = deps.cartService || defaultCartService;
  const checkoutService = deps.checkoutService || defaultCheckoutService;
  const idGenerator = deps.idGenerator || (() => crypto.randomUUID());

  // Lazy injection to avoid circular dependency
  let ordersService = deps.ordersService || null;

  // Support both new repository pattern and legacy paymentsStore
  let paymentsRepository;
  if (deps.paymentsRepository) {
    paymentsRepository = deps.paymentsRepository;
  } else if (deps.paymentsStore) {
    paymentsRepository = createMapAdapter(deps.paymentsStore);
  } else {
    paymentsRepository = new InMemoryPaymentsRepository();
  }

  const VALID_METHODS = ["zelle", "zinli", "pago_movil", "bank_transfer"];
  const USD_METHODS = ["zelle", "zinli"];
  const VES_METHODS = ["pago_movil", "bank_transfer"];

  async function createPayment(checkoutId, method, userId, proofReference) {
    if (!userId || typeof userId !== "string") {
      throw new AppError("Unauthorized", 401);
    }
    const checkout = await checkoutService.findById(checkoutId);

    // ownership real: el cart del checkout debe ser de este usuario
    const cart = await cartService.getCart(checkout.cartId);

    if (!cart.userId) {
      // checkout debería claimear el cart, pero por seguridad:
      throw new AppError("Forbidden", 403);
    }

    if (cart.userId !== userId) {
      throw new AppError("Forbidden", 403);
    }

    if (!VALID_METHODS.includes(method)) {
      throw new AppError("Invalid payment method", 400);
    }
    if (checkout.status !== CheckoutStatus.PENDING) {
      throw new AppError("Checkout is not pending", 409);
    }

    if (!checkout.customer || !checkout.shipping) {
      throw new AppError("Checkout incomplete", 400);
    }

    let currency;
    let amount;

    if (USD_METHODS.includes(method)) {
      currency = "USD";
      amount = checkout.totals.subtotalUSD;
    } else if (VES_METHODS.includes(method)) {
      if (checkout.totals.subtotalVES === null) {
        throw new AppError("Exchange rate required", 400);
      }
      currency = "VES";
      amount = checkout.totals.subtotalVES;
    }

    const now = new Date().toISOString();
    const paymentId = idGenerator();

    const payment = {
      paymentId,
      userId,
      checkoutId,
      method,
      currency,
      amount,
      status: PaymentStatus.PENDING,
      proof: proofReference ? { reference: proofReference } : null,
      review: undefined,
      createdAt: now,
      updatedAt: now,
    };

    await paymentsRepository.create(payment);

    return payment;
  }

  async function submitPayment(paymentId, proof) {
    const payment = await paymentsRepository.findById(paymentId);
    
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError("Payment is not pending", 409);
    }

    if (!proof || typeof proof.reference !== "string" || proof.reference.length === 0) {
      throw new AppError("Invalid payment proof", 400);
    }

    payment.proof = proof;
    payment.status = PaymentStatus.SUBMITTED;
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    await paymentsRepository.save(payment);

    // Lock the cart to prevent further modifications
    const checkout = await checkoutService.findById(payment.checkoutId);
    await cartService.lockCart(checkout.cartId);

    return payment;
  }

  async function confirmPayment(paymentId, note) {
    const payment = await paymentsRepository.findById(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== PaymentStatus.SUBMITTED) {
      throw new AppError("Payment is not submitted", 409);
    }

    if (note !== undefined && note !== null) {
      if (typeof note !== "string" || note.trim().length === 0) {
        throw new AppError("Invalid payment review", 400);
      }
    }

    // 1) Update to confirmed (tentative)
    payment.status = PaymentStatus.CONFIRMED;
    payment.review = { note: note ? note.trim() : null };
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    await paymentsRepository.save(payment);

    // 2) If ordersService is not available (unit tests), return without order
    if (!ordersService) {
      return { payment, order: null };
    }

    // 3) Try to create order
    try {
      const order = await ordersService.createOrderFromPayment(paymentId, payment.userId);
      return { payment, order };
    } catch (err) {
      // 4) Compensation: revert payment to SUBMITTED
      payment.status = PaymentStatus.SUBMITTED;
      payment.updatedAt = nextUpdatedAt(payment.updatedAt);
      payment.review = {
        ...(payment.review || {}),
        orderCreationFailed: true,
      };

      await paymentsRepository.save(payment);

      // Propagate error
      throw new AppError("Order creation failed after payment confirmation", 500);
    }
  }

  async function rejectPayment(paymentId, reason) {
    const payment = await paymentsRepository.findById(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== PaymentStatus.SUBMITTED) {
      throw new AppError("Payment is not submitted", 409);
    }

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw new AppError("Invalid payment review", 400);
    }

    payment.status = PaymentStatus.REJECTED;
    payment.review = { reason: reason.trim() };
    payment.updatedAt = nextUpdatedAt(payment.updatedAt);

    await paymentsRepository.save(payment);

    return payment;
  }

  async function getPaymentById(paymentId) {
    const payment = await paymentsRepository.findById(paymentId);
    
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    
    // Include orderId if payment is confirmed
    if (payment.status === PaymentStatus.CONFIRMED && ordersService) {
      const order = await ordersService.getOrderByPaymentId(paymentId);
      if (order) {
        return { ...payment, orderId: order.orderId };
      }
    }
    
    return payment;
  }

  async function getPaymentsByCheckoutId(checkoutId) {
    return await paymentsRepository.findByCheckoutId(checkoutId);
  }

  /**
   * Check if checkout has any payment with status SUBMITTED or higher
   * (SUBMITTED, CONFIRMED, REJECTED - states after proof submission)
   * @param {string} checkoutId
   * @returns {Promise<boolean>}
   */
  async function hasSubmittedPayments(checkoutId) {
    const payments = await paymentsRepository.findByCheckoutId(checkoutId);
    const lockedStatuses = [PaymentStatus.SUBMITTED, PaymentStatus.CONFIRMED, PaymentStatus.REJECTED];
    return payments.some(p => lockedStatuses.includes(p.status));
  }

  /**
   * List all payments with optional filters (admin only)
   * @param {Object} filters - { status: string }
   * @returns {Promise<Object[]>}
   */
  async function listPayments(filters = {}) {
    return await paymentsRepository.findAll(filters);
  }

  /**
   * Setter for lazy injection of ordersService (avoids circular dependency)
   * @param {Object} service
   */
  function setOrdersService(service) {
    ordersService = service;
  }

  /**
   * Get all payments for a specific user
   * @param {string} userId
   * @returns {Promise<Object[]>}
   */
  async function getPaymentsByUserId(userId) {
    return paymentsRepository.findByUserId(userId);
  }

  return { createPayment, submitPayment, confirmPayment, rejectPayment, getPaymentById, getPaymentsByCheckoutId, getPaymentsByUserId, hasSubmittedPayments, listPayments, setOrdersService };
}

const paymentsService = createPaymentsService();

module.exports = paymentsService;
module.exports.createPaymentsService = createPaymentsService;
