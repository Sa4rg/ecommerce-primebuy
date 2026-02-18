const { AppError, NotFoundError } = require("../utils/errors");
const {
  InMemoryProductsRepository,
} = require("../repositories/products/products.memory.repository");

function toProductReadModel(product) {
  if (typeof product.priceUSD !== "number" || product.priceUSD <= 0) {
    throw new AppError("Invalid product data", 500);
  }

  if (typeof product.stock !== "number" || product.stock < 0) {
    throw new AppError("Invalid product data", 500);
  }

  return {
    ...product,
    inStock: product.stock > 0,
  };
}

function validateCreateInput(input) {
  if (!input || typeof input !== "object") {
    throw new AppError("Invalid product input", 400);
  }

  const { name, priceUSD, stock, category } = input;

  if (typeof name !== "string" || name.trim().length === 0) {
    throw new AppError("Invalid product input", 400);
  }

  if (typeof category !== "string" || category.trim().length === 0) {
    throw new AppError("Invalid product input", 400);
  }

  if (typeof priceUSD !== "number" || priceUSD <= 0) {
    throw new AppError("Invalid product input", 400);
  }

  if (typeof stock !== "number" || stock < 0) {
    throw new AppError("Invalid product input", 400);
  }
}

/**
 * Build a map { productId: totalQty } from cart/order items
 */
function aggregateQuantities(items) {
  const byId = new Map();
  for (const it of items || []) {
    const pid = String(it.productId);
    const qty = Number(it.quantity || 0);
    if (!pid || qty <= 0) continue;
    byId.set(pid, (byId.get(pid) || 0) + qty);
  }
  return byId;
}

function createProductsService(deps = {}) {
  const productsRepository =
    deps.productsRepository || new InMemoryProductsRepository();

  async function getProducts() {
    const products = await productsRepository.findAll();
    return products.map(toProductReadModel);
  }

  async function getProductById(id) {
    const product = await productsRepository.findById(id);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return toProductReadModel(product);
  }

  async function createProduct(input) {
    validateCreateInput(input);

    const productData = {
      name: input.name.trim(),
      priceUSD: input.priceUSD,
      stock: input.stock,
      category: input.category.trim(),
    };

    const newProduct = await productsRepository.create(productData);

    return toProductReadModel(newProduct);
  }

  async function updateProduct(id, input) {
    const existing = await productsRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Product not found");
    }

    validateCreateInput(input);

    const productData = {
      name: input.name.trim(),
      priceUSD: input.priceUSD,
      stock: input.stock,
      category: input.category.trim(),
    };

    const updatedProduct = await productsRepository.update(id, productData);

    return toProductReadModel(updatedProduct);
  }

  async function deleteProduct(id) {
    const deletedProduct = await productsRepository.delete(id);

    if (!deletedProduct) {
      throw new NotFoundError("Product not found");
    }

    return toProductReadModel(deletedProduct);
  }

  /**
   * ✅ Decrement stock when an order is created (after payment confirm)
   * items: [{ productId, quantity, ... }]
   *
   * - Validates product exists
   * - Validates stock is sufficient
   * - Updates stock in repository
   */
  async function decrementStockForItems(items) {
    const qtyMap = aggregateQuantities(items);

    // 1) Validate all products exist and have enough stock
    for (const [productId, qty] of qtyMap.entries()) {
      const p = await productsRepository.findById(productId);
      if (!p) throw new NotFoundError("Product not found");

      const current = Number(p.stock || 0);
      if (current < qty) {
        throw new AppError(`Insufficient stock for product ${productId}`, 409);
      }
    }

    // 2) Apply updates
    for (const [productId, qty] of qtyMap.entries()) {
      const p = await productsRepository.findById(productId);
      const nextStock = Number(p.stock || 0) - qty;
      await productsRepository.update(productId, { stock: nextStock });
    }

    return true;
  }

  return {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    decrementStockForItems, // ✅ new
  };
}

// Initial seed data for backward compatibility with existing tests
const SEED_PRODUCTS = [
  { name: "Laptop", priceUSD: 1000, stock: 10, category: "Electronics" },
  { name: "Mouse", priceUSD: 20, stock: 50, category: "Electronics" },
  { name: "Keyboard", priceUSD: 50, stock: 30, category: "Electronics" },
  { name: "USB Cable", priceUSD: 5, stock: 0, category: "Electronics" },
];

// Default instance for backward compatibility
const defaultService = createProductsService({
  productsRepository: new InMemoryProductsRepository(SEED_PRODUCTS),
});

module.exports = {
  createProductsService,
  getProducts: defaultService.getProducts,
  getProductById: defaultService.getProductById,
  createProduct: defaultService.createProduct,
  updateProduct: defaultService.updateProduct,
  deleteProduct: defaultService.deleteProduct,
  decrementStockForItems: defaultService.decrementStockForItems, // ✅ export
};
