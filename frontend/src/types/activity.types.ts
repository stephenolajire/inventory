// src/types/activity.types.ts

/**
 * Activity types - mirrors backend Activity.ActionType choices
 */
export type ActivityActionType =
  // Generic actions
  | "create"
  | "update"
  | "delete"
  | "view"
  | "restore"
  // User-specific actions
  | "login"
  | "logout"
  | "password_changed"
  | "profile_updated"
  // Product actions
  | "product_uploaded"
  | "product_approved"
  | "product_rejected"
  | "stock_updated"
  // Sales actions
  | "order_created"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "refund_requested"
  | "refund_approved"
  // Subscription actions
  | "subscription_created"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_cancelled"
  | "subscription_renewed"
  // Payment actions
  | "payment_processed"
  | "payment_failed"
  | "payment_refunded"
  // Admin actions
  | "user_approved"
  | "user_rejected"
  | "user_suspended"
  | "user_unsuspended"
  // Analytics
  | "report_generated"
  | "export_created";

/**
 * Activity log entry
 */
export interface Activity {
  id: string;
  user_id: string;
  user_email: string;
  action_type: ActivityActionType;
  action_display: string;
  description: string;
  content_type_name: string | null;
  object_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string ;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

/**
 * Activity list item (paginated response)
 */
export interface ActivityListItem {
  id: string;
  user_id: string;
  user_email: string;
  action_type: ActivityActionType;
  action_display: string;
  description: string;
  content_type_name: string | null;
  object_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Activity detail (with all information)
 */
export interface ActivityDetail extends Activity {
  content_type_id: number | null;
}

/**
 * Activity statistics
 */
export interface ActivityStatistics {
  total_activities: number;
  activities_last_7_days: number;
  top_action_types: Array<{
    action_type: ActivityActionType;
    count: number;
  }>;
  top_users: Array<{
    user__email: string;
    count: number;
  }>;
}

/**
 * Available action type option
 */
export interface ActionTypeOption {
  value: ActivityActionType;
  display: string;
}

/**
 * Filters for activity list
 */
export interface ActivityFilters {
  user?: string;
  action_type?: ActivityActionType;
  content_type?: string;
  created_at?: string;
  search?: string;
  page?: number;
}
