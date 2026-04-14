// apps/api/src/services/products.service.js
const { AppError, NotFoundError } = require("../utils/errors");
const { InMemoryProductsRepository } = require("../repositories/products/products.memory.repository");
const { sendLowStockAlert } = require("../infrastructure/lambda/inventoryAlerts");

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

function validateCreateUpdateInput(input) {
  if (!input || typeof input !== "object") {
    throw new AppError("Invalid product input", 400);
  }

  const {
    name,
    nameES,
    nameEN,
    priceUSD,
    stock,
    category,
    specs,
    imageUrl,
    gallery,
    shortDescES,
    shortDescEN,
  } = input;

  // ✅ Nombre: aceptamos name OR nameES/nameEN
  const hasAnyName =
    (typeof name === "string" && name.trim().length > 0) ||
    (typeof nameES === "string" && nameES.trim().length > 0) ||
    (typeof nameEN === "string" && nameEN.trim().length > 0);

  if (!hasAnyName) {
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

  if (specs !== undefined && !Array.isArray(specs)) {
    throw new AppError("Invalid product input", 400);
  }

  if (gallery !== undefined && !Array.isArray(gallery)) {
    throw new AppError("Invalid product input", 400);
  }

  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== "string") {
    throw new AppError("Invalid product input", 400);
  }

  if (shortDescES !== undefined && shortDescES !== null && typeof shortDescES !== "string") {
    throw new AppError("Invalid product input", 400);
  }

  if (shortDescEN !== undefined && shortDescEN !== null && typeof shortDescEN !== "string") {
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
  const productsRepository = deps.productsRepository || new InMemoryProductsRepository();
  const notifyLowStock = deps.notifyLowStock || sendLowStockAlert;

  async function getProducts() {
    const products = await productsRepository.findAll();
    return products.map(toProductReadModel);
  }

  async function getProductById(id) {
    const product = await productsRepository.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return toProductReadModel(product);
  }

  function buildProductData(input) {
    const nameES = typeof input.nameES === "string" ? input.nameES.trim() : "";
    const nameEN = typeof input.nameEN === "string" ? input.nameEN.trim() : "";
    const legacyName = typeof input.name === "string" ? input.name.trim() : "";

    // ✅ name fallback para compatibilidad
    const name = nameES || nameEN || legacyName;

    const specs = Array.isArray(input.specs) ? input.specs : [];
    const gallery = Array.isArray(input.gallery) ? input.gallery : [];

    return {
      // legacy + core
      name,
      priceUSD: input.priceUSD,
      stock: input.stock,
      category: String(input.category || "").trim(),

      // i18n
      nameES: nameES || null,
      nameEN: nameEN || null,
      shortDescES: typeof input.shortDescES === "string" ? input.shortDescES.trim() : null,
      shortDescEN: typeof input.shortDescEN === "string" ? input.shortDescEN.trim() : null,

      // specs/images
      specs,
      imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim() : null,
      gallery: gallery.map((u) => String(u || "").trim()).filter(Boolean),
    };
  }

  async function createProduct(input) {
    validateCreateUpdateInput(input);
    const productData = buildProductData(input);
    const newProduct = await productsRepository.create(productData);
    return toProductReadModel(newProduct);
  }

  async function updateProduct(id, input) {
    const existing = await productsRepository.findById(id);
    if (!existing) throw new NotFoundError("Product not found");

    validateCreateUpdateInput(input);
    const productData = buildProductData(input);

    const updatedProduct = await productsRepository.update(id, productData);
    return toProductReadModel(updatedProduct);
  }

  async function deleteProduct(id) {
    const deletedProduct = await productsRepository.delete(id);
    if (!deletedProduct) throw new NotFoundError("Product not found");
    return toProductReadModel(deletedProduct);
  }

  async function decrementStockForItems(items) {
    const qtyMap = aggregateQuantities(items);

    for (const [productId, qty] of qtyMap.entries()) {
      const p = await productsRepository.findById(productId);
      if (!p) throw new NotFoundError("Product not found");

      const current = Number(p.stock || 0);
      if (current < qty) {
        throw new AppError(`Insufficient stock for product ${productId}`, 409);
      }
    }

    for (const [productId, qty] of qtyMap.entries()) {
      const p = await productsRepository.findById(productId);
      const nextStock = Number(p.stock || 0) - qty;
      await productsRepository.update(productId, { ...p, stock: nextStock });

      // 🔔 Check if stock is low and send alert
      if (nextStock <= 1) {
        try {
          await notifyLowStock({
            productId: p.id,
            productName: p.nameES || p.nameEN || p.name,
            currentStock: nextStock,
          });
        } catch (error) {
          // Log error but don't stop the process
          console.error(`[Products Service] Failed to send low stock alert for product ${p.id}:`, error.message);
        }
      }
    }

    return true;
  }

  return {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    decrementStockForItems,
  };
}

const SEED_PRODUCTS = [
  { name: "Laptop", priceUSD: 1000, stock: 10, category: "Electronics" },
  { name: "Mouse", priceUSD: 20, stock: 50, category: "Electronics" },
  { name: "Keyboard", priceUSD: 50, stock: 30, category: "Electronics" },
  { name: "USB Cable", priceUSD: 5, stock: 0, category: "Electronics" },
];

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
  decrementStockForItems: defaultService.decrementStockForItems,
};