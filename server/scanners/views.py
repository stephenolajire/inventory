# scanners/views.py

import logging

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin
from notifications.models import Notification

from .models import Scanner
from .serializers import (
    ScannerListSerializer,
    ScannerDetailSerializer,
    ScannerRegisterSerializer,
    ScannerRevokeSerializer,
    ScannerVendorSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _notify_vendor(vendor, notification_type, title, message, action_url=""):
    Notification.objects.create(
        recipient         = vendor,
        notification_type = notification_type,
        title             = title,
        message           = message,
        channel           = Notification.Channel.BOTH,
        action_url        = action_url,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Scanner ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class ScannerViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Admin-only viewset for managing the scanner pool.

    GET    /api/scanners/                    — list all scanners
    GET    /api/scanners/{id}/               — scanner detail + full vendor info
    POST   /api/scanners/register/           — register single scanner
    POST   /api/scanners/register/bulk/      — register multiple scanners
    PATCH  /api/scanners/{id}/revoke/        — revoke from vendor
    POST   /api/scanners/{id}/retire/        — retire permanently
    POST   /api/scanners/{id}/reassign/      — reassign to another vendor
    GET    /api/scanners/pool/available/     — list available scanners
    GET    /api/scanners/stats/              — pool statistics
    """

    permission_classes = [IsAdmin]
    serializer_class   = ScannerListSerializer

    def get_queryset(self):
        qs = (
            Scanner.objects
            .select_related("vendor", "registered_by")
            .order_by("serial_number")
        )

        status_filter = self.request.query_params.get("status")
        search        = self.request.query_params.get("search")
        brand         = self.request.query_params.get("brand")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = (
                qs.filter(serial_number__icontains=search)
                | qs.filter(vendor__email__icontains=search)
            )
        if brand:
            qs = qs.filter(brand__icontains=brand)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ScannerDetailSerializer
        if self.action == "register":
            return ScannerRegisterSerializer
        if self.action == "revoke":
            return ScannerRevokeSerializer
        return ScannerListSerializer

    # ── List ──

    @extend_schema(
        summary="List all scanners in the pool (admin only)",
        parameters=[
            OpenApiParameter("status", description="Filter by status",        required=False, type=str),
            OpenApiParameter("search", description="Search serial or vendor",  required=False, type=str),
            OpenApiParameter("brand",  description="Filter by brand",          required=False, type=str),
        ],
        responses={200: ScannerListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ── Retrieve — full scanner + vendor profile + subscription ──

    @extend_schema(
        summary="Get scanner detail with full vendor info (admin only)",
        responses={200: ScannerDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        """
        Overridden to apply deep prefetching before serialization.
        Fetches in a single DB round-trip:
          scanner → vendor → vendor_profile (+ country/state/lga)
                           → subscriptions → plan
          scanner → registered_by
        """
        from django.db.models import Prefetch
        from subscriptions.models import VendorSubscription

        scanner = (
            Scanner.objects
            .select_related(
                "registered_by",
                # vendor core fields
                "vendor",
                # vendor profile + its FK lookups
                "vendor__vendor_profile",
                "vendor__vendor_profile__country",
                "vendor__vendor_profile__state",
                "vendor__vendor_profile__lga",
            )
            .prefetch_related(
                Prefetch(
                    "vendor__subscriptions",
                    queryset=(
                        VendorSubscription.objects
                        .select_related("plan")
                        .exclude(status=VendorSubscription.Status.CANCELLED)
                        .order_by("-created_at")
                    ),
                    to_attr="_active_subscriptions",
                )
            )
            .get(pk=kwargs["pk"])
        )

        serializer = ScannerDetailSerializer(scanner)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Register single ──

    @extend_schema(
        summary="Register a single scanner into the pool",
        request=ScannerRegisterSerializer,
        responses={201: ScannerDetailSerializer},
    )
    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = ScannerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        scanner = serializer.save(
            status        = Scanner.Status.AVAILABLE,
            registered_by = request.user,
        )

        logger.info(
            "ScannerViewSet.register — registered | serial=%s | admin=%s",
            scanner.serial_number,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"Scanner {scanner.serial_number} registered "
                    f"and available for assignment."
                ),
                "data": ScannerDetailSerializer(scanner).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Register bulk ──

    @extend_schema(
        summary="Register multiple scanners in one request",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "scanners": {
                        "type":  "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "serial_number": {"type": "string"},
                                "brand":         {"type": "string"},
                                "model":         {"type": "string"},
                                "notes":         {"type": "string"},
                            },
                            "required": ["serial_number"],
                        },
                    }
                },
            }
        },
        responses={201: {"description": "Bulk registration result."}},
    )
    @action(detail=False, methods=["post"], url_path="register/bulk")
    def register_bulk(self, request):
        scanners_data = request.data.get("scanners", [])

        if not scanners_data:
            return Response(
                {
                    "success": False,
                    "message": "No scanners provided. Send a list under 'scanners'.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(scanners_data) > 100:
            return Response(
                {
                    "success": False,
                    "message": "Maximum 100 scanners per bulk registration.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created  = []
        failed   = []
        existing = []

        for item in scanners_data:
            serial = item.get("serial_number", "").strip().upper()

            if not serial:
                failed.append({"serial_number": serial, "error": "Serial number is required."})
                continue

            if Scanner.objects.filter(serial_number=serial).exists():
                existing.append(serial)
                continue

            try:
                scanner = Scanner.objects.create(
                    serial_number = serial,
                    brand         = item.get("brand", ""),
                    model         = item.get("model", ""),
                    notes         = item.get("notes", ""),
                    status        = Scanner.Status.AVAILABLE,
                    registered_by = request.user,
                )
                created.append(scanner.serial_number)

            except Exception as exc:
                logger.error(
                    "ScannerViewSet.register_bulk — failed | serial=%s | error=%s",
                    serial,
                    str(exc),
                )
                failed.append({"serial_number": serial, "error": str(exc)})

        logger.info(
            "ScannerViewSet.register_bulk — done | created=%d existing=%d failed=%d | admin=%s",
            len(created),
            len(existing),
            len(failed),
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"{len(created)} scanner(s) registered, "
                    f"{len(existing)} already existed, "
                    f"{len(failed)} failed."
                ),
                "data": {
                    "created":  created,
                    "existing": existing,
                    "failed":   failed,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Revoke ──

    @extend_schema(
        summary="Revoke a scanner from its assigned vendor",
        request=ScannerRevokeSerializer,
        responses={200: ScannerDetailSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="revoke")
    def revoke(self, request, pk=None):
        scanner = self.get_object()

        if scanner.status != Scanner.Status.ASSIGNED:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Scanner is not currently assigned. "
                        f"Current status: {scanner.status}."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ScannerRevokeSerializer(
            scanner,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)

        revoke_reason = serializer.validated_data.get("revoke_reason", "")
        vendor        = scanner.vendor

        scanner.status        = Scanner.Status.REVOKED
        scanner.revoked_at    = timezone.now()
        scanner.revoke_reason = revoke_reason
        scanner.vendor        = None
        scanner.save(update_fields=[
            "status", "revoked_at", "revoke_reason", "vendor"
        ])

        logger.info(
            "ScannerViewSet.revoke — revoked | serial=%s | vendor=%s | admin=%s",
            scanner.serial_number,
            vendor.email if vendor else "N/A",
            request.user.email,
        )

        if vendor:
            _notify_vendor(
                vendor            = vendor,
                notification_type = Notification.NotificationType.SYSTEM,
                title             = "Your scanner has been revoked",
                message           = (
                    f"Scanner {scanner.serial_number} has been revoked from your account. "
                    f"{'Reason: ' + revoke_reason if revoke_reason else ''} "
                    f"Please contact support for more information."
                ),
                action_url = "/support",
            )

        return Response(
            {
                "success": True,
                "message": (
                    f"Scanner {scanner.serial_number} revoked "
                    f"from {vendor.email if vendor else 'vendor'}."
                ),
                "data": ScannerDetailSerializer(scanner).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Retire ──

    @extend_schema(
        summary="Retire a scanner permanently",
        request={
            "application/json": {
                "type": "object",
                "properties": {"reason": {"type": "string"}},
            }
        },
        responses={200: ScannerDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="retire")
    def retire(self, request, pk=None):
        scanner = self.get_object()

        if scanner.status == Scanner.Status.RETIRED:
            return Response(
                {"success": False, "message": "Scanner is already retired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if scanner.status == Scanner.Status.ASSIGNED:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Cannot retire an assigned scanner. "
                        "Revoke it from the vendor first."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "").strip()
        vendor = scanner.vendor

        scanner.status        = Scanner.Status.RETIRED
        scanner.revoked_at    = timezone.now()
        scanner.revoke_reason = reason
        scanner.vendor        = None
        scanner.save(update_fields=[
            "status", "revoked_at", "revoke_reason", "vendor"
        ])

        logger.info(
            "ScannerViewSet.retire — retired | serial=%s | admin=%s",
            scanner.serial_number,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Scanner {scanner.serial_number} has been retired.",
                "data": ScannerDetailSerializer(scanner).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Reassign ──

    @extend_schema(
        summary="Reassign a revoked or available scanner to a vendor",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "vendor_id": {"type": "string", "description": "UUID of the target vendor"}
                },
                "required": ["vendor_id"],
            }
        },
        responses={200: ScannerDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="reassign")
    def reassign(self, request, pk=None):
        scanner   = self.get_object()
        vendor_id = request.data.get("vendor_id")

        if not vendor_id:
            return Response(
                {
                    "success": False,
                    "message": "vendor_id is required.",
                    "errors":  {"vendor_id": ["This field is required."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if scanner.status not in [
            Scanner.Status.AVAILABLE,
            Scanner.Status.REVOKED,
        ]:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Cannot reassign a scanner with status '{scanner.status}'. "
                        f"Only available or revoked scanners can be reassigned."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vendor = User.objects.get(
                id   = vendor_id,
                role = "vendor",
            )
        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Vendor not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if Scanner.objects.filter(
            vendor = vendor,
            status = Scanner.Status.ASSIGNED,
        ).exists():
            return Response(
                {
                    "success": False,
                    "message": (
                        f"{vendor.email} already has an assigned scanner. "
                        f"Revoke it before reassigning."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        scanner.vendor        = vendor
        scanner.status        = Scanner.Status.ASSIGNED
        scanner.assigned_at   = timezone.now()
        scanner.revoke_reason = ""
        scanner.save(update_fields=[
            "vendor", "status", "assigned_at", "revoke_reason"
        ])

        logger.info(
            "ScannerViewSet.reassign — reassigned | serial=%s | vendor=%s | admin=%s",
            scanner.serial_number,
            vendor.email,
            request.user.email,
        )

        _notify_vendor(
            vendor            = vendor,
            notification_type = Notification.NotificationType.SYSTEM,
            title             = "Scanner assigned to your account",
            message           = (
                f"Scanner {scanner.serial_number} has been assigned to your account. "
                f"You can start using it at your storekeeper screen."
            ),
            action_url = "/storekeeper",
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"Scanner {scanner.serial_number} reassigned to {vendor.email}."
                ),
                "data": ScannerDetailSerializer(scanner).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Available pool ──

    @extend_schema(
        summary="List all available scanners in the pool",
        responses={200: ScannerListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="pool/available")
    def available_pool(self, request):
        qs = (
            Scanner.objects
            .filter(status=Scanner.Status.AVAILABLE)
            .order_by("created_at")
        )

        serializer = ScannerListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Pool stats ──

    @extend_schema(
        summary="Get scanner pool statistics",
        responses={200: {"description": "Pool statistics."}},
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total     = Scanner.objects.count()
        available = Scanner.objects.filter(status=Scanner.Status.AVAILABLE).count()
        assigned  = Scanner.objects.filter(status=Scanner.Status.ASSIGNED).count()
        revoked   = Scanner.objects.filter(status=Scanner.Status.REVOKED).count()
        retired   = Scanner.objects.filter(status=Scanner.Status.RETIRED).count()

        return Response(
            {
                "success": True,
                "data": {
                    "total":     total,
                    "available": available,
                    "assigned":  assigned,
                    "revoked":   revoked,
                    "retired":   retired,
                },
            },
            status=status.HTTP_200_OK,
        )