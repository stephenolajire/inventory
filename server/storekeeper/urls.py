# storekeeper/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import StorekeeperViewSet

router = DefaultRouter()
router.register(
    prefix   = "carts",
    viewset  = StorekeeperViewSet,
    basename = "storekeeper",
)

# ── Extra patterns for nested item routes ──
# DRF router does not support nested URL params natively
# so item-level actions are registered manually.
extra_patterns = [
    path(
        "carts/<pk>/items/<item_id>/",
        StorekeeperViewSet.as_view({"patch": "update_item"}),
        name="storekeeper-update-item",
    ),
    path(
        "carts/<pk>/items/<item_id>/remove/",
        StorekeeperViewSet.as_view({"delete": "remove_item"}),
        name="storekeeper-remove-item",
    ),
]

urlpatterns = [
    path("", include(router.urls)),
    path("", include(extra_patterns)),
]