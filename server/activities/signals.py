"""
apps/activities/signals.py
===========================
Django signals to automatically log activities for certain models.

This module connects to Django's post_save and post_delete signals
to automatically log creation, updates, and deletions.

To enable signal handling, add this import to activities/__init__.py:
    from .signals import *

Or import it in apps.py ready() method.
"""

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Activity
from .utils import log_activity

User = get_user_model()


# Track original values for detecting changes
_original_values = {}


@receiver(pre_save)
def track_pre_save(sender, instance, **kwargs):
    """Store original values before save to detect changes."""
    if hasattr(instance, "_state"):
        try:
            original = sender.objects.get(pk=instance.pk)
            _original_values[id(instance)] = original
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """Log when user accounts are created or updated."""
    if created:
        log_activity(
            user=instance,
            action_type=Activity.ActionType.CREATE,
            description=f"Account created: {instance.email}",
            content_object=instance,
        )
    else:
        # Only log if this is an admin update (not user's own update)
        # You can customize this based on your needs
        pass


def should_log_model(model):
    """Determine if a model should have activities logged automatically."""
    # Add models to your logging list here
    models_to_track = [
        # Examples:
        # 'products.Product',
        # 'sales.Order',
        # 'subscriptions.Subscription',
    ]

    model_name = f"{model._meta.app_label}.{model._meta.model_name}"
    return model_name in models_to_track
