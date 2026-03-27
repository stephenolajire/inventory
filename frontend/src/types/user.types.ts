// src/types/user.types.ts

import type{ UserRole, UserStatus } from "./auth.types";
import type { VendorProfile } from "./vendor.types";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  created_at: string;
}

export interface UserDetail extends User {
  vendor_profile?: VendorProfile;
}

export interface AdminUserStatusUpdate {
  status: UserStatus;
}
