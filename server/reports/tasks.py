# reports/tasks.py

import io
import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.contrib.auth import get_user_model
from django.utils import timezone

logger = get_task_logger(__name__)
User   = get_user_model()


def _get_first_name(user) -> str:
    try:
        name = user.vendor_profile.first_name
        if name:
            return name
    except AttributeError:
        pass
    return user.email.split("@")[0]


@shared_task(
    bind                = True,
    max_retries         = 3,
    default_retry_delay = 15,
    name                = "reports.generate_report",
)
def generate_report(self, report_id: str):
    """
    Generates a PDF report for the given Report record.

    Steps:
      1. Load the Report record and mark it as generating.
      2. Query all Sale rows for the vendor in the report period.
      3. Build the PDF using ReportLab.
      4. Upload the PDF to Cloudinary.
      5. Mark the report as ready and save the URL + file size.
      6. Notify the vendor.

    Retries up to 3 times with 15-second gaps on failure.
    On final failure marks the report as failed.
    """

    logger.info("generate_report — START | report_id=%s", report_id)

    from reports.models import Report
    try:
        report = Report.objects.select_related("vendor").get(id=report_id)
    except Report.DoesNotExist:
        logger.error("generate_report — report not found: %s", report_id)
        return

    # ── Mark as generating ──
    report.status = Report.Status.GENERATING
    report.save(update_fields=["status"])

    vendor = report.vendor

    try:
        # ── Step 1: Query sales for the period ──
        from sales.models import Sale
        from django.db.models import Sum, Count

        sales = (
            Sale.objects
            .filter(
                vendor           = vendor,
                sold_at__date__gte = report.period_start,
                sold_at__date__lte = report.period_end,
            )
            .select_related("product")
            .order_by("sold_at")
        )

        totals = sales.aggregate(
            total_revenue = Sum("line_total"),
            total_orders  = Count("cart", distinct=True),
            total_units   = Sum("quantity"),
        )

        # ── Top products for this period ──
        top_products = (
            sales
            .values("product_name")
            .annotate(
                units   = Sum("quantity"),
                revenue = Sum("line_total"),
            )
            .order_by("-revenue")[:10]
        )

        # ── Payment method breakdown ──
        payment_breakdown = (
            sales
            .values("payment_method")
            .annotate(
                count   = Count("id"),
                revenue = Sum("line_total"),
            )
            .order_by("-revenue")
        )

        # ── Step 2: Build PDF with ReportLab ──
        buffer = io.BytesIO()
        _build_pdf(
            buffer           = buffer,
            report           = report,
            vendor           = vendor,
            sales            = sales,
            totals           = totals,
            top_products     = top_products,
            payment_breakdown = payment_breakdown,
        )
        buffer.seek(0)

        pdf_size_kb = round(buffer.getbuffer().nbytes / 1024, 1)

        # ── Step 3: Upload to Cloudinary ──
        try:
            import os
            from django.conf import settings

            filename = (
                f"{vendor.id}_{report.report_type}_"
                f"{report.period_start}_{report.period_end}.pdf"
            )
            save_dir = os.path.join(settings.MEDIA_ROOT, "reports", str(vendor.id))
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, filename)

            with open(save_path, "wb") as f:
                f.write(buffer.read())

            file_url = f"/media/reports/{vendor.id}/{filename}"

        except Exception as exc:
            logger.error(
                "generate_report — Cloudinary upload failed | report=%s | error=%s",
                report_id,
                str(exc),
            )
            raise self.retry(exc=exc)

        # ── Step 4: Mark as ready ──
        report.status       = Report.Status.READY
        report.file_url     = file_url
        report.file_size_kb = pdf_size_kb
        report.generated_at = timezone.now()
        report.error_detail = ""
        report.save(update_fields=[
            "status", "file_url", "file_size_kb",
            "generated_at", "error_detail",
        ])

        logger.info(
            "generate_report — READY | report=%s | size=%skb | vendor=%s",
            report_id,
            pdf_size_kb,
            vendor.email,
        )

        # ── Step 5: Notify vendor ──
        from notifications.models import Notification
        Notification.objects.create(
            recipient           = vendor,
            notification_type   = Notification.NotificationType.SYSTEM,
            title               = (
                f"{report.get_report_type_display()} report ready"
            ),
            message             = (
                f"Your {report.get_report_type_display().lower()} report "
                f"for {report.period_start} to {report.period_end} "
                f"is ready to download."
            ),
            channel             = Notification.Channel.IN_APP,
            related_object_type = "Report",
            related_object_id   = report.id,
            action_url          = f"/dashboard/reports/{report.id}/download",
        )

    except Exception as exc:
        # ── All retries exhausted ──
        if self.request.retries >= self.max_retries:
            logger.error(
                "generate_report — FAILED after %d retries | report=%s | error=%s",
                self.max_retries,
                report_id,
                str(exc),
            )
            report.status       = Report.Status.FAILED
            report.error_detail = str(exc)
            report.save(update_fields=["status", "error_detail"])

            from notifications.models import Notification
            Notification.objects.create(
                recipient           = vendor,
                notification_type   = Notification.NotificationType.SYSTEM,
                title               = "Report generation failed",
                message             = (
                    f"We could not generate your "
                    f"{report.get_report_type_display().lower()} report. "
                    f"Please try again or contact support."
                ),
                channel             = Notification.Channel.IN_APP,
                related_object_type = "Report",
                related_object_id   = report.id,
                action_url          = f"/reports",
            )
        raise


