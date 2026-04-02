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
  const fxService = deps.fxService;

  if (!productsService) {
    throw new Error('productsService is required');
  }
  if (!ordersService) {
    throw new Error('ordersService is required');
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

  return {
    searchProducts,
    getProduct,
    lookupOrder,
  };
}

module.exports = { createVoiceflowService };
