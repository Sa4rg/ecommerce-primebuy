/**
 * MySQLProductsRepository
 * 
 * MySQL implementation of ProductsRepository contract.
 * Uses Knex for database operations.
 * 
 * Contract rules:
 * - IDs are ALWAYS strings (input and output)
 * - DB stores INT AUTO_INCREMENT, repository converts to/from string
 * - Returns null when entity not found (findById, update, delete)
 * - No business validation (persistence only)
 * - Snake_case columns in DB, camelCase in JS
 */

const db = require('../../db/knex');

class MySQLProductsRepository {
  constructor() {
    this.table = 'products';
  }

  /**
   * Convert DB row to Product object
   * @private
   */
  _mapToProduct(row) {
    if (!row) return null;
    
    return {
      id: String(row.id),
      name: row.name,
      priceUSD: parseFloat(row.price_usd),
      stock: row.stock,
      category: row.category,
    };
  }

  /**
   * Convert Product data to DB format
   * @private
   */
  _mapToDbFormat(productData) {
    const dbData = {};
    
    if (productData.name !== undefined) dbData.name = productData.name;
    if (productData.priceUSD !== undefined) dbData.price_usd = productData.priceUSD;
    if (productData.stock !== undefined) dbData.stock = productData.stock;
    if (productData.category !== undefined) dbData.category = productData.category;
    
    return dbData;
  }

  /**
   * Find all products in creation order (oldest first)
   * @returns {Promise<Product[]>}
   */
  async findAll() {
    const rows = await db(this.table).select('*').orderBy('id', 'asc');
    return rows.map(row => this._mapToProduct(row));
  }

  /**
   * Find product by ID
   * @param {string} id
   * @returns {Promise<Product|null>}
   */
  async findById(id) {
    const row = await db(this.table)
      .where({ id: parseInt(id, 10) })
      .first();
    
    return this._mapToProduct(row);
  }

  /**
   * Create new product
   * @param {ProductData} productData
   * @returns {Promise<Product>}
   */
  async create(productData) {
    const dbData = this._mapToDbFormat(productData);
    
    const [insertId] = await db(this.table).insert(dbData);
    
    // Fetch the created product
    const createdProduct = await this.findById(String(insertId));
    return createdProduct;
  }

  /**
   * Update existing product
   * @param {string} id
   * @param {Partial<ProductData>} productData
   * @returns {Promise<Product|null>}
   */
  async update(id, productData) {
    const numericId = parseInt(id, 10);
    
    // Check if product exists
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const dbData = this._mapToDbFormat(productData);
    
    await db(this.table)
      .where({ id: numericId })
      .update(dbData);
    
    // Fetch and return updated product
    return this.findById(id);
  }

  /**
   * Delete product
   * @param {string} id
   * @returns {Promise<Product|null>}
   */
  async delete(id) {
    const numericId = parseInt(id, 10);
    
    // Fetch product before deleting
    const product = await this.findById(id);
    if (!product) return null;
    
    await db(this.table)
      .where({ id: numericId })
      .delete();
    
    return product;
  }
}

module.exports =  { MySQLProductsRepository };
