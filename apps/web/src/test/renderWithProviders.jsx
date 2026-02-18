// web/src/test/renderWithProviders.jsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../context/CartContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

export function renderWithProviders(ui, { route = "/", cartInitialState } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <CartProvider initialState={cartInitialState}>{ui}</CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}
