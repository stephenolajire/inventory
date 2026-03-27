import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import PayPalPage from "./pages/vendor/pages/PayPalPage";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Landing />} />
          </Route>

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route path="/dashboard" element={<VendorLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="storekeeper" element={<StorekeeperPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route
              path="reports/:id/download"
              element={<ReportDownloadPage />}
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="subscription" element={<PayPalPage />} />
            <Route path="products/new" element={<NewProductPage />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminAnalyticsPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route
              path="vendors/:id/analytics"
              element={<AdminVendorAnalyticsPage />}
            />
            <Route path="scanners" element={<AdminScannersPage />} />
            <Route path="sales" element={<AdminSalesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
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
