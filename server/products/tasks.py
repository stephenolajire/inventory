# products/tasks.py

import io
import logging
import random
import string

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model
from django.utils import timezone
import barcode  # type: ignore
from barcode.writer import ImageWriter  # type: ignore

logger = get_task_logger(__name__)
User   = get_user_model()


def _generate_barcode_string(vendor_id: str) -> str:
    """
    Generates a unique Code128 barcode string.
    Format: SS-{first 6 chars of vendor_id}-{6 random digits}
    Example: SS-A3F2B1-847201
    """
    vendor_prefix = str(vendor_id).replace("-", "")[:6].upper()
    random_suffix = "".join(random.choices(string.digits, k=6))
    return f"SS{vendor_prefix}{random_suffix}"


def _ensure_unique_barcode(vendor_id: str) -> str:
    """
    Keeps generating until a globally unique barcode string is found.
    Collision probability is astronomically low but we guarantee it.
    """
    from products.models import Product

    max_attempts = 10
    for attempt in range(max_attempts):
        candidate = _generate_barcode_string(vendor_id)
        if not Product.objects.filter(barcode=candidate).exists():
            return candidate
        logger.warning(
            "_ensure_unique_barcode — collision on attempt %d: %s",
            attempt + 1,
            candidate,
        )

    raise ValueError(
        f"Could not generate unique barcode after {max_attempts} attempts."
    )


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 10,
    name                = "products.process_new_product",
)
def process_new_product(self, product_id: str, image_path: str = None):
    """
    Background task that runs after a product draft is saved.

    Steps:
      1. Load the product record.
      2. Upload product image to Cloudinary (if provided).
      3. Generate a globally unique barcode string.
      4. Render the barcode as a PNG using python-barcode.
      5. Upload the PNG to Cloudinary.
      6. Mark the product as active.
      7. Create an in-app notification for the vendor.
    """

    logger.info("process_new_product — START | product_id=%s", product_id)

    from products.models import Product
    try:
        product = Product.objects.select_related("vendor").get(id=product_id)
    except Product.DoesNotExist:
        logger.error("process_new_product — product not found: %s", product_id)
        return

    if product.processing_status == Product.ProcessingStatus.ACTIVE:
        logger.info("process_new_product — already active, skipping: %s", product_id)
        return

    vendor = product.vendor

    try:
        # ── Step 1: Upload product image if provided ──
        if image_path:
            import os
            import cloudinary.uploader  # type: ignore

            if os.path.exists(image_path):
                try:
                    result = cloudinary.uploader.upload(
                        image_path,
                        folder        = f"stocksense/products/{vendor.id}/",
                        resource_type = "image",
                    )
                    product.image = result["public_id"]
                    product.save(update_fields=["image"])
                    logger.info(
                        "process_new_product — image uploaded | product=%s", product_id
                    )
                except Exception as exc:
                    logger.warning(
                        "process_new_product — image upload failed (non-fatal) | product=%s | error=%s",
                        product_id, str(exc),
                    )
                finally:
                    try:
                        os.remove(image_path)
                        logger.info("process_new_product — temp image cleaned up: %s", image_path)
                    except OSError:
                        pass
            else:
                logger.warning(
                    "process_new_product — image_path not found: %s", image_path
                )

        # ── Step 2: Generate unique barcode string ──
        barcode_string = _ensure_unique_barcode(str(vendor.id))
        logger.info(
            "process_new_product — barcode generated: %s | product=%s",
            barcode_string, product_id,
        )

        # ── Step 3: Render barcode PNG ──
        try:
            import barcode  # type: ignore
            from barcode.writer import ImageWriter  # type: ignore

            buffer  = io.BytesIO()
            code128 = barcode.get("code128", barcode_string, writer=ImageWriter())
            code128.write(buffer)
            buffer.seek(0)
        except Exception as exc:
            logger.error(
                "process_new_product — barcode render failed | product=%s | error=%s",
                product_id, str(exc),
            )
            raise self.retry(exc=exc)

        # ── Step 4: Upload barcode PNG to Cloudinary ──
        try:
            import cloudinary.uploader  # type: ignore

            upload_result = cloudinary.uploader.upload(
                buffer,
                folder        = f"stocksense/barcodes/{vendor.id}/",
                public_id     = barcode_string,
                resource_type = "image",
                format        = "png",
                overwrite     = True,
            )
            barcode_image_url = upload_result["secure_url"]
        except Exception as exc:
            logger.error(
                "process_new_product — barcode upload failed | product=%s | error=%s",
                product_id, str(exc),
            )
            raise self.retry(exc=exc)

        # ── Step 5: Activate product ──
        product.barcode           = barcode_string
        product.barcode_image     = barcode_image_url
        product.is_active         = True
        product.processing_status = Product.ProcessingStatus.ACTIVE
        product.save(update_fields=[
            "barcode", "barcode_image", "is_active", "processing_status", "updated_at",
        ])

        logger.info(
            "process_new_product — product live | product=%s | vendor=%s",
            product_id, vendor.email,
        )

        # ── Step 6: Notify vendor ──
        from notifications.models import Notification
        Notification.objects.create(
            recipient           = vendor,
            notification_type   = Notification.NotificationType.PRODUCT_READY,
            title               = f"Product added: {product.name}",
            message             = (
                f"'{product.name}' is now live in your inventory. "
                f"Barcode is ready to print."
            ),
            channel             = Notification.Channel.IN_APP,
            related_object_type = "Product",
            related_object_id   = product.id,
            action_url          = f"/products/{product.id}",
        )

        logger.info("process_new_product — DONE | product=%s", product_id)

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            logger.error(
                "process_new_product — FAILED after %d retries | product=%s | error=%s",
                self.max_retries, product_id, str(exc),
            )
            product.processing_status = Product.ProcessingStatus.FAILED
            product.is_active         = False
            product.save(update_fields=["processing_status", "is_active", "updated_at"])

            from notifications.models import Notification
            Notification.objects.create(
                recipient           = vendor,
                notification_type   = Notification.NotificationType.PRODUCT_FAILED,
                title               = f"Product processing failed: {product.name}",
                message             = (
                    f"We could not process '{product.name}'. "
                    f"Please try adding it again or contact support."
                ),
                channel             = Notification.Channel.IN_APP,
                related_object_type = "Product",
                related_object_id   = product.id,
                action_url          = f"/products/{product.id}",
            )
        raise