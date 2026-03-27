"""
apps/core/models.py
===================
Abstract base models shared across every app in the project.
No database tables are created from this file directly.
"""

import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    """
    Abstract base that stamps created_at / updated_at on every model.
    Both fields are individually indexed — they appear in ORDER BY,
    range filters and analytics GROUP BY clauses across the project.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        db_index=True,
    )

    class Meta:
        abstract = True