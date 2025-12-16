const products = [
  { id: '1', name: 'Laptop', priceUSD: 1000, stock: 10, category: 'Electronics' },
  { id: '2', name: 'Mouse', priceUSD: 20, stock: 50, category: 'Electronics' },
  { id: '3', name: 'Keyboard', priceUSD: 50, stock: 30, category: 'Electronics' }
];

function listProducts() {
  return Promise.resolve(products);
}

function getProductById(id) {
  const product = products.find(p => p.id === id);
  if (!product) {
    throw new Error('Product not found');
  }
  return Promise.resolve(product);
}

module.exports = { listProducts, getProductById };