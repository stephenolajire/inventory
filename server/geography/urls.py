# geography/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CountryViewSet,
    StateViewSet,
    LGAViewSet,
    AdminGeographyViewSet,
)

router = DefaultRouter()
router.register(
    prefix   = "countries",
    viewset  = CountryViewSet,
    basename = "countries",
)
router.register(
    prefix   = "states",
    viewset  = StateViewSet,
    basename = "states",
)
router.register(
    prefix   = "lgas",
    viewset  = LGAViewSet,
    basename = "lgas",
)
router.register(
    prefix   = "admin",
    viewset  = AdminGeographyViewSet,
    basename = "admin-geography",
)

# ── Admin routes with path params not supported by DefaultRouter ──
extra_patterns = [
    path(
        "admin/countries/<country_id>/",
        AdminGeographyViewSet.as_view({"patch": "update_country"}),
        name="admin-geography-update-country",
    ),
    path(
        "admin/countries/<country_id>/toggle/",
        AdminGeographyViewSet.as_view({"post": "toggle_country"}),
        name="admin-geography-toggle-country",
    ),
    path(
        "admin/states/<state_id>/",
        AdminGeographyViewSet.as_view({"patch": "update_state"}),
        name="admin-geography-update-state",
    ),
    path(
        "admin/lgas/<lga_id>/",
        AdminGeographyViewSet.as_view({"patch": "update_lga"}),
        name="admin-geography-update-lga",
    ),
]

urlpatterns = [
    path("", include(router.urls)),
    path("", include(extra_patterns)),
]