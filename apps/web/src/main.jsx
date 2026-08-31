import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./shared/i18n/LanguageContext.jsx";
import { ConsentProvider } from "./shared/consent/ConsentContext.jsx";
import { CookieBanner } from "./shared/consent/CookieBanner.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConsentProvider>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
      <CookieBanner />
  </ConsentProvider>
  </StrictMode>
);