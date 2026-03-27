// src/components/layout/AdminLayout.tsx

import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useAdminAnalyticsSummary } from "../../hooks/admin/useAdminAnalytics";
import { ROUTES } from "../../constants/routes";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.clearAuth);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  // ── Must be called before any early return (Rules of Hooks) ──
  const summary = useAdminAnalyticsSummary({ enabled: !!user && isAdmin });
  const pendingCount = summary.data?.data?.pending_vendors ?? 0;

  if (!user || !isAdmin) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      <AdminSidebar onLogout={logout} pendingCount={pendingCount} />

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
