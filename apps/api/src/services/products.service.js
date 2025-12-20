const { NotFoundError } = require('../utils/errors');

const products = [
  { id: '1', name: 'Laptop', priceUSD: 1000, stock: 10, category: 'Electronics' },
  { id: '2', name: 'Mouse', priceUSD: 20, stock: 50, category: 'Electronics' },
  { id: '3', name: 'Keyboard', priceUSD: 50, stock: 30, category: 'Electronics' }
];

async function getProducts() {
  return products;
}

async function getProductById(id) {
  const product = products.find(p => p.id === id);

    if (!product) {
    throw new NotFoundError('Product not found');
    }

  return product;
}

module.exports = { getProducts, getProductById };