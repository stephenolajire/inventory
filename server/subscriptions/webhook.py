# subscriptions/webhook.py
"""
Stripe webhook handler.

Events handled:
  payment_intent.succeeded          — confirm a charge that required 3DS
  payment_intent.payment_failed     — mark past_due if async charge fails
  payment_method.detached           — clear saved PM so vendor is prompted
  customer.deleted                  — clear Stripe customer ID

Why this exists alongside Celery:
  Your upgrade/pay views call PaymentIntent.create(confirm=True).
  For cards that do NOT require 3D Secure this returns status="succeeded"
  immediately and your view handles it inline — no webhook needed.

  For cards that DO require 3D Secure the intent returns
  status="requires_action". The frontend must complete the challenge,
  after which Stripe fires payment_intent.succeeded asynchronously.
  Without this webhook that payment is never confirmed in your DB.

Registration:
  urls.py  →  path("api/stripe/webhook/", StripeWebhookView.as_view())

  Stripe Dashboard → Developers → Webhooks → Add endpoint
    URL:    https://yourdomain.com/api/stripe/webhook/
    Events: payment_intent.succeeded
            payment_intent.payment_failed
            payment_method.detached
            customer.deleted
"""

import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    """
    Receives and verifies Stripe webhook events.
    Returns 200 immediately for unknown event types so Stripe
    doesn't retry them endlessly.
    """

    def post(self, request, *args, **kwargs):
        payload   = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        # ── Verify signature ──
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            logger.warning("StripeWebhook — invalid payload")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            logger.warning("StripeWebhook — invalid signature")
            return HttpResponse(status=400)

        event_type = event["type"]
        data       = event["data"]["object"]

        logger.info("StripeWebhook — received | type=%s | id=%s", event_type, event["id"])

        # ── Route to handler ──
        if event_type == "payment_intent.succeeded":
            _handle_payment_intent_succeeded(data)

        elif event_type == "payment_intent.payment_failed":
            _handle_payment_intent_failed(data)

        elif event_type == "payment_method.detached":
            _handle_payment_method_detached(data)

        elif event_type == "customer.deleted":
            _handle_customer_deleted(data)

        else:
            logger.debug("StripeWebhook — unhandled event type: %s", event_type)

        # Always return 200 — Stripe retries on non-2xx for up to 3 days
        return HttpResponse(status=200)


# ─────────────────────────────────────────────────────────────────────────────
# Handlers
# ─────────────────────────────────────────────────────────────────────────────

def _handle_payment_intent_succeeded(intent: dict):
    """
    Fired when a PaymentIntent succeeds — including after 3D Secure.

    Your view already handles the immediate success case (status="succeeded"
    returned synchronously). This handler covers the async case where the
    card required 3DS and the view got status="requires_action" instead.

    We identify the subscription via intent metadata["subscription_id"]
    which your view and renewal task both set on every PaymentIntent.create().
    If the subscription is already ACTIVE we skip (view handled it).
    """
    from subscriptions.models import VendorSubscription, PaymentRecord
    from subscriptions.utils import period_end_from_cycle
    from subscriptions.tasks import send_payment_confirmation_email
    from notifications.models import Notification

    intent_id       = intent.get("id", "")
    metadata        = intent.get("metadata", {})
    subscription_id = metadata.get("subscription_id")
    payment_type    = metadata.get("type", "")        # "initial" | "renewal" | "plan_upgrade"
    plan_name       = metadata.get("plan", "")
    billing_cycle   = metadata.get("billing_cycle", "")
    amount_decimal  = intent.get("amount", 0) / 100   # pence → pounds

    logger.info(
        "_handle_payment_intent_succeeded | intent=%s | sub=%s | type=%s",
        intent_id, subscription_id, payment_type,
    )

    if not subscription_id:
        # Old intent without metadata (manual test charge etc.) — skip safely
        logger.info("_handle_payment_intent_succeeded — no subscription_id in metadata, skipping")
        return

    try:
        subscription = (
            VendorSubscription.objects
            .select_related("vendor", "plan")
            .get(id=subscription_id)
        )
    except VendorSubscription.DoesNotExist:
        logger.error(
            "_handle_payment_intent_succeeded — subscription not found: %s",
            subscription_id,
        )
        return

    # ── Already handled by the view (synchronous success path) ──
    if subscription.status == VendorSubscription.Status.ACTIVE:
        logger.info(
            "_handle_payment_intent_succeeded — already active, skipping | sub=%s",
            subscription_id,
        )
        return

    vendor = subscription.vendor

    # ── Resolve plan — use metadata plan_name if present, else current ──
    from subscriptions.models import SubscriptionPlan
    if plan_name:
        try:
            plan = SubscriptionPlan.objects.get(name=plan_name)
        except SubscriptionPlan.DoesNotExist:
            plan = subscription.plan
    else:
        plan = subscription.plan

    resolved_cycle = billing_cycle or subscription.billing_cycle

    from django.db import transaction
    from decimal import Decimal

    with transaction.atomic():
        subscription.status               = VendorSubscription.Status.ACTIVE
        subscription.plan                 = plan
        subscription.billing_cycle        = resolved_cycle
        subscription.stripe_last_intent_id = intent_id
        subscription.amount_paid          = Decimal(str(amount_decimal))
        subscription.current_period_start = timezone.now()
        subscription.current_period_end   = period_end_from_cycle(resolved_cycle)
        subscription.save(update_fields=[
            "status",
            "plan",
            "billing_cycle",
            "stripe_last_intent_id",
            "amount_paid",
            "current_period_start",
            "current_period_end",
        ])

        # ── Create PaymentRecord if not already present for this intent ──
        if not PaymentRecord.objects.filter(stripe_intent_id=intent_id).exists():
            pr_type = {
                "initial":      PaymentRecord.PaymentType.INITIAL,
                "renewal":      PaymentRecord.PaymentType.RENEWAL,
                "plan_upgrade": PaymentRecord.PaymentType.UPGRADE,
            }.get(payment_type, PaymentRecord.PaymentType.INITIAL)

            PaymentRecord.objects.create(
                subscription     = subscription,
                vendor           = vendor,
                plan             = plan,
                payment_type     = pr_type,
                amount           = Decimal(str(amount_decimal)),
                currency         = subscription.currency,
                stripe_intent_id = intent_id,
                billing_cycle    = resolved_cycle,
            )

    Notification.objects.create(
        recipient         = vendor,
        notification_type = Notification.NotificationType.SUBSCRIPTION_ACTIVATED,
        title             = f"{plan.get_name_display()} plan activated",
        message           = (
            f"Your {plan.get_name_display()} plan is now active. "
            f"Next billing date: {subscription.current_period_end.strftime('%d %b %Y')}."
        ),
        channel    = Notification.Channel.BOTH,
        action_url = "/settings/subscription",
    )

    send_payment_confirmation_email.delay(str(vendor.id))

    logger.info(
        "_handle_payment_intent_succeeded — DONE | vendor=%s | plan=%s",
        vendor.email, plan.name,
    )


