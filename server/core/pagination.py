"""
apps/core/pagination.py
=======================
Shared pagination classes used as the default across all viewsets.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Default pagination for all list endpoints.
    Returns a consistent envelope with count, next, previous and results.
    """

    page_size              = 20
    page_size_query_param  = "page_size"
    max_page_size          = 100
    page_query_param       = "page"

    def get_paginated_response(self, data):
        return Response({
            "count":    self.page.paginator.count,
            "next":     self.get_next_link(),
            "previous": self.get_previous_link(),
            "results":  data,
        })

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "count":    {"type": "integer"},
                "next":     {"type": "string",  "nullable": True},
                "previous": {"type": "string",  "nullable": True},
                "results":  schema,
            },
        }


class LargeResultsPagination(PageNumberPagination):
    """
    Used for endpoints that need to return more items per page,
    e.g. geography dropdowns, product lists in storekeeper.
    """

    page_size              = 100
    page_size_query_param  = "page_size"
    max_page_size          = 500