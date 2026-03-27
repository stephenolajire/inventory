# apps/users/urls.py

from django.urls import path, include

from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    MeView,
    ChangePasswordView,
    DeleteAccountView,
    AdminUserViewSet,
)

# ── Admin router ──
router = DefaultRouter()
router.register(
    prefix   = "admin/users",
    viewset  = AdminUserViewSet,
    basename = "admin-users",
)

urlpatterns = [

    # ── Public auth ──
    path("register/",       RegisterView.as_view(),       name="auth-register"),
    path("login/",          LoginView.as_view(),           name="auth-login"),
    path("logout/",         LogoutView.as_view(),          name="auth-logout"),
    path("token/refresh/",  TokenRefreshView.as_view(),    name="auth-token-refresh"),

    # ── Authenticated user ──
    path("me/",             MeView.as_view(),              name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("account/",        DeleteAccountView.as_view(),   name="auth-delete-account"),

    # ── Admin user management ──
    path("", include(router.urls)),

]