import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// CommonJS modules from your backend
const cartModule = require("../cart.service");
const checkoutModule = require("../checkout.service");

let cartService;
let checkoutService;
let productsService;
let checkoutsStore;
const TEST_USER_ID = "user-test-1";

beforeEach(() => {
  // Stub productsService with DI
  productsService = {
    getProductById: async (productId) => {
      return {
        id: productId,
        name: "Test Product",
        priceUSD: 10,
        stock: 5,
        inStock: true,
        category: "Test",
      };
    },
  };

  // Create isolated stores
  const cartsStore = new Map();
  checkoutsStore = new Map();

  // Create cart service with real factory
  cartService = cartModule.createCartService({
    productsService,
    cartsStore,
    idGenerator: () => "cart-1",
  });

  // Create checkout service with factory
  checkoutService = checkoutModule.createCheckoutService({
    cartService,
    productsService,
    checkoutsStore,
    idGenerator: () => "checkout-1",
  });
});

describe("createCheckout", () => {
  test("should create a checkout with totals in USD and VES when exchange rate is available", async () => {
    // Arrange: create cart with items and exchange rate
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 2);
    await cartService.updateMetadata(cartId, {
      displayCurrency: "VES",
      exchangeRate: {
        usdToVes: 40,
        asOf: "2023-01-01T00:00:00.000Z",
      },
    });

    // Act
    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID);

    // Assert
    expect(checkout.checkoutId).toBe("checkout-1");
    expect(checkout.cartId).toBe(cartId);
    expect(checkout.totals.subtotalUSD).toBe(20);
    expect(checkout.totals.subtotalVES).toBe(800);
    expect(checkout.exchangeRate).toMatchObject({
      provider: "BCV",
      usdToVes: 40,
      asOf: "2023-01-01T00:00:00.000Z",
    });
    expect(checkout.paymentMethods.usd).toEqual(["zelle", "zinli"]);
    expect(checkout.paymentMethods.ves).toEqual(["bank_transfer", "pago_movil"]);
    expect(checkoutsStore.get("checkout-1")).toMatchObject({
        checkoutId: "checkout-1",
        cartId,
        });
    });

  test("should create a checkout with subtotalVES null when exchange rate is missing", async () => {
    // Arrange: create cart with items but no exchange rate
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);

    // Act
    const checkout = await checkoutService.createCheckout(cartId, TEST_USER_ID);

    // Assert
    expect(checkout.totals.subtotalUSD).toBe(10);
    expect(checkout.totals.subtotalVES).toBeNull();
    expect(checkout.exchangeRate).toBeNull();
  });

  test("should throw 404 when cart does not exist", async () => {
    // Act + Assert
    await expect(
      checkoutService.createCheckout("invalid-cart", TEST_USER_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Cart not found",
    });
  });

  test("should throw 400 when cart is empty", async () => {
    // Arrange: create cart without items
    const { cartId } = await cartService.createCart(TEST_USER_ID);

    // Act + Assert
    await expect(
      checkoutService.createCheckout(cartId , TEST_USER_ID)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Cart is empty",
    });
  });

  test("should throw 409 when cart is not active", async () => {
    // Arrange: create cart and set status to locked
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);
    await cartService.updateMetadata(cartId, { status: "locked" });

    // Act + Assert
    await expect(
      checkoutService.createCheckout(cartId, TEST_USER_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Cart is not active",
    });
  });

  test("should throw 409 when stock is insufficient at checkout", async () => {
    // Arrange: create cart with items, then simulate stock drop
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 2);

    // Simulate stock drop: modify productsService stub behavior
    productsService.getProductById = async (productId) => {
      return {
        id: productId,
        name: "Test Product",
        priceUSD: 10,
        stock: 1, // Stock dropped from 5 to 1
        inStock: true,
        category: "Test",
      };
    };

    // Act + Assert
    await expect(
      checkoutService.createCheckout(cartId, TEST_USER_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Insufficient stock",
    });
  });

  test("should return existing pending checkout when called twice (idempotency)", async () => {
    // Arrange: create cart with items
    const { cartId } = await cartService.createCart(TEST_USER_ID);
    await cartService.addItem(cartId, "product-1", 1);

    // Act: call createCheckout twice
    const checkout1 = await checkoutService.createCheckout(cartId, TEST_USER_ID);
    const checkout2 = await checkoutService.createCheckout(cartId, TEST_USER_ID);

    // Assert: both calls return the same checkout
    expect(checkout1.checkoutId).toBe(checkout2.checkoutId);
    expect(checkout1.cartId).toBe(checkout2.cartId);
    expect(checkoutsStore.size).toBe(1);
  });
});
