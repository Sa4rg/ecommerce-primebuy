import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../context/CartContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

export function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}
