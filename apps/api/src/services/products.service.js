const { AppError, NotFoundError } = require('../utils/errors');

const products = [
  { id: '1', name: 'Laptop', priceUSD: 1000, stock: 10, category: 'Electronics' },
  { id: '2', name: 'Mouse', priceUSD: 20, stock: 50, category: 'Electronics' },
  { id: '3', name: 'Keyboard', priceUSD: 50, stock: 30, category: 'Electronics' },
  { id: '4', name: 'USB Cable', priceUSD: 5, stock: 0, category: 'Electronics' }

];

function toProductReadModel(product) {
  if (typeof product.priceUSD !== 'number' || product.priceUSD <= 0) {
    throw new AppError('Invalid product data', 500);
  }

  if (typeof product.stock !== 'number' || product.stock < 0) {
    throw new AppError('Invalid product data', 500);
  }

  return {
    ...product,
    inStock: product.stock > 0,
  };
}

async function getProducts() {
  return products.map(toProductReadModel);
}

async function getProductById(id) {
  const product = products.find(p => p.id === id);

    if (!product) {
    throw new NotFoundError('Product not found');
    }

  return toProductReadModel(product);
}

module.exports = { getProducts, getProductById };