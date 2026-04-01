# subscriptions/utils.py

from django.utils import timezone


def period_end_from_cycle(billing_cycle: str) -> timezone.datetime:
    """
    Returns the subscription period end datetime based on billing cycle.
    Monthly = 30 days from now.
    Yearly  = 365 days from now.

    Single source of truth — imported by both views.py and tasks.py
    so both always agree on period lengths.
    """
    from subscriptions.models import VendorSubscription

    if billing_cycle == VendorSubscription.BillingCycle.YEARLY:
        return timezone.now() + timezone.timedelta(days=365)
    return timezone.now() + timezone.timedelta(days=30)