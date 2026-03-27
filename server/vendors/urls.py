# vendors/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import VendorProfileViewSet, AdminVendorViewSet

router = DefaultRouter()
router.register(
    prefix   = "me",
    viewset  = VendorProfileViewSet,
    basename = "vendor-profile",
)
router.register(
    prefix   = "admin",
    viewset  = AdminVendorViewSet,
    basename = "admin-vendors",
)

urlpatterns = [
    path("", include(router.urls)),
]

# Add this temporary view to urls.py to debug
from django.urls import path
from django.http import JsonResponse

def show_urls(request):
    from django.urls import get_resolver
    urls = []
    def collect(resolver, prefix=""):
        for pattern in resolver.url_patterns:
            from django.urls import URLResolver, URLPattern
            if isinstance(pattern, URLResolver):
                collect(pattern, prefix + str(pattern.pattern))
            else:
                urls.append(prefix + str(pattern.pattern))
    collect(get_resolver())
    vendor_urls = [u for u in urls if "vendor" in u]
    return JsonResponse({"urls": vendor_urls})

urlpatterns += [path("debug/urls/", show_urls)]