@shared_task(name="reports.auto_generate_monthly_reports")
def auto_generate_monthly_reports():
    """
    Automatically generates monthly reports for all vendors
    on Pro and Enterprise plans.
    Scheduled to run on the first day of each month via Celery Beat.
    """
    logger.info("auto_generate_monthly_reports — START")

    from reports.models import Report
    from subscriptions.models import VendorSubscription

    today        = timezone.now().date()
    last_month   = (today.replace(day=1) - timezone.timedelta(days=1))
    period_start = last_month.replace(day=1)
    period_end   = last_month

    # ── Find all vendors with report access ──
    eligible_vendors = (
        VendorSubscription.objects
        .select_related("vendor", "plan")
        .filter(
            status              = VendorSubscription.Status.ACTIVE,
            plan__has_reports   = True,
        )
        .values_list("vendor", flat=True)
    )

    queued = 0

    for vendor_id in eligible_vendors:
        # ── Skip if already generated ──
        already_exists = Report.objects.filter(
            vendor__id   = vendor_id,
            report_type  = Report.ReportType.MONTHLY,
            period_start = period_start,
        ).exists()

        if already_exists:
            continue

        report = Report.objects.create(
            vendor_id    = vendor_id,
            report_type  = Report.ReportType.MONTHLY,
            period_start = period_start,
            period_end   = period_end,
            status       = Report.Status.PENDING,
        )

        generate_report.delay(str(report.id))
        queued += 1

    logger.info(
        "auto_generate_monthly_reports — DONE | queued=%d", queued
    )
    return {"queued": queued}


