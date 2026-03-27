from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, AdminNotificationViewSet

router = DefaultRouter()
router.register(
    prefix   = "",
    viewset  = NotificationViewSet,
    basename = "notifications",
)
router.register(
    prefix   = "admin",
    viewset  = AdminNotificationViewSet,
    basename = "admin-notifications",
)

urlpatterns = [
    path("", include(router.urls)),
]