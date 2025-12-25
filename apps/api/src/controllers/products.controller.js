const { success, fail } = require('../utils/response');
const productsService = require('../services/products.service');

async function listProducts(req, res, next) {
  try {
    const products = await productsService.getProducts();
    success(res, products, 'Products retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(id);
    success(res, product, 'Product retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const created = await productsService.createProduct(req.body);
    res.status(201);
    success(res, created, "Product created successfully");
  } catch (error) {
    return next(error);
  }
}


module.exports = { listProducts, getProductById, createProduct };