# ─────────────────────────────────────────────────────────────────────────────
# PDF Builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_pdf(buffer, report, vendor, sales, totals, top_products, payment_breakdown):
    """
    Builds the PDF report using ReportLab and writes it to the buffer.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        HRFlowable,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

    # ── Palette ──
    GREEN  = colors.HexColor("#0F6E56")
    GOLD   = colors.HexColor("#C9A84C")
    DARK   = colors.HexColor("#1A1A1A")
    MUTED  = colors.HexColor("#7A7A7A")
    LIGHT  = colors.HexColor("#F4F4F0")
    WHITE  = colors.white

    W, H = A4
    doc  = SimpleDocTemplate(
        buffer,
        pagesize     = A4,
        rightMargin  = 20 * mm,
        leftMargin   = 20 * mm,
        topMargin    = 18 * mm,
        bottomMargin = 18 * mm,
    )

    styles  = getSampleStyleSheet()
    story   = []

    # ── Custom styles ──
    title_style = ParagraphStyle(
        "title",
        parent    = styles["Normal"],
        fontSize  = 22,
        textColor = GREEN,
        fontName  = "Helvetica-Bold",
        spaceAfter = 4,
    )
    sub_style = ParagraphStyle(
        "sub",
        parent    = styles["Normal"],
        fontSize  = 10,
        textColor = MUTED,
        spaceAfter = 2,
    )
    section_style = ParagraphStyle(
        "section",
        parent    = styles["Normal"],
        fontSize  = 12,
        textColor = GREEN,
        fontName  = "Helvetica-Bold",
        spaceBefore = 12,
        spaceAfter  = 6,
    )
    body_style = ParagraphStyle(
        "body",
        parent    = styles["Normal"],
        fontSize  = 9,
        textColor = DARK,
        spaceAfter = 3,
    )
    muted_style = ParagraphStyle(
        "muted",
        parent    = styles["Normal"],
        fontSize  = 8,
        textColor = MUTED,
    )

    # ── Header ──
    vendor_profile = getattr(vendor, "vendor_profile", None)
    business_name  = (
        vendor_profile.business_name
        if vendor_profile and vendor_profile.business_name
        else vendor.email
    )

    story.append(Paragraph("StockSense", title_style))
    story.append(Paragraph(
        f"{report.get_report_type_display()} Report — {business_name}",
        sub_style,
    ))
    story.append(Paragraph(
        f"Period: {report.period_start.strftime('%d %b %Y')} "
        f"to {report.period_end.strftime('%d %b %Y')}",
        sub_style,
    ))
    story.append(Paragraph(
        f"Generated: {timezone.now().strftime('%d %b %Y at %H:%M')}",
        muted_style,
    ))
    story.append(HRFlowable(
        width="100%",
        thickness=2,
        color=GREEN,
        spaceAfter=12,
    ))

    # ── Summary stats ──
    story.append(Paragraph("Summary", section_style))

    total_revenue = totals["total_revenue"] or 0
    total_orders  = totals["total_orders"]  or 0
    total_units   = totals["total_units"]   or 0

    summary_data = [
        ["Metric",          "Value"],
        ["Total Revenue",   f"£{total_revenue:,.2f}"],
        ["Total Orders",    str(total_orders)],
        ["Units Sold",      str(total_units)],
        ["Avg Order Value", f"£{float(total_revenue) / max(total_orders, 1):,.2f}"],
    ]

    summary_table = Table(
        summary_data,
        colWidths = [90 * mm, 70 * mm],
    )
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  GREEN),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  10),
        ("BACKGROUND",   (0, 1), (-1, -1), LIGHT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("FONTSIZE",     (0, 1), (-1, -1), 9),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)

    # ── Top products ──
    story.append(Paragraph("Top Products", section_style))

    if top_products:
        prod_data = [["Product", "Units Sold", "Revenue"]]
        for p in top_products:
            prod_data.append([
                Paragraph(p["product_name"][:50], body_style),
                str(p["units"] or 0),
                f"£{float(p['revenue'] or 0):,.2f}",
            ])

        prod_table = Table(
            prod_data,
            colWidths = [100 * mm, 35 * mm, 45 * mm],
        )
        prod_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  GREEN),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
            ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0),  9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("FONTSIZE",     (0, 1), (-1, -1), 8),
            ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("ALIGN",        (1, 0), (-1, -1), "CENTER"),
        ]))
        story.append(prod_table)
    else:
        story.append(Paragraph("No sales in this period.", muted_style))

    # ── Payment breakdown ──
    story.append(Paragraph("Payment Methods", section_style))

    if payment_breakdown:
        pay_data = [["Method", "Transactions", "Revenue"]]
        for p in payment_breakdown:
            pay_data.append([
                p["payment_method"].capitalize(),
                str(p["count"]),
                f"£{float(p['revenue'] or 0):,.2f}",
            ])

        pay_table = Table(
            pay_data,
            colWidths = [70 * mm, 50 * mm, 60 * mm],
        )
        pay_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  GREEN),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
            ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0),  9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("FONTSIZE",     (0, 1), (-1, -1), 8),
            ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 8),
            ("ALIGN",        (1, 0), (-1, -1), "CENTER"),
        ]))
        story.append(pay_table)

    # ── Sales transaction list ──
    story.append(Paragraph("All Transactions", section_style))

    if sales.exists():
        tx_data = [["Date", "Product", "Qty", "Unit Price", "Total", "Method"]]
        for sale in sales[:200]:   # cap at 200 rows to keep PDF manageable
            tx_data.append([
                sale.sold_at.strftime("%d/%m/%y %H:%M"),
                Paragraph(sale.product_name[:35], body_style),
                str(sale.quantity),
                f"£{float(sale.unit_price):,.2f}",
                f"£{float(sale.line_total):,.2f}",
                sale.payment_method.capitalize(),
            ])

        tx_table = Table(
            tx_data,
            colWidths = [28 * mm, 55 * mm, 12 * mm, 25 * mm, 25 * mm, 20 * mm],
            repeatRows = 1,
        )
        tx_table.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  GREEN),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
            ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0),  8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
            ("FONTSIZE",     (0, 1), (-1, -1), 7),
            ("GRID",         (0, 0), (-1, -1), 0.2, colors.HexColor("#DDDDDD")),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",  (0, 0), (-1, -1), 5),
            ("ALIGN",        (2, 0), (-1, -1), "CENTER"),
        ]))
        story.append(tx_table)

        if sales.count() > 200:
            story.append(Spacer(1, 6))
            story.append(Paragraph(
                f"Showing 200 of {sales.count()} transactions. "
                f"Download the full dataset from your dashboard.",
                muted_style,
            ))
    else:
        story.append(Paragraph("No transactions in this period.", muted_style))

    # ── Footer ──
    story.append(Spacer(1, 12))
    story.append(HRFlowable(
        width="100%",
        thickness=0.5,
        color=MUTED,
        spaceAfter=6,
    ))
    story.append(Paragraph(
        f"StockSense  ·  Generated for {business_name}  ·  "
        f"stocksense.app",
        muted_style,
    ))

    doc.build(story)