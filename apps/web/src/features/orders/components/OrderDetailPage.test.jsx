import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "../../../shared/i18n/LanguageContext.jsx";
import { OrderDetailPage } from "./OrderDetailPage.jsx";

function renderWithRouter(orderId = "order-123") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );
}

function mockFetchOrder(orderData) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: orderData }),
  });
}

function mockFetchError(errorMessage) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ success: false, message: errorMessage }),
  });
}

describe("OrderDetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading initially, then displays order details", async () => {
    const mockOrder = {
      orderId: "order-123",
      status: "paid",
      items: [
        { productId: "prod-1", name: "Product A", quantity: 2, unitPriceUSD: 20, lineTotalUSD: 40 },
        { productId: "prod-2", name: "Product B", quantity: 1, unitPriceUSD: 25, lineTotalUSD: 25 },
      ],
      totals: {
        amountPaid: 65,
        currency: "USD",
      },
    };

    mockFetchOrder(mockOrder);

    renderWithRouter();

    expect(await screen.findByText(/detalle del pedido/i)).toBeInTheDocument();

    expect(screen.getAllByText(/pagado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Product A/i)).toBeInTheDocument();
    expect(screen.getByText(/Product B/i)).toBeInTheDocument();
    expect(screen.getByText(/\$40\.00/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$25\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$65\.00/i).length).toBeGreaterThan(0);
  });

  it("shows error message when order fails to load", async () => {
    mockFetchError("Order not found");

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    });
  });

  it("calls fetch with correct orderId from URL", async () => {
    mockFetchOrder({
      orderId: "specific-order-id",
      status: "processing",
      items: [],
      totals: { amountPaid: 0, currency: "USD" },
    });

    renderWithRouter("specific-order-id");

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders/specific-order-id"),
        expect.anything()
      );
    });
  });

  it("displays multiple items correctly", async () => {
    const mockOrder = {
      orderId: "order-multi",
      status: "completed",
      items: [
        { productId: "p1", name: "Item One", quantity: 3, unitPriceUSD: 10, lineTotalUSD: 30 },
        { productId: "p2", name: "Item Two", quantity: 1, unitPriceUSD: 15, lineTotalUSD: 15 },
        { productId: "p3", name: "Item Three", quantity: 5, unitPriceUSD: 10, lineTotalUSD: 50 },
      ],
      totals: { amountPaid: 95, currency: "USD" },
    };

    mockFetchOrder(mockOrder);

    renderWithRouter("order-multi");

    expect(await screen.findByText(/Item One/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Two/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Three/i)).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4);
  });
});
