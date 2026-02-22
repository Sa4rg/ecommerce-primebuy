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
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `p-${n}`,
      name: `Product ${n}`,
      priceUSD: n * 10, // 10, 20, 30...
      stock: 5,
      inStock: true,
      category: n % 2 === 0 ? "Watches" : "Security Cameras",
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

  it("shows only All, Watches, Security Cameras categories", async () => {
    const { fetchProducts } = await import("../../api/products");
    fetchProducts.mockResolvedValueOnce(makeProducts(4));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    expect(await screen.findByRole("button", { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /relojes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cámaras de seguridad/i })).toBeInTheDocument();

    // Old categories should not be present
    expect(screen.queryByRole("button", { name: /photography/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /audio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /wearables/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /home office/i })).not.toBeInTheDocument();
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

    const minInput = screen.getByLabelText(/min price/i);
    const maxInput = screen.getByLabelText(/max price/i);

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
    fetchProducts.mockResolvedValueOnce(makeProducts(4));

    renderWithProviders(<ProductCatalogView />, { route: "/" });

    // Default title should be section name (Electronics in ES)
    expect(await screen.findByRole("heading", { name: /electrónica/i })).toBeInTheDocument();

    // Select Watches -> title changes
    await user.click(screen.getByRole("button", { name: /relojes/i }));
    expect(screen.getByRole("heading", { name: /relojes/i })).toBeInTheDocument();

    // Select Security Cameras -> title changes
    await user.click(screen.getByRole("button", { name: /cámaras de seguridad/i }));
    expect(screen.getByRole("heading", { name: /cámaras de seguridad/i })).toBeInTheDocument();
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