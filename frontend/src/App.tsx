import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ROUTES } from "./constants/routes";

import { queryClient } from "./lib/queryClient";

import RootLayout from "./components/layout/RootLayout";
import Landing from "./pages/Landing";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import VendorLayout from "./components/layout/VendorLayout";
import DashboardPage from "./pages/vendor/pages/DashboardPage";
import ProductsPage from "./pages/vendor/pages/ProductPage";
import NewProductPage from "./pages/vendor/pages/NewProductPage";
import StorekeeperPage from "./pages/vendor/pages/StorekeeperPage";
import NotificationsPage from "./pages/vendor/pages/NotificationPage";
import SalesPage from "./pages/vendor/pages/SalesPage";
import ReportsPage from "./pages/vendor/pages/ReportPage";
import SettingsPage from "./pages/vendor/pages/SettingsPage";
import EditProductPage from "./pages/vendor/pages/EditProductPage";
// import PayPalPage from "./pages/vendor/pages/PayPalPage";
import AdminAnalyticsPage from "./pages/admin/pages/AdminAnalyticsPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminVendorsPage from "./pages/admin/pages/AdminVendorsPage";
import AdminVendorAnalyticsPage from "./pages/admin/pages/AdminVendorAnalyticPage";
import AdminScannersPage from "./pages/admin/pages/AdminScannerPage";
import AdminSalesPage from "./pages/admin/pages/AdminSalesPage";
import AdminSubscriptionsPage from "./pages/admin/pages/AdminSubscriptionPage";
import ReportDownloadPage from "./pages/vendor/pages/ReportDownloadPage";
import AdminReportsPage from "./pages/admin/pages/AdminReportsPage";
import AdminNotificationsPage from "./pages/admin/pages/AdminNotificationsPage";
import AdminProductsPage from "./pages/admin/pages/AdminProductPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SubscriptionPage from "./pages/vendor/pages/SubscriptionPage";
import OverviewSection from "./pages/vendor/component/subscription/OverviewSection";
import ActivatePlanPage from "./pages/vendor/pages/ActivatePlanPage";
import UpgradePlanPage from "./pages/vendor/pages/UpgradePlanPage";
import DowngradePlanPage from "./pages/vendor/pages/DowngradePlanPAge";
import CancelSubscriptionPage from "./pages/vendor/pages/CancelSubscriptionPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path={ROUTES.HOME} element={<RootLayout />}>
            <Route index element={<Landing />} />
          </Route>

          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<ForgotPasswordPage />}
          />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

          <Route path={ROUTES.DASHBOARD} element={<VendorLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
            <Route path={ROUTES.STOREKEEPER} element={<StorekeeperPage />} />
            <Route
              path={ROUTES.NOTIFICATIONS}
              element={<NotificationsPage />}
            />
            <Route path={ROUTES.SALES} element={<SalesPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route
              path={ROUTES.DOWNLOAD_REPORT}
              element={<ReportDownloadPage />}
            />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.SUBSCRIPTION} element={<SubscriptionPage />}>
              <Route index element={<OverviewSection />} />
              <Route path="activate" element={<ActivatePlanPage />} />
              <Route path="upgrade" element={<UpgradePlanPage />} />
              <Route path="downgrade" element={<DowngradePlanPage />} />
              <Route path="cancel" element={<CancelSubscriptionPage />} />
            </Route>
            <Route path={ROUTES.NEW_PRODUCT} element={<NewProductPage />} />
            <Route path={ROUTES.EDIT_PRODUCT} element={<EditProductPage />} />
          </Route>

          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminLayout />}>
            <Route index element={<AdminAnalyticsPage />} />
            <Route path={ROUTES.ADMIN_VENDORS} element={<AdminVendorsPage />} />
            <Route
              path={ROUTES.ADMIN_VENDOR_ANALYTICS}
              element={<AdminVendorAnalyticsPage />}
            />
            <Route
              path={ROUTES.ADMIN_SCANNERS}
              element={<AdminScannersPage />}
            />
            <Route path={ROUTES.ADMIN_SALES} element={<AdminSalesPage />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
            <Route
              path={ROUTES.ADMIN_NOTIFICATIONS}
              element={<AdminNotificationsPage />}
            />
            <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
            <Route
              path={ROUTES.ADMIN_SUBSCRIPTIONS}
              element={<AdminSubscriptionsPage />}
            />
            <Route
              path={ROUTES.ADMIN_PRODUCT}
              element={<AdminProductsPage />}
            />
            <Route path="products/:id/edit" element={<EditProductPage />} />
          </Route>
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss
        draggable
        theme="colored"
        toastClassName="!rounded-xl !text-sm !font-medium !shadow-lg"
        style={{ zIndex: 9999 }}
      />

      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
