# seed_subscriptions.py

import os
import sys
import django

# ── Bootstrap Django ──
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# ── Import after setup ──
from subscriptions.models import SubscriptionPlan


def seed():
    plans = [
        {
            "name":              "free",
            "product_limit":     20,
            "monthly_price_ngn": 0.00,
            "yearly_price_ngn":  0.00,
            "has_analytics":     False,
            "has_reports":       False,
            "has_multi_branch":  False,
            "is_active":         True,
        },
        {
            "name":              "basic",
            "product_limit":     100,
            "monthly_price_ngn": 4500.00,
            "yearly_price_ngn":  3600.00,
            "has_analytics":     False,
            "has_reports":       False,
            "has_multi_branch":  False,
            "is_active":         True,
        },
        {
            "name":              "pro",
            "product_limit":     1000,
            "monthly_price_ngn": 12000.00,
            "yearly_price_ngn":  9600.00,
            "has_analytics":     True,
            "has_reports":       True,
            "has_multi_branch":  False,
            "is_active":         True,
        },
        {
            "name":              "enterprise",
            "product_limit":     0,
            "monthly_price_ngn": 28000.00,
            "yearly_price_ngn":  22400.00,
            "has_analytics":     True,
            "has_reports":       True,
            "has_multi_branch":  True,
            "is_active":         True,
        },
    ]

    created_count = 0
    updated_count = 0

    for plan_data in plans:
        plan, created = SubscriptionPlan.objects.update_or_create(
            name     = plan_data["name"],
            defaults = plan_data,
        )
        if created:
            created_count += 1
            print(f"  ✓ Created  — {plan.get_name_display()}")
        else:
            updated_count += 1
            print(f"  ↻ Updated  — {plan.get_name_display()}")

    print(f"\n  Done — {created_count} created, {updated_count} updated.")
    print(f"  Total plans in DB: {SubscriptionPlan.objects.count()}")


if __name__ == "__main__":
    print("\nSeeding subscription plans...\n")
    seed()