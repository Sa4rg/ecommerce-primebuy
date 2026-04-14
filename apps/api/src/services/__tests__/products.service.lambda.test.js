import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProductsService } from "../products.service.js";

describe("Products Service - Low Stock Lambda Integration", () => {
  let service;
  let mockRepository;
  let mockNotifyLowStock;

  beforeEach(() => {
    // Mock notifyLowStock function
    mockNotifyLowStock = vi.fn().mockResolvedValue(undefined);

    // Mock repository con productos de prueba
    const products = [
      { id: "1", name: "Laptop", nameES: "Portátil", stock: 5, priceUSD: 1000, category: "Electronics" },
      { id: "2", name: "Mouse", nameES: "Ratón", stock: 2, priceUSD: 20, category: "Electronics" },
      { id: "3", name: "Cable", nameES: "Cable USB", stock: 10, priceUSD: 5, category: "Electronics" },
    ];

    mockRepository = {
      findById: vi.fn((id) => {
        const product = products.find((p) => p.id === id);
        return Promise.resolve(product || null);
      }),
      update: vi.fn((id, data) => {
        const product = products.find((p) => p.id === id);
        if (product) {
          Object.assign(product, data);
        }
        return Promise.resolve(data);
      }),
    };

    service = createProductsService({ 
      productsRepository: mockRepository,
      notifyLowStock: mockNotifyLowStock, 
    });
  });

  it("should send Lambda alert when stock drops to 1", async () => {
    // Product 2 has stock=2, if we decrement 1, it will be 1 → should trigger alert
    const items = [{ productId: "2", quantity: 1 }];

    await service.decrementStockForItems(items);

    expect(mockNotifyLowStock).toHaveBeenCalledTimes(1);
    expect(mockNotifyLowStock).toHaveBeenCalledWith({
      productId: "2",
      productName: "Ratón",
      currentStock: 1,
    });
  });

  it("should send Lambda alert when stock drops to 0", async () => {
    // Product 2 has stock=2, if we decrement 2, it will be 0 → should trigger alert
    const items = [{ productId: "2", quantity: 2 }];

    await service.decrementStockForItems(items);

    expect(mockNotifyLowStock).toHaveBeenCalledTimes(1);
    expect(mockNotifyLowStock).toHaveBeenCalledWith({
      productId: "2",
      productName: "Ratón",
      currentStock: 0,
    });
  });

  it("should NOT send Lambda alert when stock remains above 1", async () => {
    // Product 1 has stock=5, if we decrement 2, it will be 3 → NO alert
    const items = [{ productId: "1", quantity: 2 }];

    await service.decrementStockForItems(items);

    expect(mockNotifyLowStock).not.toHaveBeenCalled();
  });

  it("should continue working even if Lambda fails", async () => {
    // Simulate Lambda failure
    mockNotifyLowStock.mockRejectedValueOnce(new Error("Lambda timeout"));

    const items = [{ productId: "2", quantity: 1 }];

    // Should NOT throw error
    await expect(service.decrementStockForItems(items)).resolves.toBe(true);

    // Stock should still be decremented
    expect(mockRepository.update).toHaveBeenCalledWith("2", expect.objectContaining({ stock: 1 }));
  });

  it("should send alert for each product that reaches low stock", async () => {
    // Multiple products: product 2 goes to 1, product 3 stays at 9 (no alert)
    const items = [
      { productId: "2", quantity: 1 }, // 2 → 1 (alert)
      { productId: "3", quantity: 1 }, // 10 → 9 (no alert)
    ];

    await service.decrementStockForItems(items);

    expect(mockNotifyLowStock).toHaveBeenCalledTimes(1);
    expect(mockNotifyLowStock).toHaveBeenCalledWith({
      productId: "2",
      productName: "Ratón",
      currentStock: 1,
    });
  });

  it("should use nameES if available, fallback to nameEN or name", async () => {
    // Product with only English name
    const productEN = {
      id: "4",
      name: "Keyboard",
      nameEN: "Keyboard",
      stock: 2,
      priceUSD: 50,
      category: "Electronics",
    };

    mockRepository.findById.mockImplementation((id) => {
      if (id === "4") return Promise.resolve(productEN);
      return Promise.resolve(null);
    });

    mockRepository.update.mockImplementation((id, data) => {
      if (id === "4") {
        Object.assign(productEN, data);
      }
      return Promise.resolve(data);
    });

    const items = [{ productId: "4", quantity: 1 }];

    await service.decrementStockForItems(items);

    expect(mockNotifyLowStock).toHaveBeenCalledWith({
      productId: "4",
      productName: "Keyboard", // nameEN fallback
      currentStock: 1,
    });
  });
});
