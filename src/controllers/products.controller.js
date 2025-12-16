const { success, fail } = require('../utils/response');
const productsService = require('../services/products.service');

async function listProducts(req, res, next) {
  try {
    const products = await productsService.listProducts();
    success(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(id);
    success(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { listProducts, getProductById };