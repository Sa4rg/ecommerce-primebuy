/**
 * Voiceflow Service
 * 
 * Business logic for Voiceflow chatbot integration.
 * Handles product search, product details, and order lookup
 * with chatbot-friendly responses.
 */

const { AppError, NotFoundError } = require('../utils/errors');

function createVoiceflowService(deps = {}) {
  const productsService = deps.productsService;
  const ordersService = deps.ordersService;
  const checkoutService = deps.checkoutService;
  const paymentsService = deps.paymentsService;
  const fxService = deps.fxService;

  if (!productsService) {
    throw new Error('productsService is required');
  }
  if (!ordersService) {
    throw new Error('ordersService is required');
  }
  if (!checkoutService) {
    throw new Error('checkoutService is required');
  }
  if (!paymentsService) {
    throw new Error('paymentsService is required');
  }
  if (!fxService) {
    throw new Error('fxService is required');
  }

  /**
   * Search products by name (case-insensitive)
   * Searches across name, nameES, and nameEN fields
   * 
   * @param {string} query - Search term
   * @returns {Promise<Object>} Chatbot-friendly response with products and prices in VES
   */
  async function searchProducts(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        success: false,
        customerMessage: 'Por favor proporciona un término de búsqueda.',
        errorCode: 'MISSING_QUERY',
      };
    }

    const searchTerm = query.trim().toLowerCase();
    const allProducts = await productsService.getProducts();

    // Filter products by name match
    const matches = allProducts.filter(product => {
      const name = (product.name || '').toLowerCase();
      const nameES = (product.nameES || '').toLowerCase();
      const nameEN = (product.nameEN || '').toLowerCase();

      return name.includes(searchTerm) || 
             nameES.includes(searchTerm) || 
             nameEN.includes(searchTerm);
    });

    if (matches.length === 0) {
      return {
        success: true,
        found: false,
        customerMessage: `No encontré productos con "${query}". ¿Podrías intentar con otro término?`,
        data: { products: [] },
      };
    }

    // Get exchange rate for USD -> VES conversion
    const fxConversion = await fxService.convertUsdToVes(1);
    const rate = fxConversion ? fxConversion.rate : null;
    const rateSource = fxConversion ? fxConversion.source : null;

    // Format products for chatbot response
    const products = matches.map(product => {
      const priceVES = rate ? Math.round(product.priceUSD * rate * 100) / 100 : null;

      return {
        id: product.id,
        nameES: product.nameES || product.name,
        priceUSD: product.priceUSD,
        priceVES,
        inStock: product.inStock,
        stock: product.stock,
      };
    });

    const message = matches.length === 1
      ? `Encontré 1 producto: ${products[0].nameES}`
      : `Encontré ${matches.length} productos con "${query}"`;

    return {
      success: true,
      found: true,
      customerMessage: message,
      data: {
        products,
        rate: rate ? { rate, source: rateSource } : null,
      },
    };
  }

  /**
   * Get product details by ID with USD -> VES conversion
   * 
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Chatbot-friendly response with product details
   */
  async function getProduct(productId) {
    const product = await productsService.getProductById(productId);

    // Get exchange rate for price conversion
    const fxConversion = await fxService.convertUsdToVes(product.priceUSD);
    const priceVES = fxConversion ? fxConversion.amountVES : null;
    const rate = fxConversion ? fxConversion.rate : null;
    const rateSource = fxConversion ? fxConversion.source : null;

    const stockMessage = product.inStock
      ? `en stock (${product.stock} disponibles)`
      : 'sin stock actualmente';

    const customerMessage = `${product.nameES || product.name} está ${stockMessage}. Precio: $${product.priceUSD} USD${priceVES ? ` (Bs. ${priceVES.toLocaleString('es-VE')})` : ''}.`;

    return {
      success: true,
      customerMessage,
      data: {
        product: {
          id: product.id,
          nameES: product.nameES || product.name,
          priceUSD: product.priceUSD,
          priceVES,
          inStock: product.inStock,
          stock: product.stock,
          shortDescES: product.shortDescES || null,
          category: product.category,
        },
        rate: rate ? { rate, source: rateSource } : null,
      },
    };
  }

  /**
   * Lookup order by orderId with email validation
   * Returns sanitized order data without sensitive information
   * 
   * @param {string} orderId - Order UUID
   * @param {string} email - Customer email for validation
   * @returns {Promise<Object>} Chatbot-friendly response with order details
   */
  async function lookupOrder(orderId, email) {
    const order = await ordersService.getOrderById(orderId);

    // Validate email matches (case-insensitive)
    const orderEmail = (order.customer.email || '').toLowerCase();
    const requestEmail = (email || '').toLowerCase();

    if (orderEmail !== requestEmail) {
      return {
        success: false,
        found: false,
        customerMessage: 'El correo electrónico no coincide con esta orden. Por favor verifica los datos.',
        errorCode: 'INVALID_EMAIL',
      };
    }

    // Sanitize order items (remove sensitive data)
    const sanitizedItems = order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
    }));

    // Build shipping status message
    const shippingMessage = _buildShippingMessage(order.shipping);

    // Build order status message
    const statusMessage = _buildStatusMessage(order.status);

    const customerMessage = `Tu pedido está ${statusMessage}. Envío: ${shippingMessage}.${order.shipping.carrier?.trackingNumber ? ` Tracking: ${order.shipping.carrier.trackingNumber}` : ''}`;

    return {
      success: true,
      found: true,
      customerMessage,
      data: {
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        items: sanitizedItems,
        shipping: {
          method: order.shipping.method,
          status: order.shipping.status,
          carrier: {
            name: order.shipping.carrier?.name || null,
            trackingNumber: order.shipping.carrier?.trackingNumber || null,
          },
          dispatchedAt: order.shipping.dispatchedAt,
          deliveredAt: order.shipping.deliveredAt,
        },
        totals: {
          amountPaid: order.totals.amountPaid,
          currency: order.totals.currency,
        },
      },
    };
  }

  /**
   * Build shipping status message for chatbot
   * @private
   */
  function _buildShippingMessage(shipping) {
    if (shipping.method === 'pickup') {
      return 'retiro en tienda';
    }

    const statusMap = {
      pending: 'pendiente de despacho',
      dispatched: 'despachado',
      delivered: 'entregado',
    };

    const methodMap = {
      national_shipping: 'envío nacional',
      local_delivery: 'envío local',
    };

    const method = methodMap[shipping.method] || shipping.method;
    const status = statusMap[shipping.status] || shipping.status;

    return `${method} - ${status}`;
  }

  /**
   * Build order status message for chatbot
   * @private
   */
  function _buildStatusMessage(status) {
    const statusMap = {
      paid: 'pagada',
      completed: 'completada',
      cancelled: 'cancelada',
    };

    return statusMap[status] || status;
  }

  /**
   * Lookup user orders by email + phone_last4 verification
   * Returns all active orders for user after identity verification
   * 
   * @param {string} email - Customer email
   * @param {string} phone_last4 - Last 4 digits of customer phone
   * @returns {Promise<Object>} Chatbot-friendly response with orders list
   */
  async function lookupOrdersByVerification(email, phone_last4) {
    // Normalize inputs
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPhone = (phone_last4 || '').trim();

    // Get all orders for this email (already confirmed by admin)
    const orders = await ordersService.getOrdersByCustomerEmail(normalizedEmail);

    // Get submitted payments (user uploaded proof, waiting admin confirmation)
    // We exclude 'pending' (reached payment screen but didn't submit proof)
    // because exchange rates change daily and it could cause pricing errors
    const allPayments = await paymentsService.listPayments();
    const submittedPayments = allPayments.filter(payment => {
      // Only 'submitted' status (proof uploaded, waiting admin confirmation)
      // NOT 'pending' (incomplete payment, should go through checkout again)
      if (payment.status !== 'submitted') return false;
      
      // Must have checkout with matching email
      if (!payment.checkout || !payment.checkout.customerEmail) return false;
      
      return payment.checkout.customerEmail.toLowerCase() === normalizedEmail;
    });

    // Combine for verification: need at least one order OR one submitted payment
    if (orders.length === 0 && submittedPayments.length === 0) {
      return {
        success: false,
        found: false,
        message: 'No pude verificar tu identidad. Por favor verifica tus datos.',
        errorCode: 'VERIFICATION_FAILED',
      };
    }

    // Verify phone_last4 matches at least one order or checkout
    const phoneMatchesOrder = orders.some(order => {
      const customerPhone = (order.customer.phone || '').replace(/\D/g, '');
      return customerPhone.endsWith(normalizedPhone);
    });

    const phoneMatchesPayment = submittedPayments.some(payment => {
      const customerPhone = (payment.checkout?.customerPhone || '').replace(/\D/g, '');
      return customerPhone.endsWith(normalizedPhone);
    });

    if (!phoneMatchesOrder && !phoneMatchesPayment) {
      return {
        success: false,
        found: false,
        message: 'No pude verificar tu identidad. Por favor verifica tus datos.',
        errorCode: 'VERIFICATION_FAILED',
      };
    }

    // Format confirmed orders (exclude delivered and cancelled)
    const activeStatuses = ['pending', 'processing', 'shipped', 'paid'];
    const activeOrders = orders.filter(o => activeStatuses.includes(o.status));

    const formattedOrders = activeOrders.map(order => {
      const formattedOrder = {
        orderId: order.orderId,
        status: order.status,
        statusES: _translateOrderStatus(order.status),
        totalUSD: order.totals.amountPaid,
        createdAt: order.createdAt,
        itemsCount: order.items.length,
        type: 'order',
      };

      // Add shipping info if it exists (regardless of order status)
      // Include shipping data for chatbot if:
      // 1. Order has shipping info
      // 2. Method is not pickup OR has tracking number
      if (order.shipping) {
        const hasTracking = order.shipping.carrier?.trackingNumber;
        const isPickup = order.shipping.method === 'pickup';
        
        // Always include shipping object so chatbot can check method and tracking
        formattedOrder.shipping = {
          method: order.shipping.method,
          carrier: order.shipping.carrier?.name || null,
          trackingNumber: order.shipping.carrier?.trackingNumber || null,
          dispatchedAt: order.shipping.dispatchedAt,
        };
      }

      return formattedOrder;
    });

    // Format submitted payments (proof uploaded, waiting admin confirmation)
    const formattedSubmittedPayments = submittedPayments.map(payment => ({
      paymentId: payment.paymentId,
      status: payment.status,
      statusES: 'Pago enviado (esperando confirmación)',
      totalUSD: payment.amountUSD,
      createdAt: payment.createdAt,
      itemsCount: payment.checkout?.items?.length || 0,
      type: 'submitted_payment',
    }));

    // Combine and sort by creation date (most recent first)
    const allItems = [...formattedOrders, ...formattedSubmittedPayments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allItems.length === 0) {
      return {
        success: true,
        found: false,
        message: 'No tienes pedidos activos en este momento.',
        data: { orders: [] },
      };
    }

    // Build user-friendly message
    let message = '';
    if (formattedOrders.length > 0 && formattedSubmittedPayments.length > 0) {
      message = `Tienes ${formattedOrders.length} pedido(s) confirmado(s) y ${formattedSubmittedPayments.length} pago(s) esperando confirmación del admin`;
    } else if (formattedOrders.length > 0) {
      message = formattedOrders.length === 1
        ? `Tienes 1 pedido activo (Orden #${formattedOrders[0].orderId.substring(0, 8)})`
        : `Tienes ${formattedOrders.length} pedidos activos`;
    } else {
      message = formattedSubmittedPayments.length === 1
        ? 'Tienes 1 pago esperando confirmación del admin'
        : `Tienes ${formattedSubmittedPayments.length} pagos esperando confirmación del admin`;
    }

    return {
      success: true,
      found: true,
      message,
      data: {
        orders: allItems,
      },
    };
  }

  /**
   * Translate order status to Spanish
   * @private
   */
  function _translateOrderStatus(status) {
    const translations = {
      pending: 'Pendiente',
      paid: 'Pagada',
      processing: 'En proceso',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return translations[status] || status;
  }

  return {
    searchProducts,
    getProduct,
    lookupOrder,
    lookupOrdersByVerification,
  };
}

module.exports = { createVoiceflowService };
