import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/renderWithProviders.jsx";
import { ProductCatalogView } from "./ProductCatalogView.jsx";

function getFavoritesToggle() {
  return screen.getByRole("button", { name: /favoritos|favorites/i });
}

vi.mock("../../api/products", () => ({
  fetchProducts: vi.fn(),
}));

// Mock ProductCard to avoid cart/network complexity
vi.mock("../../shared/components/ProductCard.jsx", () => ({
  ProductCard: ({ product, isFavorite, onToggleFavorite }) => {
    return (
      <div data-testid={`product-${product.id}`}>
        <div>{product.name}</div>
        <button
          type="button"
          aria-label="Favorite"
          aria-pressed={Boolean(isFavorite)}
          onClick={() => onToggleFavorite?.(product.id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
    );
  },
}));

function makeProducts(count) {
  const categories = ["Camaras", "Relojes", "Juguetes Sexuales", "Accesorios LED", "Accesorios de Vehiculos"];
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `p-${n}`,
      name: `Product ${n}`,
      priceUSD: n * 10, // 10, 20, 30...
      stock: 5,
      inStock: true,
      category: categories[i % categories.length],
    };
  });
}

describe("ProductCatalogView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders breadcrumbs without 'Cameras & Gadgets' and does not show local search input", async () => {
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(3));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    // Breadcrumbs
    expect(await screen.findByText("Home")).toBeInTheDocument();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveTextContent("Electrónica");
    expect(screen.queryByText("Cameras & Gadgets")).not.toBeInTheDocument();

    // Local search must be removed (navbar search remains elsewhere)
    expect(screen.queryByPlaceholderText(/search gadgets/i)).not.toBeInTheDocument();
  });

  it("shows the new product categories", async () => {
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(10));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    expect(await screen.findByRole("button", { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cámaras/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /relojes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /juguetes para adultos|adult toys/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accesorios led/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accesorios de vehículos/i })).toBeInTheDocument();

    // Old categories should not be present
    expect(screen.queryByRole("button", { name: /security cameras/i })).not.toBeInTheDocument();
  });

  it("filters products when clicking a category", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    // Products: p-1 Camaras, p-2 Relojes, p-3 Juguetes Sexuales, p-4 Accesorios LED, p-5 Accesorios de Vehiculos, p-6 Camaras, p-7 Relojes...
    fetchProducts.mockResolvedValueOnce(makeProducts(10));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    // Click Relojes category
    await user.click(screen.getByRole("button", { name: /relojes/i }));

    // Should show only Relojes products (p-2, p-7)
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Product 7")).toBeInTheDocument();
    // Should not show other categories
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 3")).not.toBeInTheDocument();
  });

  it("reads category from URL query param on load", async () => {
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(10));

    // Navigate with ?category=cameras
    renderWithProviders(<ProductCatalogView />, { route: "/products?category=cameras" });

    // Should auto-filter to Camaras (p-1, p-6)
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 6")).toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
  });

  it("filters products by price range inputs", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(10)); // prices: 10..100

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    // Wait products (page 1 shows only first PAGE_SIZE items)
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 9")).toBeInTheDocument();
    expect(screen.queryByText("Product 10")).not.toBeInTheDocument();

    const minInput = screen.getByLabelText(/min price|precio m[íi]n/i);
    const maxInput = screen.getByLabelText(/max price|precio m[áa]x/i);

    await user.clear(minInput);
    await user.type(minInput, "30");

    await user.clear(maxInput);
    await user.type(maxInput, "60");

    // Should show Product 3..6 only
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
    expect(screen.getByText("Product 6")).toBeInTheDocument();
    expect(screen.queryByText("Product 7")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 10")).not.toBeInTheDocument();
  });

  it("filters by favorites using the Favorites button (toggle)", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(5));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    // Favorite product 2 and 4 (heart buttons inside cards)
    const favButtons = screen.getAllByRole("button", { name: "Favorite" });
    await user.click(favButtons[1]); // Product 2
    await user.click(favButtons[3]); // Product 4

    const favoritesToggle = getFavoritesToggle();
    await user.click(favoritesToggle);

    // Should only show favorites
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.queryByText("Product 3")).not.toBeInTheDocument();
    expect(screen.getByText("Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Product 5")).not.toBeInTheDocument();

    // Toggle off -> show all again
    await user.click(getFavoritesToggle());
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 5")).toBeInTheDocument();
  });

  it("paginates results with working page buttons", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(13));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    // Page size expected: 9
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 9")).toBeInTheDocument();
    expect(screen.queryByText("Product 10")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.getByText("Product 10")).toBeInTheDocument();
    expect(screen.getByText("Product 13")).toBeInTheDocument();
  });

  it("updates the page title based on selected category", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(8));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    // Default title should be section name (Electronics in ES)
    expect(await screen.findByRole("heading", { name: /electrónica/i })).toBeInTheDocument();

    // Select Relojes -> title changes
    await user.click(screen.getByRole("button", { name: /relojes/i }));
    expect(screen.getByRole("heading", { name: /relojes/i })).toBeInTheDocument();

    // Select Cámaras -> title changes
    await user.click(screen.getByRole("button", { name: /cámaras/i }));
    expect(screen.getByRole("heading", { name: /cámaras/i })).toBeInTheDocument();
  });

  it("persists favorites to localStorage and restores them on remount", async () => {
    const user = userEvent.setup();
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValue(makeProducts(5)); // used for both mounts

    const { unmount } = renderWithProviders(<ProductCatalogView />, { route: "/" });
    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    // Favorite product 2 (heart button)
    const heartButtons = screen.getAllByRole("button", { name: "Favorite" });
    await user.click(heartButtons[1]); // Product 2

    // Unmount + remount
    unmount();

    renderWithProviders(<ProductCatalogView />, { route: "/" });
    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    // Enable favorites-only filter -> Product 2 should appear, others hidden
    await user.click(getFavoritesToggle());

    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
  });
});