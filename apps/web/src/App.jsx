import "./App.css";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { CartIndicator } from "./shared/components/CartIndicator.jsx";
import { CartView } from "./features/shopping-cart/components/CartView.jsx";
import { ProductCatalogView } from "./features/product-catalog/ProductCatalogView.jsx";
import { CheckoutView } from "./features/checkout/components/CheckoutView.jsx";
import { CheckoutStart } from "./features/checkout/components/CheckoutStart.jsx";
import { LoginView } from "./features/auth/components/LoginView.jsx";
import { RegisterView } from "./features/auth/components/RegisterView.jsx";
import { PaymentMethodPage } from "./features/payment/components/PaymentMethodPage.jsx";
import { PaymentStatusPage } from "./features/payment/components/PaymentStatusPage.jsx";
import { OrderDetailPage } from "./features/orders/components/OrderDetailPage.jsx";
import { AdminPaymentsPage } from "./features/admin/components/AdminPaymentsPage.jsx";
import { RequireAdmin } from "./shared/components/RequireAdmin.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { AccountPage } from "./features/account/components/AccountPage.jsx";
import { RequireAuth } from "./shared/components/RequireAuth.jsx";


function getHeaderContent(pathname) {
  if (pathname === "/cart") {
    return { title: "Cart", subtitle: "Your selected items" };
  }

  if (pathname.startsWith("/checkout")) {
    return { title: "Checkout", subtitle: "Review your order" };
  }

  if (pathname.startsWith("/payments")) {
    return { title: "Catalog", subtitle: "Products available" };
  }

  if (pathname.startsWith("/orders")) {
    return { title: "Catalog", subtitle: "Products available" };
  }

  return { title: "Catalog", subtitle: "Products available" };
}

function App() {
  const location = useLocation();
  const { title, subtitle } = getHeaderContent(location.pathname);

  const { isAuthenticated, role, logout } = useAuth();

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

            {role === "admin" && (
              <Link to="/admin/payments" style={{ fontWeight: "bold", color: "#f0f" }}>
                Admin
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/account">
                Account
              </Link>
            )}

            {!isAuthenticated ? (
              <Link to="/login">Login</Link>
            ) : (
              <button type="button" onClick={logout}>
                Logout
              </button>
            )}

            {location.pathname === "/" && <Link to="/cart">View cart</Link>}
            {location.pathname === "/cart" && <Link to="/">Back to catalog</Link>}
            {location.pathname.startsWith("/checkout") && <Link to="/cart">Back to cart</Link>}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<ProductCatalogView />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/checkout" element={<CheckoutStart />} />
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
        <Route path="/checkout/:checkoutId/payment" element={<PaymentMethodPage />} />
        <Route path="/payments/:paymentId" element={<PaymentStatusPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />

        <Route
          path="/admin/payments"
          element={
            <RequireAdmin>
              <AdminPaymentsPage />
            </RequireAdmin>
          }
        />

        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        
        <Route path="/account" element={
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        }
      />

      </Routes>
    </div>
  );
}

export default App;
