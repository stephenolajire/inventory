"""
apps/users/models.py
====================
Custom User model — email is the login identifier.
AbstractBaseUser gives full control over the auth fields.
Roles are hard-typed as TextChoices so they are validated
at the database level via check constraints in Django 4.1+.

Index strategy:
  - email:  unique + db_index (login lookup)
  - role + status: composite index (admin dashboard filtering)
  - status + created_at: composite index (pending approval queue)
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class UserManager(BaseUserManager):

    def create_user(self, email: str, password: str, **extra_fields):
        if not email:
            raise ValueError(_("Email address is required."))
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff",     True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role",         User.Role.ADMIN)
        extra_fields.setdefault("status",       User.Status.APPROVED)
        extra_fields.setdefault("email_verified", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Platform user. Either a vendor or an admin.
    email     — login identifier, globally unique.
    role      — determines which parts of the platform they can access.
    status    — lifecycle state from registration through to approval.
    """

    class Role(models.TextChoices):
        ADMIN  = "admin",  _("Admin")
        VENDOR = "vendor", _("Vendor")

    class Status(models.TextChoices):
        PENDING_VERIFICATION = "pending_verification", _("Pending Email Verification")
        PENDING_APPROVAL     = "pending_approval",     _("Pending Admin Approval")
        APPROVED             = "approved",             _("Approved")
        SUSPENDED            = "suspended",            _("Suspended")
        REJECTED             = "rejected",             _("Rejected")

    email  = models.EmailField(unique=True, db_index=True)
    role   = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.VENDOR,
        db_index=True,
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_VERIFICATION,
        db_index=True,
    )

    # ── Email verification ──
    email_verified    = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)

    # ── Admin approval ──
    approved_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_vendors",
        db_index=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # ── Django internals ──
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    last_login  = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = []
    objects         = UserManager()

    class Meta:
        db_table            = "auth_user"
        verbose_name        = _("User")
        verbose_name_plural = _("Users")
        indexes = [
            # Admin dashboard: filter vendors by role + status
            models.Index(
                fields=["role", "status"],
                name="idx_user_role_status",
            ),
            # Pending approval queue sorted by registration date
            models.Index(
                fields=["status", "created_at"],
                name="idx_user_status_created",
            ),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def is_vendor(self) -> bool:
        return self.role == self.Role.VENDOR

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_approved(self) -> bool:
        return self.status == self.Status.APPROVED