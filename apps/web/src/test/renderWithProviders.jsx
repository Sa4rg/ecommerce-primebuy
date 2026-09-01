// web/src/test/renderWithProviders.jsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../context/CartContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { LanguageProvider } from "../shared/i18n/LanguageContext.jsx";
import { AgeVerificationProvider } from "../shared/age-verification/AgeVerificationContext.jsx";

export function renderWithProviders(ui, { route = "/", cartInitialState } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AgeVerificationProvider>
          <AuthProvider>
            <CartProvider initialState={cartInitialState}>{ui}</CartProvider>
          </AuthProvider>
        </AgeVerificationProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}