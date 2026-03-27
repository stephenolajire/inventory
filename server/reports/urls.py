# reports/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ReportViewSet, AdminReportViewSet

router = DefaultRouter()
router.register(
    prefix   = "admin",        # ← more specific first
    viewset  = AdminReportViewSet,
    basename = "admin-reports",
)
router.register(
    prefix   = "",             # ← catch-all last
    viewset  = ReportViewSet,
    basename = "reports",
)

# ── Admin generate-for-vendor uses a vendor_id in the path
#    which the router cannot handle natively ──
extra_patterns = [
    path(
        "admin/generate/<vendor_id>/",
        AdminReportViewSet.as_view({"post": "generate_for_vendor"}),
        name="admin-report-generate-for-vendor",
    ),
]

urlpatterns = [
    path("", include(router.urls)),
    path("", include(extra_patterns)),
]


