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
import { AdminFxPage } from "./features/admin/components/AdminFxPage.jsx";
import { RequireAdmin } from "./shared/components/RequireAdmin.jsx";
import { AccountPage } from "./features/account/components/AccountPage.jsx";
import { RequireAuth } from "./shared/components/RequireAuth.jsx";
import { ProductDetailView } from "./features/product-detail/ProductDetailView.jsx";
import { AdminProductsPage } from "./features/admin/components/AdminProductsPage.jsx";
import { AdminPaymentDetailPage } from "./features/admin/components/AdminPaymentDetailPage.jsx";
import { ForgotPasswordView } from "./features/auth/components/ForgotPasswordView.jsx";
import { ResetPasswordView } from "./features/auth/components/ResetPasswordView.jsx";
import { AuthCallbackView } from "./features/auth/components/AuthCallbackView.jsx";
import { VerifyEmailView } from "./features/auth/components/VerifyEmailView.jsx";
import { TermsPage } from "./features/legal/components/TermsPage.jsx";
import { PrivacyPage } from "./features/legal/components/PrivacyPage.jsx";
import { FaqPage } from "./features/support/components/FaqPage.jsx";
import { ShippingPage } from "./features/support/components/ShippingPage.jsx";
import { ReturnsPage } from "./features/support/components/ReturnsPage.jsx";
import { WarrantyPage } from "./features/support/components/WarrantyPage.jsx";


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
        {/* no se usa por ahora
         <Route path="/checkout/:checkoutId/payment" element={<PaymentMethodPage />} /> */}

        {/* Payment & Order */}
        <Route path="/payments/:paymentId" element={<PaymentStatusPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />

        <Route
          path="/admin/products"
          element={
            <RequireAdmin>
              <AdminProductsPage />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/payments/:paymentId"
          element={
            <RequireAdmin>
              <AdminPaymentDetailPage />
            </RequireAdmin>
          }
        />


        {/* Auth */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/verify-email" element={<VerifyEmailView />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/auth/callback" element={<AuthCallbackView />} />

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
        <Route
          path="/admin/fx"
          element={
            <RequireAdmin>
              <AdminFxPage />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      <Route path="/support/faq" element={<FaqPage />} />
      <Route path="/support/shipping" element={<ShippingPage />} />
      <Route path="/support/returns" element={<ReturnsPage />} />
      <Route path="/support/warranty" element={<WarrantyPage />} />
    </Routes>
  );
}

export default App;
