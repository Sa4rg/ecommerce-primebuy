/**
 * OrdersRepository Contract
 *
 * This file defines the expected interface for any OrdersRepository implementation.
 * It serves as documentation-by-code and does NOT contain runtime logic.
 *
 * Implementations:
 * - InMemoryOrdersRepository (for unit tests)
 * - MySQLOrdersRepository (for production / integration tests) [future]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId - Product identifier
 * @property {string} name - Product name at time of order
 * @property {number} unitPriceUSD - Unit price in USD
 * @property {number} quantity - Quantity ordered
 * @property {number} lineTotalUSD - Total for this line item
 */

/**
 * @typedef {Object} OrderTotals
 * @property {number} subtotalUSD - Subtotal in USD
 * @property {number|null} subtotalVES - Subtotal in VES (if applicable)
 * @property {string} currency - Currency used for payment ("USD" or "VES")
 * @property {number} amountPaid - Amount actually paid
 */

/**
 * @typedef {Object} OrderExchangeRate
 * @property {string} provider - Exchange rate provider (e.g., "BCV")
 * @property {number} usdToVes - USD to VES exchange rate
 * @property {string} asOf - ISO timestamp of exchange rate
 */

/**
 * @typedef {Object} OrderTax
 * @property {boolean} priceIncludesVAT - Whether prices include VAT
 * @property {number} vatRate - VAT rate (e.g., 0.16)
 */

/**
 * @typedef {Object} OrderCustomer
 * @property {string|null} email - Customer email
 * @property {string|null} name - Customer name
 * @property {string|null} phone - Customer phone
 */

/**
 * @typedef {Object} OrderPaymentInfo
 * @property {string} method - Payment method used
 * @property {Object|null} proof - Payment proof
 * @property {Object} [review] - Payment review (if confirmed/rejected)
 */

/**
 * @typedef {Object} OrderShippingAddress
 * @property {string} recipientName - Recipient name
 * @property {string} phone - Contact phone
 * @property {string} state - State/province
 * @property {string} city - City
 * @property {string} line1 - Address line 1
 * @property {string|null} reference - Address reference/notes
 */

/**
 * @typedef {Object} OrderShippingCarrier
 * @property {string|null} name - Carrier name (e.g., "MRW", "ZOOM")
 * @property {string|null} trackingNumber - Tracking number
 */

/**
 * @typedef {Object} OrderShipping
 * @property {string|null} method - Shipping method ("pickup", "local_delivery", "national_shipping")
 * @property {OrderShippingAddress|null} address - Shipping address
 * @property {OrderShippingCarrier} carrier - Carrier information
 * @property {string} status - Shipping status ("pending", "dispatched", "delivered")
 * @property {string|null} dispatchedAt - ISO timestamp when dispatched
 * @property {string|null} deliveredAt - ISO timestamp when delivered
 */

/**
 * @typedef {Object} Order
 * @property {string} orderId - Unique order identifier (always a string)
 * @property {string} cartId - Associated cart identifier
 * @property {string} checkoutId - Associated checkout identifier
 * @property {string} paymentId - Associated payment identifier
 * @property {string} status - Order status ("paid", "processing", "completed", "cancelled")
 * @property {OrderItem[]} items - Order items snapshot
 * @property {OrderTotals} totals - Order totals
 * @property {OrderExchangeRate|null} exchangeRate - Exchange rate used (if applicable)
 * @property {OrderTax} tax - Tax configuration
 * @property {OrderCustomer} customer - Customer information
 * @property {OrderPaymentInfo} payment - Payment information
 * @property {OrderShipping} shipping - Shipping information
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} OrdersRepositoryContract
 *
 * @property {function(Order): Promise<{orderId: string}>} create
 * Persists a new order and returns { orderId }.
 * The order object must include orderId already assigned by the service.
 *
 * @property {function(string): Promise<Order|null>} findById
 * Returns an order by its orderId, or null if not found.
 * - orderId: string
 *
 * @property {function(): Promise<Order[]>} findAll
 * Returns all orders.
 * Used for duplicate detection and queries.
 *
 * @property {function(Order): Promise<void>} save
 * Overwrites an existing order with new state (e.g., after status change).
 * The order must already exist in the repository.
 */

/**
 * Contract Rules:
 *
 * 1. orderId is ALWAYS a string.
 * 2. findById returns null when order does not exist (no errors).
 * 3. No AppError usage in repositories.
 * 4. No business validation in repositories.
 * 5. Repositories are persistence-only (no domain rules).
 * 6. No timestamp generation in repositories (handled by service).
 * 7. Store and return references (no copies) to match Map behavior.
 */

module.exports = {};
