# products/views.py

import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from django.db import models

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin, IsApprovedVendor
from notifications.models import Notification
from activities.utils import log_activity
from activities.models import Activity

from .models import Category, Product
from .serializers import (
    CategoryListSerializer,
    AdminCategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    StockUpdateSerializer,
    DiscountSerializer,
    ProductImageUploadSerializer,
)

logger = logging.getLogger(__name__)
User   = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _create_notification(vendor, notification_type, title, message, product=None):
    """
    Creates an in-app notification for the vendor.
    Centralised here so every product event notification
    is created consistently with the same field pattern.
    """
    Notification.objects.create(
        recipient           = vendor,
        notification_type   = notification_type,
        title               = title,
        message             = message,
        channel             = Notification.Channel.IN_APP,
        related_object_type = "Product",
        related_object_id   = product.id if product else None,
        action_url          = f"/products/{product.id}" if product else "/products",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Category ViewSet — admin manages, vendors read
# ─────────────────────────────────────────────────────────────────────────────

class CategoryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """
    GET    /api/products/categories/          — list all active categories (any auth)
    GET    /api/products/categories/{id}/     — single category
    POST   /api/products/categories/          — create category (admin only)
    PATCH  /api/products/categories/{id}/     — update category (admin only)
    DELETE /api/products/categories/{id}/     — soft delete (admin only)
    """

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return Category.objects.all().order_by("name")
        return Category.objects.filter(is_active=True).order_by("name")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AdminCategorySerializer
        return CategoryListSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]

    @extend_schema(summary="List all categories")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Get single category")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary="Create a category (admin only)", request=AdminCategorySerializer)
    def create(self, request, *args, **kwargs):
        serializer = AdminCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Auto-generate slug if not provided
        name = serializer.validated_data["name"]
        slug = serializer.validated_data.get("slug") or slugify(name)

        # Ensure slug uniqueness
        base_slug    = slug
        counter      = 1
        while Category.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        category = serializer.save(slug=slug)

        logger.info(
            "CategoryViewSet.create — created | name=%s | admin=%s",
            category.name,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Category '{category.name}' created.",
                "data":    AdminCategorySerializer(category).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(summary="Update a category (admin only)")
    def partial_update(self, request, *args, **kwargs):
        category   = self.get_object()
        serializer = AdminCategorySerializer(
            category,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        category = serializer.save()

        return Response(
            {
                "success": True,
                "message": f"Category '{category.name}' updated.",
                "data":    AdminCategorySerializer(category).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(summary="Soft delete a category (admin only)")
    def destroy(self, request, *args, **kwargs):
        category           = self.get_object()
        category.is_active = False
        category.save(update_fields=["is_active"])

        logger.info(
            "CategoryViewSet.destroy — deactivated | name=%s | admin=%s",
            category.name,
            request.user.email,
        )

        return Response(
            {"success": True, "message": f"Category '{category.name}' deactivated."},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Product ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class ProductViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    GET    /api/products/                        — list vendor's products
    GET    /api/products/{id}/                   — product detail
    POST   /api/products/                        — add product
    PATCH  /api/products/{id}/                   — update product
    DELETE /api/products/{id}/                   — soft delete
    PATCH  /api/products/{id}/stock/             — update stock
    PATCH  /api/products/{id}/discount/          — set or clear discount
    PATCH  /api/products/{id}/image/             — upload product image
    POST   /api/products/{id}/activate/          — re-activate hidden product
    GET    /api/products/low-stock/              — low stock products
    GET    /api/admin/products/                  — admin: all products
    """

    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ["admin_list"]:
            return [IsAdmin()]
        return [IsApprovedVendor()]

    def get_queryset(self):
        """
        Vendors see only their own active products.
        Inactive products are excluded from the default queryset —
        they are only accessible via the admin endpoint.
        """
        return (
            Product.objects
            .filter(
                vendor    = self.request.user,
                is_active = True,
            )
            .select_related("category")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        if self.action in ["create", "add"]:
            return ProductCreateSerializer
        if self.action in ["partial_update", "update_product"]:
            return ProductUpdateSerializer
        if self.action == "update_stock":
            return StockUpdateSerializer
        if self.action == "set_discount":
            return DiscountSerializer
        if self.action == "upload_image":
            return ProductImageUploadSerializer
        return ProductDetailSerializer

    # ── List ──

    @extend_schema(
        summary="List vendor products",
        parameters=[
            OpenApiParameter("category",  description="Filter by category ID",   required=False, type=str),
            OpenApiParameter("search",    description="Search by name or brand",  required=False, type=str),
            OpenApiParameter("low_stock", description="Filter low stock only",    required=False, type=bool),
            OpenApiParameter("ordering",  description="Order by field",           required=False, type=str),
        ],
        responses={200: ProductListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        category  = request.query_params.get("category")
        search    = request.query_params.get("search")
        low_stock = request.query_params.get("low_stock")
        ordering  = request.query_params.get("ordering", "-created_at")

        if category:
            qs = qs.filter(category__id=category)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(brand__icontains=search)
        if low_stock in ["true", "1", "yes"]:
            qs = qs.filter(quantity_in_stock__lte=models.F("low_stock_threshold"))

        allowed_orderings = [
            "name", "-name",
            "selling_price", "-selling_price",
            "quantity_in_stock", "-quantity_in_stock",
            "total_sold", "-total_sold",
            "created_at", "-created_at",
        ]
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})

    # ── Retrieve ──

    @extend_schema(
        summary="Get product detail",
        responses={200: ProductDetailSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        product    = self.get_object()
        serializer = ProductDetailSerializer(product)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    # ── Create ──

    @extend_schema(
        summary="Add a new product",
        request=ProductCreateSerializer,
        responses={201: {"description": "Product queued for processing."}},
    )
    
    def create(self, request, *args, **kwargs):
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vendor = request.user

        # ── Check plan product limit ──
        from subscriptions.models import VendorSubscription
        subscription = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(vendor=vendor, status=VendorSubscription.Status.ACTIVE)
            .first()
        )
        if subscription:
            plan_limit = subscription.plan.product_limit
            if plan_limit > 0:
                current_count = Product.objects.filter(vendor=vendor, is_active=True).count()
                if current_count >= plan_limit:
                    return Response(
                        {
                            "success": False,
                            "message": (
                                f"You have reached the product limit "
                                f"({plan_limit}) on your current plan. "
                                f"Upgrade to add more products."
                            ),
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

        # ── Check duplicate name ──
        name = serializer.validated_data["name"]
        if Product.objects.filter(vendor=vendor, name__iexact=name, is_active=True).exists():
            return Response(
                {
                    "success": False,
                    "message": f"You already have an active product named '{name}'.",
                    "errors":  {"name": [f"Product '{name}' already exists."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                product = serializer.save(vendor=vendor)
                logger.info(
                    "ProductViewSet.create — draft saved | product=%s | vendor=%s",
                    product.id, vendor.email,
                )
        except Exception as exc:
            logger.exception(
                "ProductViewSet.create — transaction failed | error=%s", str(exc)
            )
            return Response(
                {"success": False, "message": "Failed to save product. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        from products.tasks import process_new_product
        process_new_product.delay(str(product.id))

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.PRODUCT_UPLOADED,
            description=f"Uploaded product: {product.name}",
            content_object=product,
            metadata={
                "category": product.category.name if product.category else "N/A",
                "price": str(product.selling_price),
                "cost_price": str(product.cost_price),
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Product is being processed. "
                    "It will appear in your inventory in a few seconds."
                ),
                "data": ProductListSerializer(product).data,
            },
            status=status.HTTP_201_CREATED,
        )
    # ── Update ──

    @extend_schema(
        summary="Update a product",
        request=ProductUpdateSerializer,
        responses={200: ProductDetailSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="update")
    def update_product(self, request, pk=None):
        product    = self.get_object()
        serializer = ProductUpdateSerializer(
            product,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)

        # ── Check duplicate name if name is being changed ──
        new_name = serializer.validated_data.get("name")
        if new_name and new_name.lower() != product.name.lower():
            if Product.objects.filter(
                vendor       = request.user,
                name__iexact = new_name,
                is_active    = True,
            ).exclude(pk=product.pk).exists():
                return Response(
                    {
                        "success": False,
                        "message": f"You already have a product named '{new_name}'.",
                        "errors":  {"name": [f"Product '{new_name}' already exists."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        product = serializer.save()

        logger.info(
            "ProductViewSet.update_product — updated | product=%s | vendor=%s",
            product.id,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.UPDATE,
            description=f"Updated product: {product.name}",
            content_object=product,
            metadata={
                "changes": list(serializer.validated_data.keys()),
                "category": product.category.name if product.category else "N/A",
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": f"'{product.name}' updated successfully.",
                "data":    ProductDetailSerializer(product).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Soft Delete ──

    @extend_schema(summary="Soft delete a product")
    def destroy(self, request, pk=None):
        product           = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active"])

        logger.info(
            "ProductViewSet.destroy — deactivated | product=%s | vendor=%s",
            product.id,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.DELETE,
            description=f"Deleted product: {product.name}",
            content_object=product,
            metadata={
                "product_name": product.name,
                "category": product.category.name if product.category else "N/A",
            },
            request=request,
        )

        _create_notification(
            vendor            = request.user,
            notification_type = Notification.NotificationType.SYSTEM,
            title             = f"Product removed: {product.name}",
            message           = (
                f"'{product.name}' has been removed from your inventory. "
                f"Its sales history has been preserved."
            ),
            product = product,
        )

        return Response(
            {"success": True, "message": f"'{product.name}' removed from inventory."},
            status=status.HTTP_200_OK,
        )

    # ── Re-activate ──

    @extend_schema(summary="Re-activate a deactivated product")
    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        product = (
            Product.objects
            .filter(vendor=request.user, pk=pk)
            .first()
        )
        if not product:
            return Response(
                {"success": False, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if product.is_active:
            return Response(
                {"success": False, "message": "Product is already active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Re-check plan limit before re-activating ──
        from subscriptions.models import VendorSubscription
        subscription = (
            VendorSubscription.objects
            .select_related("plan")
            .filter(
                vendor = request.user,
                status = VendorSubscription.Status.ACTIVE,
            )
            .first()
        )
        if subscription:
            plan_limit = subscription.plan.product_limit
            if plan_limit > 0:
                current_count = Product.objects.filter(
                    vendor    = request.user,
                    is_active = True,
                ).count()
                if current_count >= plan_limit:
                    return Response(
                        {
                            "success": False,
                            "message": (
                                f"You have reached your plan's product limit "
                                f"({plan_limit}). Upgrade to restore more products."
                            ),
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

        product.is_active = True
        product.save(update_fields=["is_active"])

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.UPDATE,
            description=f"Reactivated product: {product.name}",
            content_object=product,
            metadata={"product_name": product.name},
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": f"'{product.name}' is now active.",
                "data":    ProductDetailSerializer(product).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Stock Update ──

    @extend_schema(
        summary="Update product stock quantity",
        request=StockUpdateSerializer,
        responses={200: ProductDetailSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="stock")
    def update_stock(self, request, pk=None):
        product    = self.get_object()
        serializer = StockUpdateSerializer(
            product,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)

        old_qty = product.quantity_in_stock
        product = serializer.save()
        new_qty = product.quantity_in_stock

        logger.info(
            "ProductViewSet.update_stock — updated | product=%s | %d → %d | vendor=%s",
            product.id,
            old_qty,
            new_qty,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.STOCK_UPDATED,
            description=f"Updated stock for {product.name}: {old_qty} → {new_qty}",
            content_object=product,
            metadata={
                "old_quantity": old_qty,
                "new_quantity": new_qty,
                "product_name": product.name,
            },
            request=request,
        )

        # ── Notify if newly low stock ──
        if product.is_low_stock and new_qty < old_qty:
            _create_notification(
                vendor            = request.user,
                notification_type = Notification.NotificationType.LOW_STOCK,
                title             = f"Low stock — {product.name}",
                message           = (
                    f"'{product.name}' now has {new_qty} unit(s) remaining. "
                    f"Consider restocking soon."
                ),
                product = product,
            )

        return Response(
            {
                "success": True,
                "message": f"Stock updated from {old_qty} to {new_qty}.",
                "data":    ProductDetailSerializer(product).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Discount ──

    @extend_schema(
        summary="Set or clear a product discount",
        request=DiscountSerializer,
        responses={200: ProductDetailSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="discount")
    def set_discount(self, request, pk=None):
        product    = self.get_object()
        serializer = DiscountSerializer(
            product,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        if product.discount_price:
            message = (
                f"Discount of£{product.discount_price} set on "
                f"'{product.name}' until {product.discount_expires_at:%d %b %Y}."
            )
            discount_description = f"Set discount of £{product.discount_price} on {product.name}"
        else:
            message = f"Discount removed from '{product.name}'."
            discount_description = f"Removed discount from {product.name}"

        logger.info(
            "ProductViewSet.set_discount — updated | product=%s | vendor=%s",
            product.id,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.UPDATE,
            description=discount_description,
            content_object=product,
            metadata={
                "discount_price": str(product.discount_price) if product.discount_price else None,
                "discount_expires_at": product.discount_expires_at.isoformat() if product.discount_expires_at else None,
                "product_name": product.name,
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": message,
                "data":    ProductDetailSerializer(product).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Image Upload ──

    @extend_schema(
        summary="Upload product image",
        request=ProductImageUploadSerializer,
        responses={200: ProductDetailSerializer},
    )
    @action(
        detail      = True,
        methods     = ["patch"],
        url_path    = "image",
        parser_classes = [MultiPartParser, FormParser],
    )
    def upload_image(self, request, pk=None):
        product    = self.get_object()
        serializer = ProductImageUploadSerializer(
            product,
            data    = request.data,
            partial = True,
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        logger.info(
            "ProductViewSet.upload_image — updated | product=%s | vendor=%s",
            product.id,
            request.user.email,
        )

        log_activity(
            user=request.user,
            action_type=Activity.ActionType.UPDATE,
            description=f"Uploaded image for product: {product.name}",
            content_object=product,
            metadata={
                "product_name": product.name,
                "image_updated": True,
            },
            request=request,
        )

        return Response(
            {
                "success": True,
                "message": "Product image updated.",
                "data":    ProductDetailSerializer(product).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Low Stock list ──

    @extend_schema(
        summary="List products with low stock",
        responses={200: ProductListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        from django.db.models import F
        qs = (
            Product.objects
            .filter(
                vendor    = request.user,
                is_active = True,
                quantity_in_stock__lte = F("low_stock_threshold"),
            )
            .select_related("category")
            .order_by("quantity_in_stock")
        )

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Admin: all products ──

    @extend_schema(
        summary="List all products across platform (admin only)",
        parameters=[
            OpenApiParameter("vendor",  description="Filter by vendor ID",   required=False, type=str),
            OpenApiParameter("search",  description="Search by name/barcode", required=False, type=str),
            OpenApiParameter("status",  description="active or inactive",     required=False, type=str),
        ],
        responses={200: ProductListSerializer(many=True)},
    )
    @action(
        detail      = False,
        methods     = ["get"],
        url_path    = "admin/all",
        permission_classes = [IsAdmin],
    )
    def admin_list(self, request):
        qs = (
            Product.objects
            .select_related("vendor", "category")
            .order_by("-created_at")
        )

        vendor = request.query_params.get("vendor")
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        if vendor:
            qs = qs.filter(vendor__id=vendor)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(barcode__icontains=search)
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})