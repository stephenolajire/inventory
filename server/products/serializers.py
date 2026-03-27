"""
apps/products/serializers.py
"""

from rest_framework import serializers
from .models import Category, Product
from .tasks import process_new_product


class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "slug"]


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model            = Category
        fields           = ["id", "name", "slug", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value: str) -> str:
        qs = Category.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )
        return value


class ProductListSerializer(serializers.ModelSerializer):
    category_name   = serializers.CharField(source="category.name", read_only=True)
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    image_url       = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            "id",
            "name",
            "category_name",
            "unit",
            "selling_price",
            "effective_price",
            "quantity_in_stock",
            "low_stock_threshold",
            "is_low_stock",
            "is_active",
            "processing_status",
            "barcode",
            "barcode_image",
            "image_url",
            "created_at",
            "is_variable_quantity",
            "minimum_quantity",
        ]

    def get_image_url(self, obj) -> str:
        return obj.image_url


class ProductDetailSerializer(serializers.ModelSerializer):
    category        = CategoryListSerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_low_stock    = serializers.BooleanField(read_only=True)
    image_url       = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            "id",
            "name",
            "description",
            "category",
            "brand",
            "unit",
            "image_url",
            "sku",
            "barcode",
            "barcode_image",
            "selling_price",
            "cost_price",
            "discount_price",
            "discount_expires_at",
            "effective_price",
            "tax_rate",
            "quantity_in_stock",
            "low_stock_threshold",
            "is_low_stock",
            "total_sold",
            "is_active",
            "processing_status",
            "created_at",
            "updated_at",
        ]

    def get_image_url(self, obj) -> str:
        return obj.image_url


class ProductCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    discount_expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        input_formats=["iso-8601", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"],
    )

    class Meta:
        model  = Product
        fields = [
            "name",
            "description",
            "category",
            "brand",
            "unit",
            "sku",
            "image",
            "selling_price",
            "cost_price",
            "discount_price",
            "discount_expires_at",
            "tax_rate",
            "quantity_in_stock",
            "low_stock_threshold",
            "is_variable_quantity",
            
            
        ]

    def validate_selling_price(self, value) -> object:
        if value <= 0:
            raise serializers.ValidationError(
                "Selling price must be greater than zero."
            )
        return value

    def validate_quantity_in_stock(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError(
                "Stock quantity cannot be negative."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        discount_price      = attrs.get("discount_price")
        discount_expires_at = attrs.get("discount_expires_at")
        if attrs.get("is_variable_quantity"):
            unit = attrs.get("unit", "")
            measurable_units = [
                Product.Unit.KG,
                Product.Unit.LITRE,
            ]
            if unit not in measurable_units:
                raise serializers.ValidationError({
                    "unit": (
                        "Variable-quantity products must use a measurable unit "
                        "(kg or litre)."
                    )
                })

        if discount_price is not None and discount_expires_at is None:
            raise serializers.ValidationError({
                "discount_expires_at": (
                    "Expiry date is required when a discount price is set."
                )
            })
        if discount_price is not None and discount_price >= attrs.get("selling_price", 0):
            raise serializers.ValidationError({
                "discount_price": "Discount price must be less than selling price."
            })
        return attrs
    
        

    # in serializer create()
    def create(self, validated_data):
        image_file = validated_data.pop("image", None)
        
        product = Product(**validated_data)
        product.is_active         = False
        product.processing_status = Product.ProcessingStatus.PROCESSING
        product.save()

        if image_file:
            import tempfile, os
            suffix = os.path.splitext(image_file.name)[1]  # .jpg, .png etc
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in image_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            # pass tmp path to task
            process_new_product.delay(str(product.id), tmp_path)
        else:
            process_new_product.delay(str(product.id), None)

        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    discount_expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        input_formats=["iso-8601", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"],
    )

    class Meta:
        model  = Product
        fields = [
            "name",
            "description",
            "category",
            "brand",
            "unit",
            "sku",
            "image",
            "selling_price",
            "cost_price",
            "discount_price",
            "discount_expires_at",
            "tax_rate",
            "low_stock_threshold",
        ]

    def validate_selling_price(self, value) -> object:
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "Selling price must be greater than zero."
            )
        return value

    def update(self, instance, validated_data):
        image_file = validated_data.pop("image", None)

        if image_file:
            import cloudinary.uploader
            result         = cloudinary.uploader.upload(
                image_file,
                folder        = f"stocksense/products/{instance.vendor.id}/",
                resource_type = "image",
            )
            instance.image = result["public_id"]

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class StockUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ["quantity_in_stock"]

    def validate_quantity_in_stock(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError(
                "Stock quantity cannot be negative."
            )
        return value


class DiscountSerializer(serializers.ModelSerializer):
    discount_expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        input_formats=["iso-8601", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"],
    )
    class Meta:
        model  = Product
        fields = ["discount_price", "discount_expires_at"]

    def validate(self, attrs: dict) -> dict:
        price      = attrs.get("discount_price")
        expires_at = attrs.get("discount_expires_at")

        if price is not None and expires_at is None:
            raise serializers.ValidationError({
                "discount_expires_at": (
                    "Expiry date is required when setting a discount price."
                )
            })
        if price is not None and self.instance:
            if price >= self.instance.selling_price:
                raise serializers.ValidationError({
                    "discount_price": (
                        "Discount price must be less than selling price."
                    )
                })
        return attrs


class ProductImageUploadSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()

    class Meta:
        model  = Product
        fields = ["image"]

    def update(self, instance, validated_data):
        image_file = validated_data.pop("image")
        import cloudinary.uploader
        result         = cloudinary.uploader.upload(
            image_file,
            folder        = f"stocksense/products/{instance.vendor.id}/",
            resource_type = "image",
        )
        instance.image = result["public_id"]
        instance.save(update_fields=["image"])
        return instance