# reports/views.py

import logging

from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from notifications.models import Notification
from subscriptions.models import VendorSubscription
from activities.utils import log_activity
from activities.models import Activity
from django.http import FileResponse
import os
from django.conf import settings

from .models import Report
from .serializers import (
    ReportListSerializer,
    ReportDetailSerializer,
    GenerateReportSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Guard: check vendor has reports access
# ─────────────────────────────────────────────────────────────────────────────

def _has_reports_access(vendor) -> bool:
    """
    Returns True if the vendor's active plan includes PDF reports.
    Only Pro and Enterprise plans have reports access.
    """
    subscription = (
        VendorSubscription.objects
        .select_related("plan")
        .filter(
            vendor = vendor,
            status = VendorSubscription.Status.ACTIVE,
        )
        .first()
    )
    if not subscription:
        return False
    return subscription.plan.has_reports


def _reports_forbidden():
    return Response(
        {
            "success": False,
            "message": (
                "PDF reports are not available on your current plan. "
                "Upgrade to Pro or Enterprise to generate reports."
            ),
            "code": "reports_not_available",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Reports ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class ReportViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Vendor PDF report management.

    GET   /api/reports/                  — list all past reports
    GET   /api/reports/{id}/             — single report detail
    POST  /api/reports/generate/         — generate a new report on demand
    GET   /api/reports/{id}/download/    — get the download URL
    DELETE /api/reports/{id}/            — delete a report record
    POST  /api/reports/generate/weekly/  — shortcut: generate this week's report
    POST  /api/reports/generate/monthly/ — shortcut: generate this month's report
    """

    permission_classes = [IsApprovedVendor]
    serializer_class   = ReportListSerializer

    def get_queryset(self):
        return (
            Report.objects
            .filter(vendor=self.request.user)
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ReportDetailSerializer
        if self.action == "generate":
            return GenerateReportSerializer
        return ReportListSerializer

    # ── List ──

    @extend_schema(
        summary="List all past reports",
        parameters=[
            OpenApiParameter(
                "report_type",
                description="Filter by type: weekly or monthly",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                "status",
                description="Filter by status: pending, generating, ready, failed",
                required=False,
                type=str,
            ),
        ],
        responses={200: ReportListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        qs = self.get_queryset()

        report_type   = request.query_params.get("report_type")
        status_filter = request.query_params.get("status")

        if report_type:
            qs = qs.filter(report_type=report_type)
        if status_filter:
            qs = qs.filter(status=status_filter)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReportListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ReportListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Retrieve ──

    @extend_schema(
        summary="Get report detail",
        responses={200: ReportDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        report     = self.get_object()
        serializer = ReportDetailSerializer(report)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Generate on demand ──

    @extend_schema(
        summary="Generate a new PDF report on demand",
        request=GenerateReportSerializer,
        responses={201: ReportDetailSerializer},
    )
    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report_type  = serializer.validated_data["report_type"]
        period_start = serializer.validated_data["period_start"]
        period_end   = serializer.validated_data["period_end"]

        # ── Check if a report already exists for this period ──
        existing = Report.objects.filter(
            vendor       = request.user,
            report_type  = report_type,
            period_start = period_start,
        ).first()

        if existing:
            if existing.status == Report.Status.READY:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "A report already exists for this period. "
                            "Download it or delete it before generating a new one."
                        ),
                        "data": ReportDetailSerializer(existing).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            if existing.status in [
                Report.Status.PENDING,
                Report.Status.GENERATING,
            ]:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "A report for this period is already being generated. "
                            "Please wait for it to complete."
                        ),
                        "data": ReportDetailSerializer(existing).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            # ── Failed report — allow regeneration ──
            existing.status       = Report.Status.PENDING
            existing.error_detail = ""
            existing.file_url     = ""
            existing.file_size_kb = 0
            existing.generated_at = None
            existing.save(update_fields=[
                "status", "error_detail",
                "file_url", "file_size_kb", "generated_at",
            ])
            report = existing

        else:
            report = Report.objects.create(
                vendor       = request.user,
                report_type  = report_type,
                period_start = period_start,
                period_end   = period_end,
                status       = Report.Status.PENDING,
            )

        # ── Queue Celery task AFTER record is created ──
        from reports.tasks import generate_report
        generate_report.delay(str(report.id))

        logger.info(
            "ReportViewSet.generate — queued | report=%s | vendor=%s",
            report.id,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.REPORT_GENERATED,
            description=f"Generated {report.get_report_type_display()} report",
            content_object=report,
            metadata={
                "report_type": report.report_type,
                "period_start": report.period_start.isoformat(),
                "period_end": report.period_end.isoformat(),
                "status": report.status,
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Report generation started. "
                    "You will be notified when it is ready."
                ),
                "data": ReportDetailSerializer(report).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Weekly shortcut ──

    @extend_schema(
        summary="Generate a report for the current week",
        responses={201: ReportDetailSerializer},
    )
    @action(detail=False, methods=["post"], url_path="generate/weekly")
    def generate_weekly(self, request):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        today      = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())
        week_end   = week_start + timezone.timedelta(days=6)

        return self._queue_report(
            request     = request,
            report_type = Report.ReportType.WEEKLY,
            period_start = week_start,
            period_end   = week_end,
        )

    # ── Monthly shortcut ──

    @extend_schema(
        summary="Generate a report for the current month",
        responses={201: ReportDetailSerializer},
    )
    @action(detail=False, methods=["post"], url_path="generate/monthly")
    def generate_monthly(self, request):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        today        = timezone.now().date()
        month_start  = today.replace(day=1)
        # Last day of the month
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1)
        month_end = month_end - timezone.timedelta(days=1)

        return self._queue_report(
            request      = request,
            report_type  = Report.ReportType.MONTHLY,
            period_start = month_start,
            period_end   = month_end,
        )

    # ── Download URL ──

    @extend_schema(
        summary="Get the download URL for a ready report",
        responses={200: {"description": "Download URL."}},
    )

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        report = self.get_object()

        if report.status != Report.Status.READY:
            return Response(
                {"success": False, "message": f"Report not ready. Status: {report.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not report.file_url:
            return Response(
                {"success": False, "message": "Report file not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # file_url is stored as /media/reports/{vendor_id}/{filename}.pdf
        abs_path = os.path.join(settings.BASE_DIR, report.file_url.lstrip("/"))

        if not os.path.exists(abs_path):
            return Response(
                {"success": False, "message": "File not found on disk."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = os.path.basename(abs_path)

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.UPDATE,
            description=f"Downloaded {report.get_report_type_display()} report",
            content_object=report,
            metadata={
                "report_type": report.report_type,
                "period_start": report.period_start.isoformat(),
                "file_size_kb": report.file_size_kb,
            },
            request=request,
        )

        return FileResponse(
            open(abs_path, "rb"),
            content_type="application/pdf",
            as_attachment=True,
            filename=f"stocksense-{report.report_type}-{report.period_start}.pdf",
        )

    # ── Delete report ──

    @extend_schema(summary="Delete a report record")
    def destroy(self, request, pk=None):
        if not _has_reports_access(request.user):
            return _reports_forbidden()

        report = self.get_object()

        if report.status in [Report.Status.PENDING, Report.Status.GENERATING]:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Cannot delete a report that is currently being generated."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        report_type  = report.get_report_type_display()
        period_start = report.period_start
        report.delete()

        logger.info(
            "ReportViewSet.destroy — deleted | type=%s | period=%s | vendor=%s",
            report_type,
            period_start,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.DELETE,
            description=f"Deleted {report_type} report",
            metadata={
                "report_type": report.report_type,
                "period_start": str(period_start),
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": f"{report_type} report deleted.",
            },
            status=status.HTTP_200_OK,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _queue_report(self, request, report_type, period_start, period_end):
        """
        Shared logic for weekly and monthly shortcut endpoints.
        Creates or reuses a Report record and queues the Celery task.
        """
        existing = Report.objects.filter(
            vendor       = request.user,
            report_type  = report_type,
            period_start = period_start,
        ).first()

        if existing:
            if existing.status == Report.Status.READY:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Report already exists for this period. "
                            "Download it or delete it first."
                        ),
                        "data": ReportDetailSerializer(existing).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            if existing.status in [
                Report.Status.PENDING,
                Report.Status.GENERATING,
            ]:
                return Response(
                    {
                        "success": False,
                        "message": "Report is already being generated.",
                        "data":    ReportDetailSerializer(existing).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            # Failed — reset and retry
            existing.status       = Report.Status.PENDING
            existing.error_detail = ""
            existing.file_url     = ""
            existing.file_size_kb = 0
            existing.generated_at = None
            existing.save(update_fields=[
                "status", "error_detail",
                "file_url", "file_size_kb", "generated_at",
            ])
            report = existing
        else:
            report = Report.objects.create(
                vendor       = request.user,
                report_type  = report_type,
                period_start = period_start,
                period_end   = period_end,
                status       = Report.Status.PENDING,
            )

        from reports.tasks import generate_report
        generate_report.delay(str(report.id))

        return Response(
            {
                "success": True,
                "message": (
                    "Report generation started. "
                    "You will be notified when it is ready."
                ),
                "data": ReportDetailSerializer(report).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Reports ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminReportViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Admin view of all reports across the platform.

    GET  /api/reports/admin/                     — list all reports
    GET  /api/reports/admin/{id}/                — report detail
    POST /api/reports/admin/generate/{vendor_id}/ — generate for a specific vendor
    GET  /api/reports/admin/failed/              — list failed reports
    """

    permission_classes = [IsAdmin]
    serializer_class   = ReportListSerializer

    def get_queryset(self):
        qs = (
            Report.objects
            .select_related("vendor")
            .order_by("-created_at")
        )

        vendor      = self.request.query_params.get("vendor")
        report_type = self.request.query_params.get("report_type")
        rep_status  = self.request.query_params.get("status")

        if vendor:
            qs = qs.filter(vendor__id=vendor)
        if report_type:
            qs = qs.filter(report_type=report_type)
        if rep_status:
            qs = qs.filter(status=rep_status)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ReportDetailSerializer
        return ReportListSerializer

    # ── List ──

    @extend_schema(
        summary="List all reports across platform (admin only)",
        parameters=[
            OpenApiParameter("vendor",      description="Filter by vendor ID",   required=False, type=str),
            OpenApiParameter("report_type", description="Filter by type",        required=False, type=str),
            OpenApiParameter("status",      description="Filter by status",      required=False, type=str),
        ],
        responses={200: ReportListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ── Retrieve ──

    @extend_schema(
        summary="Get report detail (admin only)",
        responses={200: ReportDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ── Generate for a specific vendor ──

    @extend_schema(
        summary="Generate a report for a specific vendor (admin only)",
        request=GenerateReportSerializer,
        responses={201: ReportDetailSerializer},
    )
    @action(
        detail   = False,
        methods  = ["post"],
        url_path = "generate/(?P<vendor_id>[^/.]+)",
    )
    def generate_for_vendor(self, request, vendor_id=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            vendor = User.objects.get(id=vendor_id, role="vendor")
        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "Vendor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = Report.objects.create(
            vendor       = vendor,
            report_type  = serializer.validated_data["report_type"],
            period_start = serializer.validated_data["period_start"],
            period_end   = serializer.validated_data["period_end"],
            status       = Report.Status.PENDING,
        )

        from reports.tasks import generate_report
        generate_report.delay(str(report.id))

        logger.info(
            "AdminReportViewSet.generate_for_vendor — queued | "
            "report=%s | vendor=%s | admin=%s",
            report.id,
            vendor.email,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.REPORT_GENERATED,
            description=f"Generated {report.get_report_type_display()} report for {vendor.email}",
            content_object=report,
            metadata={
                "report_type": report.report_type,
                "period_start": report.period_start.isoformat(),
                "period_end": report.period_end.isoformat(),
                "generated_for_vendor": vendor.email,
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": f"Report generation started for {vendor.email}.",
                "data":    ReportDetailSerializer(report).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Failed reports ──

    @extend_schema(
        summary="List all failed reports (admin only)",
        responses={200: ReportListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="failed")
    def failed(self, request):
        qs = (
            Report.objects
            .select_related("vendor")
            .filter(status=Report.Status.FAILED)
            .order_by("-created_at")
        )

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReportListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ReportListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )