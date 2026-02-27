const { InMemoryProductsRepository } = require("../../repositories/products/products.memory.repository");
const { MySQLProductsRepository } = require("../../repositories/products/products.mysql.repository");
const { shouldUseMySQL } = require("./repository.provider");

function createProductsRepository() {
  const useMySQL = shouldUseMySQL();
  if (useMySQL) return new MySQLProductsRepository();
  return new InMemoryProductsRepository();
}

module.exports = { createProductsRepository };