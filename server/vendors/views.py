# vendors/views.py

import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from notifications.models import Notification
from scanners.models import Scanner
from subscriptions.models import VendorSubscription

from .models import VendorProfile
from .serializers import (
    VendorListSerializer,
    VendorDetailSerializer,
    VendorProfileUpdateSerializer,
    BusinessLogoUploadSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _create_notification(vendor, notification_type, title, message, action_url=""):
    Notification.objects.create(
        recipient         = vendor,
        notification_type = notification_type,
        title             = title,
        message           = message,
        channel           = Notification.Channel.BOTH,
        action_url        = action_url,
    )


def _assign_scanner(vendor):
    """
    Finds the oldest available scanner in the pool and assigns
    it to the vendor. Returns the scanner or None if pool is empty.
    Caller is responsible for wrapping in transaction.atomic().
    """
    scanner = (
        Scanner.objects
        .select_for_update()          # row-level lock to prevent race conditions
        .filter(status=Scanner.Status.AVAILABLE)
        .order_by("created_at")       # oldest registered first
        .first()
    )
    if not scanner:
        return None

    scanner.vendor      = vendor
    scanner.status      = Scanner.Status.ASSIGNED
    scanner.assigned_at = timezone.now()
    scanner.save(update_fields=["vendor", "status", "assigned_at"])

    return scanner


# ─────────────────────────────────────────────────────────────────────────────
# Vendor Profile ViewSet — vendor manages their own profile
# ─────────────────────────────────────────────────────────────────────────────

class VendorProfileViewSet(GenericViewSet):
    """
    GET   /api/vendors/profile/         — get own profile
    PATCH /api/vendors/profile/         — update own profile
    PATCH /api/vendors/profile/logo/    — upload business logo
    GET   /api/vendors/profile/scanner/ — get assigned scanner
    GET   /api/vendors/profile/subscription/ — get active subscription
    """

    parser_classes     = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VendorProfile.objects.select_related(
            "user", "country", "state", "lga"
        ).filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "update_profile":
            return VendorProfileUpdateSerializer
        if self.action == "upload_logo":
            return BusinessLogoUploadSerializer
        return VendorDetailSerializer

    # ── Get own profile ──

    @extend_schema(
        summary="Get the authenticated vendor's profile",
        responses={200: VendorDetailSerializer},
    )
    @action(detail=False, methods=["get"], url_path="profile")
    def get_profile(self, request):
        profile, created = VendorProfile.objects.select_related(
            "user", "country", "state", "lga"
        ).get_or_create(user=request.user)

        serializer = VendorDetailSerializer(profile)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Update own profile ──

    @extend_schema(
        summary="Update the authenticated vendor's profile",
        request=VendorProfileUpdateSerializer,
        responses={200: VendorDetailSerializer},
    )
    @action(detail=False, methods=["patch"], url_path="profile/update")
    def update_profile(self, request):
        profile = VendorProfile.objects.select_related(
            "user", "country", "state", "lga"
        ).get_or_create(user=request.user)[0]

        serializer = VendorProfileUpdateSerializer(
            profile,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        logger.info(
            "VendorProfileViewSet.update_profile — updated | vendor=%s",
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data":    VendorDetailSerializer(profile).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Upload logo ──

    @extend_schema(
        summary="Upload or update business logo",
        request=BusinessLogoUploadSerializer,
        responses={200: VendorDetailSerializer},
    )
    @action(
        detail         = False,
        methods        = ["patch"],
        url_path       = "profile/logo",
        parser_classes = [MultiPartParser, FormParser],
    )
    def upload_logo(self, request):
        profile = VendorProfile.objects.get_or_create(user=request.user)[0]

        serializer = BusinessLogoUploadSerializer(
            profile,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        logger.info(
            "VendorProfileViewSet.upload_logo — updated | vendor=%s",
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": "Business logo updated.",
                "data":    VendorDetailSerializer(profile).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Get assigned scanner ──

    @extend_schema(
        summary="Get the vendor's assigned scanner",
        responses={200: {"description": "Scanner detail or null."}},
    )
    @action(detail=False, methods=["get"], url_path="profile/scanner")
    def get_scanner(self, request):
        from scanners.serializers import ScannerVendorSerializer

        try:
            scanner    = Scanner.objects.get(vendor=request.user)
            serializer = ScannerVendorSerializer(scanner)
            return Response(
                {"success": True, "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except Scanner.DoesNotExist:
            return Response(
                {
                    "success": True,
                    "data":    None,
                    "message": "No scanner assigned yet.",
                },
                status=status.HTTP_200_OK,
            )

    # ── Get active subscription ──

    @extend_schema(
        summary="Get the vendor's active subscription",
        responses={200: {"description": "Subscription detail."}},
    )
    @action(detail=False, methods=["get"], url_path="profile/subscription")
    def get_subscription(self, request):
        from subscriptions.serializers import ActiveSubscriptionSerializer, PendingPlanChangeSerializer
        from subscriptions.models import PendingPlanChange

        subscription = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(vendor=request.user)
            .order_by("-created_at")
            .first()
        )

        if not subscription:
            return Response(
                {"success": True, "data": None},
                status=status.HTTP_200_OK,
            )

        data = ActiveSubscriptionSerializer(subscription).data

        # Attach pending plan change if one exists
        pending = (
            PendingPlanChange.objects
            .select_related("new_plan")
            .filter(
                vendor        = request.user,
                change_status = PendingPlanChange.ChangeStatus.SCHEDULED,
            )
            .first()
        )
        if pending:
            data["pending_change"] = PendingPlanChangeSerializer(pending).data

        return Response(
            {"success": True, "data": data},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Vendor Management ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminVendorViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    GET   /api/vendors/admin/                        — list all vendors
    GET   /api/vendors/admin/{id}/                   — vendor detail
    POST  /api/vendors/admin/{id}/approve/           — approve vendor
    POST  /api/vendors/admin/{id}/reject/            — reject vendor
    POST  /api/vendors/admin/{id}/suspend/           — suspend vendor
    POST  /api/vendors/admin/{id}/reinstate/         — reinstate vendor
    GET   /api/vendors/admin/pending/                — pending approval list
    """

    permission_classes = [IsAdmin]
    serializer_class   = VendorListSerializer
    lookup_field       = "pk" 

    def get_queryset(self):
        qs = (
            VendorProfile.objects
            .select_related("user", "state", "lga", "country")
            .order_by("-created_at")
        )

        state         = self.request.query_params.get("state")
        lga           = self.request.query_params.get("lga")
        business_type = self.request.query_params.get("business_type")
        account_status = self.request.query_params.get("status")
        search        = self.request.query_params.get("search")

        if state:
            qs = qs.filter(state__id=state)
        if lga:
            qs = qs.filter(lga__id=lga)
        if business_type:
            qs = qs.filter(business_type=business_type)
        if account_status:
            qs = qs.filter(user__status=account_status)
        if search:
            qs = qs.filter(
                business_name__icontains=search
            ) | qs.filter(
                user__email__icontains=search
            )

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return VendorDetailSerializer
        return VendorListSerializer

    # ── List ──

    @extend_schema(
        summary="List all vendors (admin only)",
        parameters=[
            OpenApiParameter("state",         description="Filter by state ID",       required=False, type=str),
            OpenApiParameter("lga",           description="Filter by LGA ID",         required=False, type=str),
            OpenApiParameter("business_type", description="Filter by business type",  required=False, type=str),
            OpenApiParameter("status",        description="Filter by account status", required=False, type=str),
            OpenApiParameter("search",        description="Search by name or email",  required=False, type=str),
        ],
        responses={200: VendorListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # ── Retrieve ──

    @extend_schema(
        summary="Get vendor detail (admin only)",
        responses={200: VendorDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ── Pending approval list ──

    @extend_schema(
        summary="List vendors pending approval",
        responses={200: VendorListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        qs = (
            VendorProfile.objects
            .select_related("user", "state", "lga")
            .filter(user__status=User.Status.PENDING_APPROVAL)
            .order_by("user__created_at")
        )

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = VendorListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = VendorListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Approve ──

    @extend_schema(
        summary="Approve a vendor application",
        responses={200: {"description": "Vendor approved and scanner assigned."}},
    )
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        profile = self.get_object()
        vendor  = profile.user

        # ── Guard: only pending_approval can be approved ──
        if vendor.status != User.Status.PENDING_APPROVAL:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Cannot approve a vendor with status "
                        f"'{vendor.status}'. "
                        f"Only pending_approval vendors can be approved."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        scanner = None

        try:
            with transaction.atomic():

                # ── Assign scanner ──
                scanner = _assign_scanner(vendor)

                if not scanner:
                    logger.warning(
                        "AdminVendorViewSet.approve — no scanners available | vendor=%s",
                        vendor.email,
                    )
                    return Response(
                        {
                            "success": False,
                            "message": (
                                "No scanners available in the pool. "
                                "Please register more scanners before approving."
                            ),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # ── Update user status ──
                vendor.status      = User.Status.APPROVED
                vendor.approved_by = request.user
                vendor.approved_at = timezone.now()
                vendor.save(update_fields=["status", "approved_by", "approved_at"])

                # ── Update subscription to pending_payment ──
                subscription = (
                    VendorSubscription.objects
                    .filter(vendor=vendor)
                    .order_by("-created_at")
                    .first()
                )
                if subscription:
                    subscription.status = VendorSubscription.Status.PENDING_PAYMENT
                    subscription.save(update_fields=["status"])

                logger.info(
                    "AdminVendorViewSet.approve — approved | vendor=%s | "
                    "scanner=%s | admin=%s",
                    vendor.email,
                    scanner.serial_number,
                    request.user.email,
                )

        except Exception as exc:
            logger.exception(
                "AdminVendorViewSet.approve — transaction failed | vendor=%s | error=%s",
                vendor.email,
                str(exc),
            )
            return Response(
                {
                    "success": False,
                    "message": "Approval failed due to a server error. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Notify vendor AFTER commit ──
        _create_notification(
            vendor            = vendor,
            notification_type = Notification.NotificationType.ACCOUNT_APPROVED,
            title             = "Your account has been approved",
            message           = (
                f"Congratulations! Your StockSense account has been approved. "
                f"Your assigned scanner serial number is: {scanner.serial_number}. "
                f"Log in to activate your plan and start selling."
            ),
            action_url = "/login",
        )

        # ── Queue approval email AFTER commit ──
        from vendors.tasks import send_approval_email
        send_approval_email.delay(str(vendor.id), scanner.serial_number)

        return Response(
            {
                "success": True,
                "message": (
                    f"Vendor approved. "
                    f"Scanner {scanner.serial_number} assigned."
                ),
                "data": {
                    "vendor_email":    vendor.email,
                    "scanner_serial":  scanner.serial_number,
                    "vendor_status":   vendor.status,
                },
            },
            status=status.HTTP_200_OK,
        )

    # ── Reject ──

    @extend_schema(
        summary="Reject a vendor application",
        request={"application/json": {"type": "object", "properties": {
            "reason": {"type": "string"}
        }}},
        responses={200: {"description": "Vendor rejected."}},
    )
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        profile = self.get_object()
        vendor  = profile.user

        if vendor.status not in [
            User.Status.PENDING_APPROVAL,
            User.Status.PENDING_VERIFICATION,
        ]:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Cannot reject a vendor with status '{vendor.status}'."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response(
                {
                    "success": False,
                    "message": "A rejection reason is required.",
                    "errors":  {"reason": ["This field is required."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendor.status = User.Status.REJECTED
        vendor.save(update_fields=["status"])

        # Cancel subscription
        VendorSubscription.objects.filter(vendor=vendor).update(
            status = VendorSubscription.Status.CANCELLED
        )

        logger.info(
            "AdminVendorViewSet.reject — rejected | vendor=%s | reason=%s | admin=%s",
            vendor.email,
            reason,
            request.user.email,
        )

        # ── Notify vendor ──
        _create_notification(
            vendor            = vendor,
            notification_type = Notification.NotificationType.ACCOUNT_REJECTED,
            title             = "Your application was not approved",
            message           = (
                f"Unfortunately your StockSense application was not approved. "
                f"Reason: {reason}"
            ),
            action_url = "/support",
        )

        # ── Queue rejection email ──
        from vendors.tasks import send_rejection_email
        send_rejection_email.delay(str(vendor.id), reason)

        return Response(
            {"success": True, "message": "Vendor application rejected."},
            status=status.HTTP_200_OK,
        )

    # ── Suspend ──

    @extend_schema(
        summary="Suspend a vendor account",
        request={"application/json": {"type": "object", "properties": {
            "reason": {"type": "string"}
        }}},
        responses={200: {"description": "Vendor suspended."}},
    )
    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        profile = self.get_object()
        vendor  = profile.user

        if vendor.status == User.Status.SUSPENDED:
            return Response(
                {"success": False, "message": "Vendor is already suspended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "").strip()

        vendor.status = User.Status.SUSPENDED
        vendor.save(update_fields=["status"])

        logger.info(
            "AdminVendorViewSet.suspend — suspended | vendor=%s | admin=%s",
            vendor.email,
            request.user.email,
        )

        _create_notification(
            vendor            = vendor,
            notification_type = Notification.NotificationType.ACCOUNT_SUSPENDED,
            title             = "Your account has been suspended",
            message           = (
                "Your StockSense account has been suspended. "
                f"{'Reason: ' + reason if reason else ''} "
                "Please contact support for more information."
            ),
            action_url = "/support",
        )

        return Response(
            {"success": True, "message": "Vendor account suspended."},
            status=status.HTTP_200_OK,
        )

    # ── Reinstate ──

    @extend_schema(
        summary="Reinstate a suspended vendor",
        responses={200: {"description": "Vendor reinstated."}},
    )
    @action(detail=True, methods=["post"], url_path="reinstate")
    def reinstate(self, request, pk=None):
        profile = self.get_object()
        vendor  = profile.user

        if vendor.status != User.Status.SUSPENDED:
            return Response(
                {
                    "success": False,
                    "message": "Only suspended vendors can be reinstated.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendor.status = User.Status.APPROVED
        vendor.save(update_fields=["status"])

        logger.info(
            "AdminVendorViewSet.reinstate — reinstated | vendor=%s | admin=%s",
            vendor.email,
            request.user.email,
        )

        _create_notification(
            vendor            = vendor,
            notification_type = Notification.NotificationType.ACCOUNT_APPROVED,
            title             = "Your account has been reinstated",
            message           = (
                "Your StockSense account has been reinstated. "
                "You can now log in and continue selling."
            ),
            action_url = "/dashboard",
        )

        return Response(
            {"success": True, "message": "Vendor account reinstated."},
            status=status.HTTP_200_OK,
        )

  
    @extend_schema(
        summary="Get full analytics for a vendor (admin only)",
        responses={200: {"description": "Comprehensive vendor analytics."}},
    )
    @action(detail=True, methods=["get"], url_path="analytics")
    def analytics(self, request, pk=None):
        from django.db.models import (
            Sum, Count, Avg, Max, Min, Q, F
        )
        from django.db.models.functions import TruncMonth
        from sales.models import Sale
        from products.models import Product

        profile = self.get_object()
        vendor  = profile.user

        # ── Account info ──
        account_info = {
            "email":        vendor.email,
            "status":       vendor.status,
            "role":         vendor.role,
            "joined_at":    vendor.created_at,
            "approved_at":  vendor.approved_at,
            "approved_by":  vendor.approved_by.email if vendor.approved_by else None,
            "email_verified":    vendor.email_verified,
            "email_verified_at": vendor.email_verified_at,
            "business_name":     profile.business_name,
            "business_type":     getattr(profile, "business_type", None),
            "phone":             getattr(profile, "phone", None),
            "address":           getattr(profile, "address", None),
            "state":             profile.state.name  if profile.state   else None,
            "lga":               profile.lga.name    if profile.lga     else None,
            "country":           profile.country.name if profile.country else None,
        }

        # ── Product stats ──
        product_qs = Product.objects.filter(vendor=vendor)

        product_stats = product_qs.aggregate(
            total_products         = Count("id"),
            active_products        = Count("id", filter=Q(is_active=True)),
            inactive_products      = Count("id", filter=Q(is_active=False)),
            low_stock_count        = Count(
                "id",
                filter=Q(
                    quantity_in_stock__lte=F("low_stock_threshold"),
                    is_active=True,
                ),
            ),
            out_of_stock_count     = Count(
                "id",
                filter=Q(quantity_in_stock=0, is_active=True),
            ),
            total_stock_value      = Sum(
                F("cost_price") * F("quantity_in_stock"),
                filter=Q(cost_price__isnull=False),
            ),
            avg_selling_price      = Avg("selling_price"),
            most_expensive_price   = Max("selling_price"),
            cheapest_price         = Min("selling_price"),
            total_units_sold       = Sum("total_sold"),
            discounted_products    = Count(
                "id",
                filter=Q(
                    discount_price__isnull=False,
                    discount_expires_at__isnull=False,
                ),
            ),
        )

        # Top 5 best-selling products
        top_products = list(
            product_qs
            .filter(is_active=True)
            .order_by("-total_sold")
            .values("name", "total_sold", "selling_price", "quantity_in_stock")[:5]
        )

        # Products by category breakdown
        category_breakdown = list(
            product_qs
            .values(category_name=F("category__name"))
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # ── Sales / Revenue stats ──
        sale_qs = Sale.objects.filter(vendor=vendor)

        revenue_stats = sale_qs.aggregate(
            total_revenue      = Sum("line_total"),
            total_transactions = Count("cart", distinct=True),   # each cart = one receipt
            total_items_sold   = Count("id"),
            avg_order_value    = Avg(
                # average per cart — use subquery-safe approach
                "line_total"
            ),
            total_tax_collected = Sum("tax_amount"),
            first_sale_at       = Min("sold_at"),
            last_sale_at        = Max("sold_at"),
        )

        # Payment method breakdown
        payment_breakdown = list(
            sale_qs
            .values("payment_method")
            .annotate(
                count   = Count("id"),
                revenue = Sum("line_total"),
            )
            .order_by("-revenue")
        )

        twelve_months_ago = timezone.now() - relativedelta(months=12)

        monthly_revenue = list(
            sale_qs
            .filter(sold_at__gte=twelve_months_ago)
            .annotate(month=TruncMonth("sold_at"))
            .values("month")
            .annotate(
                revenue        = Sum("line_total"),
                transactions   = Count("cart", distinct=True),
                items_sold     = Count("id"),
            )
            .order_by("month")
        )

        # Top 5 best-selling products by revenue
        top_products_by_revenue = list(
            sale_qs
            .values("product_name")
            .annotate(
                revenue      = Sum("line_total"),
                units_sold   = Sum("quantity"),
                transactions = Count("id"),
            )
            .order_by("-revenue")[:5]
        )

        # ── Scanner info ──
        from scanners.models import Scanner
        try:
            scanner = Scanner.objects.get(vendor=vendor)
            scanner_data = {
                "serial_number": scanner.serial_number,
                "status":        scanner.status,
                "assigned_at":   scanner.assigned_at,
            }
        except Scanner.DoesNotExist:
            scanner_data = None

        # ── Subscription info ──
        subscription = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(vendor=vendor)
            .order_by("-created_at")
            .first()
        )

        subscription_data = None
        if subscription:
            subscription_data = {
                "plan":                  subscription.plan.name,
                "billing_cycle":         subscription.billing_cycle,
                "status":                subscription.status,
                "amount_paid":           subscription.amount_paid,
                "currency":              subscription.currency,
                "current_period_start":  subscription.current_period_start,
                "current_period_end":    subscription.current_period_end,
            }

        # ── Assemble response ──
        return Response(
            {
                "success": True,
                "data": {
                    "account":             account_info,
                    "subscription":        subscription_data,
                    "scanner":             scanner_data,
                    "products":            {**product_stats, "top_by_units": top_products, "by_category": category_breakdown},
                    "revenue":             {**revenue_stats, "by_payment_method": payment_breakdown, "top_by_revenue": top_products_by_revenue},
                    "monthly_breakdown":   monthly_revenue,
                },
            },
            status=status.HTTP_200_OK,
        )
