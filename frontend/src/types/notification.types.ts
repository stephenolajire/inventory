// src/types/notification.types.ts

export type NotificationType =
  | "account_approved"
  | "account_rejected"
  | "account_suspended"
  | "subscription_activated"
  | "subscription_renewal"
  | "subscription_expired"
  | "subscription_cancelled"
  | "plan_upgraded"
  | "plan_downgrade_scheduled"
  | "product_ready"
  | "product_failed"
  | "low_stock"
  | "daily_summary"
  | "new_vendor"
  | "system";

export type NotificationChannel = "in_app" | "email" | "both";

export interface NotificationListItem {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export interface NotificationDetail extends NotificationListItem {
  channel: NotificationChannel;
  read_at: string | null;
  related_object_type: string;
  related_object_id: string | null;
}

export interface UnreadCount {
  unread_count: number;
}

export interface NotificationPreferences {
  total_unread: number;
  total_all: number;
  by_type: {
    type: NotificationType;
    count: number;
  }[];
}

export interface AdminBroadcastRequest {
  title: string;
  message: string;
  channel: NotificationChannel;
  vendor_id?: string;
  action_url?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  is_read?: boolean;
  page?: number;
}

export interface NotificationStats {
  total: number;
  total_unread: number;
  total_read: number;
  email_sent: number;
  email_pending: number;
  by_type: {
    type: NotificationType;
    count: number;
  }[];
  by_channel: {
    channel: NotificationChannel;
    count: number;
  }[];
}
