import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./shared/layout/AppLayout.jsx";
import { ProductCatalogView } from "./features/product-catalog/ProductCatalogView.jsx";
import { CartView } from "./features/shopping-cart/components/CartView.jsx";
import { CheckoutStart } from "./features/checkout/components/CheckoutStart.jsx";
import { CheckoutView } from "./features/checkout/CheckoutView.jsx";
import { PaymentMethodPage } from "./features/payment/components/PaymentMethodPage.jsx";
import { PaymentStatusPage } from "./features/payment/components/PaymentStatusPage.jsx";
import { OrderDetailPage } from "./features/orders/components/OrderDetailPage.jsx";
import { LoginView } from "./features/auth/components/LoginView.jsx";
import { RegisterView } from "./features/auth/components/RegisterView.jsx";
import { AdminPaymentsPage } from "./features/admin/components/AdminPaymentsPage.jsx";
import { RequireAdmin } from "./shared/components/RequireAdmin.jsx";
import { AccountPage } from "./features/account/components/AccountPage.jsx";
import { RequireAuth } from "./shared/components/RequireAuth.jsx";
import { ProductDetailView } from "./features/product-detail/ProductDetailView.jsx";
import { AdminProductsPage } from "./features/admin/components/AdminProductsPage.jsx";


function App() {
  return (
    <Routes>
      {/* Layout */}
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/" element={<ProductCatalogView />} />
        <Route path="/cart" element={<CartView />} />

        {/* Product detail ✅ (ADENTRO del layout) */}
        <Route path="/products/:id" element={<ProductDetailView />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutStart />} />
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
        <Route path="/checkout/:checkoutId/payment" element={<PaymentMethodPage />} />

        {/* Payment & Order */}
        <Route path="/payments/:paymentId" element={<PaymentStatusPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />

        {/* Account */}
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/payments"
          element={
            <RequireAdmin>
              <AdminPaymentsPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route
        path="/admin/products"
        element={
          <RequireAdmin>
            <AdminProductsPage />
          </RequireAdmin>
        }
      />

    </Routes>
  );
}

export default App;
