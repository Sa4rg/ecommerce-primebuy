import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// CommonJS modules from your backend
const cartModule = require("../cart.service");
const productsService = require("../products.service");

let cartService;

beforeEach(() => {
  cartService = cartModule.createCartService({
    productsService,
    cartsStore: new Map(),
  });
});

describe("createCart", () => {
  test("should return a cartId string", async () => {
    const result = await cartService.createCart();

    expect(result).toHaveProperty("cartId");
    expect(typeof result.cartId).toBe("string");
    expect(result.cartId.length).toBeGreaterThan(0);
  });

  test("should create an empty cart accessible by getCart", async () => {
    const { cartId } = await cartService.createCart();

    const cart = await cartService.getCart(cartId);

    expect(cart).toEqual({
      cartId,
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
    });
  });
});

describe("addItem", () => {
  test("should add a new item to an empty cart", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    const cart = await cartService.addItem(cartId, product.id, 2);

    expect(cart.items).toHaveLength(1);
    const item = cart.items[0];
    expect(item).toEqual({
      productId: product.id,
      name: product.name,
      unitPriceUSD: product.priceUSD,
      quantity: 2,
      lineTotalUSD: 20,
    });
    expect(cart.summary).toEqual({
      itemsCount: 2,
      subtotalUSD: 20,
    });
  });

  test("should increment quantity if product already exists in cart", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await cartService.addItem(cartId, product.id, 1);

    const cart = await cartService.addItem(cartId, product.id, 2);

    expect(cart.items).toHaveLength(1);
    const item = cart.items[0];
    expect(item.quantity).toBe(3);
    expect(item.lineTotalUSD).toBe(30);
    expect(cart.summary.itemsCount).toBe(3);
    expect(cart.summary.subtotalUSD).toBe(30);
  });

  test("should throw 404 when cart does not exist", async () => {
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await expect(
      cartService.addItem("invalid-cart", product.id, 1)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Cart not found",
    });
  });

  test("should throw 404 when product does not exist", async () => {
    const { cartId } = await cartService.createCart();

    await expect(
      cartService.addItem(cartId, "invalid-product", 1)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Product not found",
    });
  });

  test("should throw 400 when quantity is invalid", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await expect(cartService.addItem(cartId, product.id, 0)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid quantity",
    });

    await expect(cartService.addItem(cartId, product.id, -1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid quantity",
    });
  });

  test("should throw 409 when quantity exceeds stock", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 2,
      category: "Test",
    });

    await expect(cartService.addItem(cartId, product.id, 3)).rejects.toMatchObject({
      statusCode: 409,
      message: "Insufficient stock",
    });
  });
});

describe("updateItem", () => {
  test("should update quantity of an existing cart item", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await cartService.addItem(cartId, product.id, 2);

    const cart = await cartService.updateItem(cartId, product.id, 3);

    expect(cart.items).toHaveLength(1);
    const item = cart.items[0];
    expect(item.quantity).toBe(3);
    expect(item.lineTotalUSD).toBe(30);
    expect(cart.summary.itemsCount).toBe(3);
    expect(cart.summary.subtotalUSD).toBe(30);
  });

  test("should throw 404 when cart does not exist", async () => {
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await expect(cartService.updateItem("invalid-cart", product.id, 1)).rejects.toMatchObject({
      statusCode: 404,
      message: "Cart not found",
    });
  });

  test("should throw 404 when product does not exist in cart", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await expect(cartService.updateItem(cartId, product.id, 1)).rejects.toMatchObject({
      statusCode: 404,
      message: "Item not found in cart",
    });
  });

  test("should throw 400 when quantity is invalid", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    await cartService.addItem(cartId, product.id, 1);

    await expect(cartService.updateItem(cartId, product.id, 0)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid quantity",
    });

    await expect(cartService.updateItem(cartId, product.id, -1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid quantity",
    });
  });

  test("should throw 409 when quantity exceeds product stock", async () => {
    const { cartId } = await cartService.createCart();
    const product = await productsService.createProduct({
      name: "Test Product",
      priceUSD: 10,
      stock: 2,
      category: "Test",
    });

    await cartService.addItem(cartId, product.id, 1);

    await expect(cartService.updateItem(cartId, product.id, 3)).rejects.toMatchObject({
      statusCode: 409,
      message: "Insufficient stock",
    });
  });
});
