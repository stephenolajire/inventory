# sales/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SaleViewSet, AdminSaleViewSet

router = DefaultRouter()
router.register(
    prefix   = "",
    viewset  = SaleViewSet,
    basename = "sales",
)
router.register(
    prefix   = "admin",
    viewset  = AdminSaleViewSet,
    basename = "admin-sales",
)

# ── Receipt URL needs a custom path because the cart_id
#    sits inside the URL and DRF router does not support
#    nested params on non-detail routes natively ──
extra_patterns = [
    path(
        "receipt/<cart_id>/",
        SaleViewSet.as_view({"get": "receipt"}),
        name="sale-receipt",
    ),
]

urlpatterns = [
    path("", include(router.urls)),
    path("", include(extra_patterns)),
]