def _handle_payment_intent_failed(intent: dict):
    """
    Fired when a PaymentIntent charge fails (declined, insufficient funds, etc.).
    Marks the subscription past_due and notifies the vendor.
    Only acts on intents that have a subscription_id in metadata.
    """
    from subscriptions.models import VendorSubscription
    from notifications.models import Notification

    metadata        = intent.get("metadata", {})
    subscription_id = metadata.get("subscription_id")
    intent_id       = intent.get("id", "")
    failure_message = (
        intent.get("last_payment_error", {}) or {}
    ).get("message", "Unknown error")

    logger.warning(
        "_handle_payment_intent_failed | intent=%s | sub=%s | reason=%s",
        intent_id, subscription_id, failure_message,
    )

    if not subscription_id:
        return

    try:
        subscription = VendorSubscription.objects.select_related("vendor").get(
            id=subscription_id
        )
    except VendorSubscription.DoesNotExist:
        logger.error(
            "_handle_payment_intent_failed — subscription not found: %s",
            subscription_id,
        )
        return

    if subscription.status == VendorSubscription.Status.PAST_DUE:
        return  # Already handled

    subscription.status = VendorSubscription.Status.PAST_DUE
    subscription.save(update_fields=["status"])

    Notification.objects.create(
        recipient         = subscription.vendor,
        notification_type = Notification.NotificationType.SUBSCRIPTION_EXPIRED,
        title             = "Payment failed",
        message           = (
            "We couldn't process your subscription payment. "
            "Please update your payment method to keep access."
        ),
        channel    = Notification.Channel.BOTH,
        action_url = "/settings/subscription/activate",
    )

    logger.info(
        "_handle_payment_intent_failed — marked past_due | vendor=%s",
        subscription.vendor.email,
    )


def _handle_payment_method_detached(payment_method: dict):
    """
    Fired when a PaymentMethod is detached from a customer
    (e.g. vendor deletes their card in Stripe dashboard).
    Clears the saved PM ID so the vendor is prompted to add a new one
    before the next renewal attempt.
    """
    from subscriptions.models import VendorSubscription

    pm_id = payment_method.get("id", "")

    logger.info("_handle_payment_method_detached | pm=%s", pm_id)

    updated = VendorSubscription.objects.filter(
        stripe_payment_method_id=pm_id,
    ).update(stripe_payment_method_id="")

    logger.info(
        "_handle_payment_method_detached — cleared from %d subscription(s)", updated
    )


def _handle_customer_deleted(customer: dict):
    """
    Fired when a Stripe Customer object is deleted.
    Clears stripe_customer_id and stripe_payment_method_id so the
    vendor is treated as a new customer on next payment.
    """
    from subscriptions.models import VendorSubscription

    customer_id = customer.get("id", "")

    logger.info("_handle_customer_deleted | customer=%s", customer_id)

    updated = VendorSubscription.objects.filter(
        stripe_customer_id=customer_id,
    ).update(
        stripe_customer_id="",
        stripe_payment_method_id="",
    )

    logger.info(
        "_handle_customer_deleted — cleared from %d subscription(s)", updated
    )