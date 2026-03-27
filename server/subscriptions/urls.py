# subscriptions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SubscriptionPlanViewSet,
    VendorSubscriptionViewSet,
    AdminSubscriptionViewSet,
)

router = DefaultRouter()
router.register(
    prefix   = "plans",
    viewset  = SubscriptionPlanViewSet,
    basename = "subscription-plans",
)
router.register(
    prefix   = "",
    viewset  = VendorSubscriptionViewSet,
    basename = "vendor-subscriptions",
)
router.register(
    prefix   = "admin",
    viewset  = AdminSubscriptionViewSet,
    basename = "admin-subscriptions",
)

urlpatterns = [
    path("", include(router.urls)),
]