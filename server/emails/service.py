# emails/service.py

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralised email sending service for the entire platform.

    All Celery tasks across every app route through this class.
    Uses Django's configured EMAIL_BACKEND — no third-party
    libraries required.

    In development  (DEBUG=True)  → console backend, prints to terminal
    In production   (DEBUG=False) → SMTP backend, sends real emails

    Template convention:
      HTML:  templates/emails/{template}.html
      Text:  templates/emails/{template}.txt  (auto-stripped if absent)

    Usage:
        from emails.service import EmailService

        EmailService.send(
            to       = "vendor@example.com",
            template = "verification/verify_email",
            context  = {"verify_url": "...", "first_name": "Ada"},
            subject  = "Verify your StockSense account",
        )
    """

    SUBJECT_PREFIX = "[StockSense] "

    # ── FROM_EMAIL removed as a class attribute ──
    # It is now read from settings lazily inside each method
    # so it always reflects the current settings value and
    # never causes import-time errors.

    @classmethod
    def send(
        cls,
        to:         str | list[str],
        template:   str,
        context:    dict,
        subject:    str,
        from_email: str | None = None,
        reply_to:   str | None = None,
        cc:         list[str]  = None,
        bcc:        list[str]  = None,
    ) -> bool:
        """
        Render an HTML email template and send it via Django's
        EMAIL_BACKEND (SMTP in production, console in development).

        Args:
            to:         Recipient email or list of emails.
            template:   Path relative to templates/emails/
                        e.g. "verification/verify_email"
            context:    Template context dict.
            subject:    Subject line (platform prefix added automatically).
            from_email: Override sender (defaults to DEFAULT_FROM_EMAIL).
            reply_to:   Optional reply-to address.
            cc:         Optional CC list.
            bcc:        Optional BCC list.

        Returns:
            True on success.

        Raises:
            Exception: Re-raises on failure so the Celery task
                       can catch it and trigger a retry.
        """

        recipients   = [to] if isinstance(to, str) else to
        full_subject = f"{cls.SUBJECT_PREFIX}{subject}"

        # ── Read sender lazily so it always reflects current settings ──
        sender = from_email or settings.DEFAULT_FROM_EMAIL

        # ── Render templates ──
        html_content = cls._render_html(template, context)
        text_content = cls._render_text(template, context, html_content)

        # ── Build message ──
        msg = EmailMultiAlternatives(
            subject    = full_subject,
            body       = text_content,
            from_email = sender,
            to         = recipients,
            cc         = cc  or [],
            bcc        = bcc or [],
            reply_to   = [reply_to] if reply_to else [],
        )
        msg.attach_alternative(html_content, "text/html")

        # ── Send via Django's configured EMAIL_BACKEND ──
        try:
            msg.send(fail_silently=False)
            logger.info(
                "EmailService.send — OK | to=%s | subject=%s",
                recipients,
                full_subject,
            )
            return True

        except Exception as exc:
            logger.error(
                "EmailService.send — FAILED | to=%s | subject=%s | error=%s",
                recipients,
                full_subject,
                str(exc),
            )
            raise

    # ─────────────────────────────────────────────────────────────────────────
    # Bulk send
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    def send_bulk(
        cls,
        recipients: list[dict],
        template:   str,
        subject:    str,
    ) -> dict:
        """
        Send the same template to multiple recipients, each with their
        own personalised context.

        Opens a single SMTP connection and reuses it for the entire
        batch — much faster than opening a new connection per email.
        Critical when notifying many admins or vendors at once.

        Each item in recipients must be:
            {"to": "email@example.com", "context": { ... }}

        Individual failures are logged and collected but do not abort
        the rest of the batch.

        Returns:
            {"sent": int, "failed": int, "errors": list}
        """

        sent         = 0
        failed       = 0
        errors       = []
        full_subject = f"{cls.SUBJECT_PREFIX}{subject}"
        sender       = settings.DEFAULT_FROM_EMAIL

        # ── Open one SMTP connection for the entire batch ──
        connection = get_connection(fail_silently=False)

        try:
            connection.open()

            for item in recipients:
                to      = item["to"]
                context = item.get("context", {})

                try:
                    html_content = cls._render_html(template, context)
                    text_content = cls._render_text(template, context, html_content)

                    msg = EmailMultiAlternatives(
                        subject    = full_subject,
                        body       = text_content,
                        from_email = sender,
                        to         = [to],
                        connection = connection,
                    )
                    msg.attach_alternative(html_content, "text/html")
                    msg.send(fail_silently=False)

                    sent += 1
                    logger.info(
                        "EmailService.send_bulk — sent | to=%s", to
                    )

                except Exception as exc:
                    failed += 1
                    errors.append({"to": to, "error": str(exc)})
                    logger.error(
                        "EmailService.send_bulk — failed | to=%s | error=%s",
                        to,
                        str(exc),
                    )

        finally:
            connection.close()

        logger.info(
            "EmailService.send_bulk — done | sent=%d failed=%d | template=%s",
            sent,
            failed,
            template,
        )

        return {"sent": sent, "failed": failed, "errors": errors}

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    def _render_html(cls, template: str, context: dict) -> str:
        full_context = {**cls._base_context(), **context}
        return render_to_string(
            f"emails/{template}.html",
            full_context,
        )

    @classmethod
    def _render_text(cls, template: str, context: dict, html: str) -> str:
        try:
            full_context = {**cls._base_context(), **context}
            return render_to_string(
                f"emails/{template}.txt",
                full_context,
            )
        except Exception:
            return strip_tags(html)

    @classmethod
    def _base_context(cls) -> dict:
        frontend_base = getattr(
            settings, "FRONTEND_BASE_URL", "https://stocksense.app"
        )
        return {
            "platform_name":   "StockSense",
            "platform_url":    frontend_base,
            "support_email":   "support@stocksense.app",
            "logo_url":        f"{frontend_base}/static/images/logo.png",
            "current_year":    __import__("datetime").date.today().year,
            "unsubscribe_url": f"{frontend_base}/notifications/settings",
        }