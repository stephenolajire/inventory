"""
apps/reports/serializers.py
============================
Report serializers.
PDF generation is handled by the Celery task — the API
only manages the Report record lifecycle.
"""

from rest_framework import serializers

from .models import Report


class ReportListSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/reports/
    One row per report with download link and status badge.
    """

    class Meta:
        model  = Report
        fields = [
            "id",
            "report_type",
            "period_start",
            "period_end",
            "status",
            "file_url",
            "file_size_kb",
            "generated_at",
        ]


class ReportDetailSerializer(serializers.ModelSerializer):
    """
    Used in: GET /api/reports/{id}/
    """

    class Meta:
        model  = Report
        fields = [
            "id",
            "report_type",
            "period_start",
            "period_end",
            "status",
            "file_url",
            "file_size_kb",
            "generated_at",
            "error_detail",
            "created_at",
        ]


class GenerateReportSerializer(serializers.Serializer):
    """
    Used in: POST /api/reports/generate/
    Creates a Report record with status=pending and
    queues the generate_report Celery task.
    """

    report_type  = serializers.ChoiceField(choices=Report.ReportType.choices)
    period_start = serializers.DateField()
    period_end   = serializers.DateField()

    def validate(self, attrs: dict) -> dict:
        if attrs["period_end"] < attrs["period_start"]:
            raise serializers.ValidationError({
                "period_end": "End date must be after start date."
            })
        return attrs