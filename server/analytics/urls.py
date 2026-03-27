from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AnalyticsViewSet, AdminAnalyticsViewSet

router = DefaultRouter()
router.register(
    prefix   = "",
    viewset  = AnalyticsViewSet,
    basename = "analytics",
)
router.register(
    prefix   = "admin",
    viewset  = AdminAnalyticsViewSet,
    basename = "admin-analytics",
)

urlpatterns = [
    path("", include(router.urls)),
]