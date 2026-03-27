"""
apps/core/exceptions.py
=======================
Custom exception handler that returns a consistent JSON
error shape across every endpoint in the project.

Response shape:
{
    "success": false,
    "message": "A human-readable summary",
    "errors":  { "field": ["detail"] }   // only on validation errors
}
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    message = "An error occurred."
    errors  = None

    if isinstance(response.data, dict):
        # Validation errors come back as {"field": ["msg"]}
        if "detail" in response.data:
            message = str(response.data["detail"])
        else:
            message = "Validation failed."
            errors  = response.data
    elif isinstance(response.data, list):
        message = response.data[0] if response.data else message

    response.data = {
        "success": False,
        "message": message,
    }
    if errors:
        response.data["errors"] = errors

    return response