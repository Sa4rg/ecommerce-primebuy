const { AppError, NotFoundError } = require("../utils/errors");

const products = [
  { id: "1", name: "Laptop", priceUSD: 1000, stock: 10, category: "Electronics" },
  { id: "2", name: "Mouse", priceUSD: 20, stock: 50, category: "Electronics" },
  { id: "3", name: "Keyboard", priceUSD: 50, stock: 30, category: "Electronics" },
  { id: "4", name: "USB Cable", priceUSD: 5, stock: 0, category: "Electronics" },
];

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

function generateId() {
  return String(products.length + 1);
}

async function getProducts() {
  return products.map(toProductReadModel);
}

async function getProductById(id) {
  const product = products.find(p => p.id === id);

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return toProductReadModel(product);
}

async function createProduct(input) {
  validateCreateInput(input);

  const newProduct = {
    id: generateId(),
    name: input.name.trim(),
    priceUSD: input.priceUSD,
    stock: input.stock,
    category: input.category.trim(),
  };

  products.push(newProduct);

  return toProductReadModel(newProduct);
}

async function updateProduct(id, input) {
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    throw new NotFoundError("Product not found");
  }

  validateCreateInput(input);

  const updatedProduct = {
    ...products[productIndex],
    name: input.name.trim(),
    priceUSD: input.priceUSD,
    stock: input.stock,
    category: input.category.trim(),
  };

  products[productIndex] = updatedProduct;

  return toProductReadModel(updatedProduct);
}

module.exports = { getProducts, getProductById, createProduct, updateProduct };
