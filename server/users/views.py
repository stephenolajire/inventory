# apps/users/views.py

from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from subscriptions.models import SubscriptionPlan, VendorSubscription
from vendors.models import VendorProfile
from verification.models import EmailVerificationToken
from notifications.models import Notification

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    MeSerializer,
    UserListSerializer,
    UserDetailSerializer,
    ChangePasswordSerializer,
    AdminUserStatusSerializer,
)

import hashlib
import secrets
from django.db import transaction
logger = logging.getLogger(__name__)

User = get_user_model()


def _issue_tokens(user):
    """
    Generate a JWT refresh/access token pair for the given user.
    Returns a dict ready to be merged into a response payload.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "access":  str(refresh.access_token),
        "refresh": str(refresh),
    }


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Registration
# ─────────────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new vendor account and queues the email verification task.

    Flow:
      1. Validate form data (email uniqueness, password strength, plan).
      2. Open atomic transaction:
           a. Create User with status = pending_verification.
           b. Create VendorProfile linked to the User.
           c. Record plan selection as VendorSubscription with
              status = pending_approval (no payment yet).
           d. Generate email verification token and persist the hash.
      3. Commit transaction — all four writes succeed or none do.
      4. Queue Celery task AFTER commit so the task only fires if
         the transaction actually committed. Celery dispatch is
         intentionally outside the atomic block.
      5. Return 201 — browser does not wait for the email to send.
    """

    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    @extend_schema(
        summary="Register a new vendor account",
        request=RegisterSerializer,
        responses={
            201: {"description": "Account created. Verification email sent."},
            400: {"description": "Validation error."},
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan_name     = serializer.validated_data.pop("plan",          None)
        billing_cycle = serializer.validated_data.pop("billing_cycle", None)

        # ── All DB writes inside one atomic block ──
        # raw_token is generated before the block so it is available
        # for Celery dispatch after the transaction commits.
        raw_token  = secrets.token_urlsafe(48)
        token_hash = _hash_token(raw_token)
        user       = None

        try:
            with transaction.atomic():

                # 1. Create User
                user = serializer.save()

                # 2. Create VendorProfile
                VendorProfile.objects.create(user=user)

                # 3. Record plan selection — no payment at this stage
                try:
                    plan = SubscriptionPlan.objects.get(
                        name      = plan_name,
                        is_active = True,
                    )
                except SubscriptionPlan.DoesNotExist:
                    # Graceful fallback: default to Free if the submitted
                    # plan name is invalid (should not happen if the frontend
                    # is pulling plans from /api/subscriptions/plans/).
                    plan = SubscriptionPlan.objects.filter(
                        name      = SubscriptionPlan.Name.FREE,
                        is_active = True,
                    ).first()

                VendorSubscription.objects.create(
                    vendor        = user,
                    plan          = plan,
                    billing_cycle = billing_cycle,
                    status        = VendorSubscription.Status.PENDING_APPROVAL,
                )

                # 4. Store the hashed verification token
                EmailVerificationToken.objects.create(
                    user       = user,
                    token_hash = token_hash,
                )

                logger.info(
                    "RegisterView — transaction committed | user=%s | plan=%s",
                    user.email,
                    plan.name,
                )

        except Exception as exc:
            # The atomic block already rolled back everything.
            # Log the failure and return a clean 500 to the client.
            logger.exception(
                "RegisterView — transaction rolled back | error=%s", str(exc)
            )
            return Response(
                {
                    "success": False,
                    "message": (
                        "Registration failed due to a server error. "
                        "Please try again."
                    ),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Queue Celery task AFTER successful commit ──
        # At this point the user, profile, subscription and token
        # are all guaranteed to be in the database.
        from verification.tasks import send_verification_email
        send_verification_email.delay(str(user.id), raw_token)

        logger.info(
            "RegisterView — verification email queued | user=%s",
            user.email,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Account created. Please check your email and click "
                    "the verification link to continue."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticates a vendor or admin and returns a JWT token pair.

    Guards:
      - Email must be verified before login is permitted.
      - Account status is checked — pending / rejected / suspended
        each receive a specific, informative error message.
      - JWT tokens are only issued for status = approved.
      - On first login after approval, subscription status is checked.
        If pending_payment, the response includes a redirect_to hint
        so the frontend can send the vendor to the payment page.
    """

    permission_classes = [AllowAny]
    serializer_class   = LoginSerializer

    @extend_schema(
        summary="Login and obtain JWT tokens",
        request=LoginSerializer,
        responses={200: {"description": "Authenticated. Returns access + refresh tokens."}},
    )
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # ── Email verification guard ──
        if not user.email_verified:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Please verify your email before logging in. "
                        "Check your inbox or request a new verification link."
                    ),
                    "code": "email_not_verified",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Account status guard ──
        status_map = {
            User.Status.PENDING_VERIFICATION: (
                "Your email is not yet verified.",
                "email_not_verified",
            ),
            User.Status.PENDING_APPROVAL: (
                "Your account is under review. We will notify you by email when approved.",
                "pending_approval",
            ),
            User.Status.REJECTED: (
                "Your application was not approved. Please contact support.",
                "account_rejected",
            ),
            User.Status.SUSPENDED: (
                "Your account has been suspended. Please contact support.",
                "account_suspended",
            ),
        }

        if user.status in status_map:
            message, code = status_map[user.status]
            return Response(
                {"success": False, "message": message, "code": code},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Stamp last login ──
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # ── Issue tokens ──
        tokens = _issue_tokens(user)

        # ── Check subscription state for vendors ──
        redirect_to = None
        if user.is_vendor:
            subscription = (
                VendorSubscription.objects
                .filter(vendor=user)
                .order_by("-created_at")
                .first()
            )
            if subscription and subscription.status == VendorSubscription.Status.PENDING_PAYMENT:
                if subscription.plan.name == SubscriptionPlan.Name.FREE:
                    # Activate free plan directly — no payment needed
                    subscription.status               = VendorSubscription.Status.ACTIVE
                    subscription.current_period_start = timezone.now()
                    subscription.current_period_end   = timezone.now() + timezone.timedelta(days=3650)
                    subscription.save(update_fields=[
                        "status", "current_period_start", "current_period_end"
                    ])
                else:
                    redirect_to = "/subscription/activate"

        payload = {
            "success": True,
            "message": "Login successful.",
            "user":    MeSerializer(user).data,
            **tokens,
        }
        if redirect_to:
            payload["redirect_to"] = redirect_to

        return Response(payload, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklists the provided refresh token, effectively logging the user out.
    The access token will expire naturally (15 min TTL).
    The client must also discard both tokens from local storage.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Logout and blacklist refresh token",
        request={"application/json": {"type": "object", "properties": {
            "refresh": {"type": "string"}
        }}},
        responses={200: {"description": "Logged out successfully."}},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"success": False, "message": "Token is invalid or already expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Token Refresh
# ─────────────────────────────────────────────────────────────────────────────

class TokenRefreshView(APIView):
    """
    POST /api/auth/token/refresh/

    Issues a new access token using a valid refresh token.
    Because ROTATE_REFRESH_TOKENS = True in settings, a new
    refresh token is also returned and the old one is blacklisted.
    The client must replace both tokens on every refresh.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Refresh JWT access token",
        request={"application/json": {"type": "object", "properties": {
            "refresh": {"type": "string"}
        }}},
        responses={200: {"description": "New access + refresh token pair."}},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            old_token  = RefreshToken(refresh_token)
            new_access = str(old_token.access_token)

            # ROTATE_REFRESH_TOKENS is True — generate new refresh token
            old_token.blacklist()
            new_refresh_obj = RefreshToken.for_user(
                User.objects.get(id=old_token["user_id"])
            )

        except (TokenError, User.DoesNotExist):
            return Response(
                {"success": False, "message": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "success": True,
                "access":  new_access,
                "refresh": str(new_refresh_obj),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Current User
# ─────────────────────────────────────────────────────────────────────────────

class MeView(APIView):
    """
    GET  /api/auth/me/   — Returns the authenticated user's profile.
    PATCH /api/auth/me/  — Not handled here. Profile updates go through
                           /api/vendors/profile/ (vendors) or
                           /api/admin/profile/ (admins).
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = MeSerializer

    @extend_schema(
        summary="Get the currently authenticated user",
        responses={200: MeSerializer},
    )
    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Change Password
# ─────────────────────────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/

    Authenticated users change their own password.
    Requires the current password to be provided correctly.
    After a successful change, all existing refresh tokens are
    blacklisted by rotating — the client must re-login.
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = ChangePasswordSerializer

    @extend_schema(
        summary="Change password for the authenticated user",
        request=ChangePasswordSerializer,
        responses={200: {"description": "Password changed. Please log in again."}},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {
                    "success": False,
                    "message": "Current password is incorrect.",
                    "errors":  {"current_password": ["Current password is incorrect."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {
                "success": True,
                "message": (
                    "Password changed successfully. "
                    "Please log in again with your new password."
                ),
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Delete Account
# ─────────────────────────────────────────────────────────────────────────────

class DeleteAccountView(APIView):
    """
    DELETE /api/auth/account/

    Allows a vendor to permanently delete their own account.
    Requires OTP confirmation to prevent accidental deletions.

    The OTP must have been requested via /api/auth/otp/request/
    with purpose = delete_account before calling this endpoint.

    Admin accounts cannot be deleted via this endpoint.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Delete the authenticated vendor's account",
        request={"application/json": {"type": "object", "properties": {
            "otp_code": {"type": "string"}
        }}},
        responses={200: {"description": "Account deleted."}},
    )
    def delete(self, request):
        from otp.models import OTP

        if request.user.is_admin:
            return Response(
                {
                    "success": False,
                    "message": "Admin accounts cannot be deleted via this endpoint.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        otp_code = request.data.get("otp_code")

        if not otp_code:
            return Response(
                {"success": False, "message": "OTP code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = (
            OTP.objects
            .filter(
                user    = request.user,
                purpose = OTP.Purpose.DELETE_ACCOUNT,
                is_used = False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or otp.code != otp_code or otp.is_expired:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired OTP. Please request a new one.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        # Soft-delete: deactivate rather than hard-delete
        # to preserve sales history and audit trail
        user          = request.user
        user.is_active = False
        user.status    = "suspended"
        user.email     = f"deleted_{user.id}@deleted.invalid"
        user.save(update_fields=["is_active", "status", "email"])

        return Response(
            {"success": True, "message": "Your account has been deleted."},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin — User Management ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminUserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Admin-only viewset for managing users across the platform.

    GET    /api/admin/users/              — paginated list with filters
    GET    /api/admin/users/{id}/         — user detail
    PATCH  /api/admin/users/{id}/status/  — change account status
    POST   /api/admin/users/{id}/suspend/ — suspend vendor
    POST   /api/admin/users/{id}/reinstate/ — reinstate vendor
    """

    permission_classes = [IsAdmin]
    serializer_class   = UserListSerializer

    def get_queryset(self):
        qs = (
            User.objects
            .select_related("approved_by")
            .order_by("-created_at")
        )
        role   = self.request.query_params.get("role")
        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if role:
            qs = qs.filter(role=role)
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(email__icontains=search)

        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return UserDetailSerializer
        if self.action == "set_status":
            return AdminUserStatusSerializer
        return UserListSerializer

    @extend_schema(
        summary="List all users (admin only)",
        parameters=[
            OpenApiParameter("role",   description="Filter by role",   required=False, type=str),
            OpenApiParameter("status", description="Filter by status", required=False, type=str),
            OpenApiParameter("search", description="Search by email",  required=False, type=str),
        ],
        responses={200: UserListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get user detail (admin only)",
        responses={200: UserDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Change a user's account status",
        request=AdminUserStatusSerializer,
        responses={200: AdminUserStatusSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="status")
    def set_status(self, request, pk=None):
        user       = self.get_object()
        serializer = AdminUserStatusSerializer(
            user,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": f"User status updated to '{user.status}'.",
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Suspend a vendor account",
        responses={200: {"description": "Vendor suspended."}},
    )
    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        user = self.get_object()

        if user.role == User.Role.ADMIN:
            return Response(
                {"success": False, "message": "Admin accounts cannot be suspended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.status = User.Status.SUSPENDED
        user.save(update_fields=["status"])

        Notification.objects.create(
            recipient         = user,
            notification_type = Notification.NotificationType.ACCOUNT_SUSPENDED,
            title             = "Your account has been suspended",
            message           = (
                "Your StockSense account has been suspended. "
                "Please contact support for more information."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = "/support",
        )

        return Response(
            {"success": True, "message": "Vendor account suspended."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Reinstate a suspended vendor account",
        responses={200: {"description": "Vendor reinstated."}},
    )
    @action(detail=True, methods=["post"], url_path="reinstate")
    def reinstate(self, request, pk=None):
        user = self.get_object()

        if user.status != User.Status.SUSPENDED:
            return Response(
                {
                    "success": False,
                    "message": "Only suspended accounts can be reinstated.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.status = User.Status.APPROVED
        user.save(update_fields=["status"])

        Notification.objects.create(
            recipient         = user,
            notification_type = Notification.NotificationType.ACCOUNT_APPROVED,
            title             = "Your account has been reinstated",
            message           = (
                "Your StockSense account has been reinstated. "
                "You can now log in and continue selling."
            ),
            channel    = Notification.Channel.BOTH,
            action_url = "/dashboard",
        )

        return Response(
            {"success": True, "message": "Vendor account reinstated."},
            status=status.HTTP_200_OK,
        )