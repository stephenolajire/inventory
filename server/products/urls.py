# products/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register(
    prefix   = "categories",
    viewset  = CategoryViewSet,
    basename = "categories",
)
router.register(
    prefix   = "",
    viewset  = ProductViewSet,
    basename = "products",
)

urlpatterns = [
    path("", include(router.urls)),
]