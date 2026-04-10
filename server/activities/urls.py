# activities/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ActivityViewSet

router = DefaultRouter()
router.register(
    prefix="",
    viewset=ActivityViewSet,
    basename="activities",
)

urlpatterns = [
    path("", include(router.urls)),
]
