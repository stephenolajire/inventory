// src/components/layout/VendorLayout.tsx

import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useLogout } from "../../hooks/auth/useAuth";
import VendorSidebar from "./VendorSidebar";

export default function VendorLayout() {
  const navigate = useNavigate();
  const isApproved = useAuthStore((s) => s.isApproved());
  const isVendor = useAuthStore((s) => s.isVendor());
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const logout = useLogout();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isHydrated) return;
    if (!isVendor) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isApproved) {
      navigate("/pending", { replace: true });
    }
  }, [isHydrated, isVendor, isApproved, navigate]);

  if (!isHydrated) return null;

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <VendorSidebar onLogout={() => logout.mutate()} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
