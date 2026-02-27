class InMemoryProductsRepository {
  constructor(initialProducts = []) {
    this.productsById = new Map();
    this.nextId = 1;

    for (const product of initialProducts) {
      const id = String(this.nextId++);
      this.productsById.set(id, { ...product, id });
    }
  }

  async findAll() {
    return Array.from(this.productsById.values());
  }

  async findById(id) {
    return this.productsById.get(String(id)) || null;
  }

  async create(productData) {
    const id = String(this.nextId++);
    const product = { id, ...productData };
    this.productsById.set(id, product);
    return product;
  }

  async update(id, productData) {
    const key = String(id);
    const existing = this.productsById.get(key);
    if (!existing) return null;

    const updated = { ...existing, ...productData, id: key };
    this.productsById.set(key, updated);
    return updated;
  }

  async delete(id) {
    const key = String(id);
    const existing = this.productsById.get(key);
    if (!existing) return null;

    this.productsById.delete(key);
    return existing;
  }
}

module.exports = { InMemoryProductsRepository };