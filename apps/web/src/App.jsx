import "./App.css";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { CartIndicator } from "./shared/components/CartIndicator.jsx";
import { CartView } from "./features/shopping-cart/components/CartView.jsx";
import { ProductCatalogView } from "./features/product-catalog/ProductCatalogView.jsx";
import { CheckoutView } from "./features/checkout/components/CheckoutView.jsx";
import { CheckoutStart } from "./features/checkout/components/CheckoutStart.jsx";

function getHeaderContent(pathname) {
  if (pathname === "/cart") {
    return { title: "Cart", subtitle: "Your selected items" };
  }

  if (pathname.startsWith("/checkout")) {
    return { title: "Checkout", subtitle: "Review your order" };
  }

  return { title: "Catalog", subtitle: "Products available" };
}

function App() {
  const location = useLocation();
  const { title, subtitle } = getHeaderContent(location.pathname);

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__header-row">
          <div>
            <h1>{title}</h1>
            <p className="page__subtitle">{subtitle}</p>
          </div>

          <div className="page__actions">
            <CartIndicator />

            {location.pathname === "/" && (
              <Link to="/cart">View cart</Link>
            )}

            {location.pathname === "/cart" && (
              <Link to="/">Back to catalog</Link>
            )}

            {location.pathname.startsWith("/checkout") && (
              <Link to="/cart">Back to cart</Link>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<ProductCatalogView />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/checkout" element={<CheckoutStart />} />
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
      </Routes>
    </div>
  );
}

export default App;
