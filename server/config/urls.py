# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [

    # ── Django Admin ──
    path("admin/", admin.site.urls),

    # ── API Docs (disable in production) ──
    path("api/schema/",        SpectacularAPIView.as_view(),        name="schema"),
    path("api/docs/",          SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/",         SpectacularRedocView.as_view(url_name="schema"),     name="redoc"),

    # ── Core ──
    # path("api/",               include("core.urls")),

    # ── Auth & Users ──
    path("api/auth/",          include("users.urls")),
    path("api/otp/",      include("otp.urls")),
    path("api/password/", include("passwords.urls")),
    path("api/verification/",   include("verification.urls")),

    # ── Vendor ──
    path("api/vendors/",       include("vendors.urls")),
    path("api/scanners/",      include("scanners.urls")),

    # ── Subscription ──
    path("api/subscriptions/", include("subscriptions.urls")),
     path("api/paypal/",     include("paypal.urls")),

    # ── Products ──
    path("api/products/",      include("products.urls")),

    # ── Storekeeper & Sales ──
    path("api/storekeeper/",   include("storekeeper.urls")),
    path("api/sales/",         include("sales.urls")),

    # ── Analytics & Reports ──
    path("api/analytics/",     include("analytics.urls")),
    path("api/reports/",       include("reports.urls")),

    # ── Notifications ──
    path("api/notifications/", include("notifications.urls")),

    # ── Geography ──
    path("api/geography/",     include("geography.urls")),

]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)