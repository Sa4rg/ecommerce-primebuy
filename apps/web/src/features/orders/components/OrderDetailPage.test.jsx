import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OrderDetailPage } from "./OrderDetailPage.jsx";

function renderWithRouter(orderId = "order-123") {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
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
        { productId: "prod-1", name: "Product A", quantity: 2, lineTotalUSD: 40 },
        { productId: "prod-2", name: "Product B", quantity: 1, lineTotalUSD: 25 },
      ],
      totals: {
        amountPaid: 65,
        currency: "USD",
      },
    };

    mockFetchOrder(mockOrder);

    renderWithRouter();

    // Wait for order to load
    await waitFor(() => {
      expect(screen.getByText(/order-123/i)).toBeInTheDocument();
    });

    // Check status
    expect(screen.getByText(/paid/i)).toBeInTheDocument();

    // Check items
    expect(screen.getByText(/Product A/i)).toBeInTheDocument();
    expect(screen.getByText(/x2/i)).toBeInTheDocument();
    expect(screen.getByText(/\$40/i)).toBeInTheDocument();

    expect(screen.getByText(/Product B/i)).toBeInTheDocument();
    expect(screen.getByText(/x1/i)).toBeInTheDocument();
    expect(screen.getByText(/\$25/i)).toBeInTheDocument();

    // Check totals
    expect(screen.getByText(/65 USD/i)).toBeInTheDocument();
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
        { productId: "p1", name: "Item One", quantity: 3, lineTotalUSD: 30 },
        { productId: "p2", name: "Item Two", quantity: 1, lineTotalUSD: 15 },
        { productId: "p3", name: "Item Three", quantity: 5, lineTotalUSD: 50 },
      ],
      totals: { amountPaid: 95, currency: "USD" },
    };

    mockFetchOrder(mockOrder);

    renderWithRouter("order-multi");

    await waitFor(() => {
      expect(screen.getByText(/Item One/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Item Two/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Three/i)).toBeInTheDocument();
    
    // Rows: incluye header row + 3 items => total 4
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4);

    // o si quieres contar SOLO items (filas del tbody)
    const bodyRows = screen.getAllByRole("row").filter((r) =>
      r.textContent?.includes("Item ")
    );
    expect(bodyRows).toHaveLength(3);
  });
});
