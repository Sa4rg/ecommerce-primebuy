// apps/api/src/controllers/products.controller.js
const { success } = require("../utils/response");
const { services } = require("../composition/root");

const productsService = services.productsService;

async function listProducts(req, res, next) {
  try {
    const products = await productsService.getProducts();
    success(res, products, "Products retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(id);
    success(res, product, "Product retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const created = await productsService.createProduct(req.body);
    res.status(201);
    success(res, created, "Product created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await productsService.updateProduct(id, req.body);
    success(res, updated, "Product updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await productsService.deleteProduct(id);
    success(res, deleted, "Product deleted successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};