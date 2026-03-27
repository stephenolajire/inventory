"""
apps/users/serializers.py
=========================
Serializers are strictly separated by operation:
  - List/read serializers expose only what the frontend renders.
  - Write serializers validate input and never echo passwords.
  - Admin serializers expose additional fields unavailable to vendors.

Password fields are write_only=True on every serializer.
No serializer ever returns a password hash.
"""

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


# ─────────────────────────────────────────────────────────────────────────────
# Read / list serializers
# ─────────────────────────────────────────────────────────────────────────────

class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal representation used wherever a user reference is
    embedded inside another resource e.g. "approved_by" on a vendor.
    Exposes only what is needed to render a name/email attribution.
    """

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "role",
        ]


class UserListSerializer(serializers.ModelSerializer):
    """
    Used in: admin vendor list, admin user management table.
    Renders one row per user — no nested objects, no heavy fields.
    """

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "role",
            "status",
            "email_verified",
            "created_at",
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Used in: admin user detail view, vendor's own profile header.
    Includes approval metadata and timestamps.
    approved_by is a minimal nested object — just id + email.
    """

    approved_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "role",
            "status",
            "email_verified",
            "email_verified_at",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]


class MeSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/auth/me/ — the logged-in user's own record.
    Returns everything the frontend dashboard needs to bootstrap.
    """

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "role",
            "status",
            "email_verified",
            "created_at",
        ]


# ─────────────────────────────────────────────────────────────────────────────
# Write serializers
# ─────────────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """
    Used in: POST /api/auth/register/
    Validates email uniqueness, password strength and plan selection.
    confirm_password is validated and discarded — never stored.
    """

    # confirm_password = serializers.CharField(
    #     write_only=True,
    #     required=True,
    #     style={"input_type": "password"},
    # )
    plan = serializers.ChoiceField(
        choices=["free", "basic", "pro", "enterprise"],
        write_only=True,
        required=True,
    )
    billing_cycle = serializers.ChoiceField(
        choices=["monthly", "yearly"],
        write_only=True,
        required=True,
    )

    class Meta:
        model  = User
        fields = [
            "email",
            "password",
            "plan",
            "billing_cycle",
        ]
        extra_kwargs = {
            "password": {
                "write_only": True,
                "style":      {"input_type": "password"},
            },
        }

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    # def validate(self, attrs: dict) -> dict:
    #     if attrs["password"] != attrs.pop("confirm_password"):
    #         raise serializers.ValidationError(
    #             {"confirm_password": "Passwords do not match."}
    #         )
    #     return attrs

    def create(self, validated_data: dict) -> User:
        # plan and billing_cycle are consumed by the view,
        # not stored on the User model directly.
        validated_data.pop("plan",          None)
        validated_data.pop("billing_cycle", None)

        return User.objects.create_user(
            email    = validated_data["email"],
            password = validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/login/
    Returns validated user object on success.
    Does not expose any user data directly — tokens are
    issued by the view after this serializer validates.
    """

    email    = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request  = self.context.get("request"),
            username = attrs["email"].lower(),
            password = attrs["password"],
        )
        if not user:
            raise serializers.ValidationError(
                "Incorrect email or password."
            )
        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated."
            )
        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """
    Used in: POST /api/auth/change-password/
    Requires the current password before accepting the new one.
    """

    current_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password     = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    # confirm_password = serializers.CharField(
    #     write_only=True,
    #     style={"input_type": "password"},
    # )

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value

    # def validate(self, attrs: dict) -> dict:
    #     if attrs["new_password"] != attrs["confirm_password"]:
    #         raise serializers.ValidationError(
    #             {"confirm_password": "Passwords do not match."}
    #         )
    #     return attrs


# ─────────────────────────────────────────────────────────────────────────────
# Admin serializers
# ─────────────────────────────────────────────────────────────────────────────

class AdminUserStatusSerializer(serializers.ModelSerializer):
    """
    Used in: PATCH /api/admin/users/{id}/status/
    Allows admin to change a user's status.
    Only status is writable — nothing else on this serializer.
    """

    class Meta:
        model  = User
        fields = ["id", "status"]
        read_only_fields = ["id"]