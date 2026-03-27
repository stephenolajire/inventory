// src/types/report.types.ts

export type ReportType = "weekly" | "monthly";
export type ReportStatus = "pending" | "generating" | "ready" | "failed";

export interface ReportListItem {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  file_url: string;
  file_size_kb: number;
  generated_at: string | null;
}

export interface ReportDetail extends ReportListItem {
  error_detail: string;
  created_at: string;
}

export interface GenerateReportRequest {
  report_type: ReportType;
  period_start: string;
  period_end: string;
}

export interface ReportDownloadResponse {
  success: boolean;
  download_url: string;
  file_size_kb: number;
  generated_at: string | null;
}

export interface ReportFilters {
  report_type?: ReportType;
  status?: ReportStatus;
  page?: number;
  [key: string]: unknown; // ← allows cleanParams and query param spreading
}
