# geography/views.py

import logging

from rest_framework import status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsAdmin
from core.pagination import LargeResultsPagination

from .models import Country, State, LGA
from .serializers import (
    CountryListSerializer,
    StateListSerializer,
    LGAListSerializer,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Country ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class CountryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Public read-only endpoint for countries.
    Used by vendor registration and profile dropdowns.

    GET  /api/geography/countries/       — list all active countries
    GET  /api/geography/countries/{id}/  — single country
    """

    permission_classes = [AllowAny]
    serializer_class   = CountryListSerializer
    pagination_class   = LargeResultsPagination

    def get_queryset(self):
        return Country.objects.filter(
            is_active=True
        ).order_by("name")

    @extend_schema(
        summary="List all active countries",
        responses={200: CountryListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs         = self.get_queryset()
        serializer = CountryListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Get single country",
        responses={200: CountryListSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        country    = self.get_object()
        serializer = CountryListSerializer(country)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# State ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class StateViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Public read-only endpoint for states.
    Filter by country_id for cascading dropdown behaviour.

    GET  /api/geography/states/          — list all states
    GET  /api/geography/states/{id}/     — single state
    GET  /api/geography/states/?country={id} — states for a country
    """

    permission_classes = [AllowAny]
    serializer_class   = StateListSerializer
    pagination_class   = LargeResultsPagination

    def get_queryset(self):
        qs = State.objects.select_related("country").order_by("name")

        country_id = self.request.query_params.get("country")
        search     = self.request.query_params.get("search")

        if country_id:
            qs = qs.filter(country__id=country_id)
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    @extend_schema(
        summary="List states — optionally filtered by country",
        parameters=[
            OpenApiParameter(
                "country",
                description="Filter by country ID",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                "search",
                description="Search by state name",
                required=False,
                type=str,
            ),
        ],
        responses={200: StateListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs         = self.get_queryset()
        serializer = StateListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Get single state",
        responses={200: StateListSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        state      = self.get_object()
        serializer = StateListSerializer(state)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Get all LGAs for a specific state",
        responses={200: LGAListSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="lgas")
    def lgas(self, request, pk=None):
        """
        Convenience endpoint — returns all LGAs for a state
        without needing to call /api/geography/lgas/?state={id}.
        Used by the cascading dropdown: when a state is selected
        this endpoint is called immediately to populate the LGA dropdown.
        """
        state = self.get_object()
        lgas  = LGA.objects.filter(state=state).order_by("name")

        serializer = LGAListSerializer(lgas, many=True)
        return Response(
            {
                "success": True,
                "state":   StateListSerializer(state).data,
                "count":   lgas.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# LGA ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class LGAViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """
    Public read-only endpoint for LGAs.
    Filter by state_id for cascading dropdown behaviour.

    GET  /api/geography/lgas/            — list all LGAs
    GET  /api/geography/lgas/{id}/       — single LGA
    GET  /api/geography/lgas/?state={id} — LGAs for a state
    """

    permission_classes = [AllowAny]
    serializer_class   = LGAListSerializer
    pagination_class   = LargeResultsPagination

    def get_queryset(self):
        qs = LGA.objects.select_related("state", "state__country").order_by("name")

        state_id = self.request.query_params.get("state")
        search   = self.request.query_params.get("search")

        if state_id:
            qs = qs.filter(state__id=state_id)
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    @extend_schema(
        summary="List LGAs — optionally filtered by state",
        parameters=[
            OpenApiParameter(
                "state",
                description="Filter by state ID",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                "search",
                description="Search by LGA name",
                required=False,
                type=str,
            ),
        ],
        responses={200: LGAListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        qs         = self.get_queryset()
        serializer = LGAListSerializer(qs, many=True)
        return Response(
            {
                "success": True,
                "count":   qs.count(),
                "data":    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Get single LGA",
        responses={200: LGAListSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        lga        = self.get_object()
        serializer = LGAListSerializer(lga)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Admin Geography ViewSet
# ─────────────────────────────────────────────────────────────────────────────

class AdminGeographyViewSet(GenericViewSet):
    """
    Admin-only endpoints for managing geography data.

    POST   /api/geography/admin/countries/           — add country
    POST   /api/geography/admin/states/              — add state
    POST   /api/geography/admin/lgas/                — add LGA
    PATCH  /api/geography/admin/countries/{id}/      — update country
    PATCH  /api/geography/admin/states/{id}/         — update state
    PATCH  /api/geography/admin/lgas/{id}/           — update LGA
    POST   /api/geography/admin/countries/{id}/toggle/ — activate/deactivate
    GET    /api/geography/admin/stats/               — geography stats
    """

    permission_classes = [IsAdmin]

    # ── Add country ──

    @extend_schema(
        summary="Add a new country (admin only)",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "name":            {"type": "string"},
                    "code":            {"type": "string"},
                    "currency_code":   {"type": "string"},
                    "currency_symbol": {"type": "string"},
                },
                "required": ["name", "code"],
            }
        },
        responses={201: CountryListSerializer},
    )
    @action(detail=False, methods=["post"], url_path="countries")
    def add_country(self, request):
        name            = request.data.get("name", "").strip()
        code            = request.data.get("code", "").strip().upper()
        currency_code   = request.data.get("currency_code", "").strip().upper()
        currency_symbol = request.data.get("currency_symbol", "").strip()

        if not name or not code:
            return Response(
                {
                    "success": False,
                    "message": "name and code are required.",
                    "errors": {
                        "name": ["Required."] if not name else [],
                        "code": ["Required."] if not code else [],
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Country.objects.filter(code=code).exists():
            return Response(
                {
                    "success": False,
                    "message": f"Country with code '{code}' already exists.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        country = Country.objects.create(
            name            = name,
            code            = code,
            currency_code   = currency_code   or "USD",
            currency_symbol = currency_symbol or "$",
            is_active       = True,
        )

        logger.info(
            "AdminGeographyViewSet.add_country — created | name=%s | admin=%s",
            country.name,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Country '{country.name}' added.",
                "data":    CountryListSerializer(country).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Add state ──

    @extend_schema(
        summary="Add a new state (admin only)",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "country_id": {"type": "string"},
                    "name":       {"type": "string"},
                    "code":       {"type": "string"},
                },
                "required": ["country_id", "name", "code"],
            }
        },
        responses={201: StateListSerializer},
    )
    @action(detail=False, methods=["post"], url_path="states")
    def add_state(self, request):
        country_id = request.data.get("country_id")
        name       = request.data.get("name", "").strip()
        code       = request.data.get("code", "").strip().upper()

        if not all([country_id, name, code]):
            return Response(
                {
                    "success": False,
                    "message": "country_id, name and code are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            country = Country.objects.get(id=country_id)
        except Country.DoesNotExist:
            return Response(
                {"success": False, "message": "Country not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if State.objects.filter(country=country, code=code).exists():
            return Response(
                {
                    "success": False,
                    "message": (
                        f"State with code '{code}' already exists "
                        f"in {country.name}."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        state = State.objects.create(
            country = country,
            name    = name,
            code    = code,
        )

        logger.info(
            "AdminGeographyViewSet.add_state — created | name=%s | country=%s | admin=%s",
            state.name,
            country.name,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"State '{state.name}' added to {country.name}.",
                "data":    StateListSerializer(state).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Add LGA ──

    @extend_schema(
        summary="Add a new LGA (admin only)",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "state_id": {"type": "string"},
                    "name":     {"type": "string"},
                },
                "required": ["state_id", "name"],
            }
        },
        responses={201: LGAListSerializer},
    )
    @action(detail=False, methods=["post"], url_path="lgas")
    def add_lga(self, request):
        state_id = request.data.get("state_id")
        name     = request.data.get("name", "").strip()

        if not state_id or not name:
            return Response(
                {
                    "success": False,
                    "message": "state_id and name are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            state = State.objects.select_related("country").get(id=state_id)
        except State.DoesNotExist:
            return Response(
                {"success": False, "message": "State not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if LGA.objects.filter(state=state, name__iexact=name).exists():
            return Response(
                {
                    "success": False,
                    "message": (
                        f"LGA '{name}' already exists in {state.name}."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        lga = LGA.objects.create(
            state = state,
            name  = name,
        )

        logger.info(
            "AdminGeographyViewSet.add_lga — created | name=%s | state=%s | admin=%s",
            lga.name,
            state.name,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"LGA '{lga.name}' added to {state.name}.",
                "data":    LGAListSerializer(lga).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Update country ──

    @extend_schema(
        summary="Update a country (admin only)",
        responses={200: CountryListSerializer},
    )
    @action(
        detail   = False,
        methods  = ["patch"],
        url_path = "countries/(?P<country_id>[^/.]+)",
    )
    def update_country(self, request, country_id=None):
        try:
            country = Country.objects.get(id=country_id)
        except Country.DoesNotExist:
            return Response(
                {"success": False, "message": "Country not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        for field in ["name", "currency_code", "currency_symbol"]:
            value = request.data.get(field)
            if value:
                setattr(country, field, value.strip())

        country.save()

        return Response(
            {
                "success": True,
                "message": f"Country '{country.name}' updated.",
                "data":    CountryListSerializer(country).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Update state ──

    @extend_schema(
        summary="Update a state (admin only)",
        responses={200: StateListSerializer},
    )
    @action(
        detail   = False,
        methods  = ["patch"],
        url_path = "states/(?P<state_id>[^/.]+)",
    )
    def update_state(self, request, state_id=None):
        try:
            state = State.objects.get(id=state_id)
        except State.DoesNotExist:
            return Response(
                {"success": False, "message": "State not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        for field in ["name", "code"]:
            value = request.data.get(field)
            if value:
                setattr(state, field, value.strip().upper() if field == "code" else value.strip())

        state.save()

        return Response(
            {
                "success": True,
                "message": f"State '{state.name}' updated.",
                "data":    StateListSerializer(state).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Update LGA ──

    @extend_schema(
        summary="Update an LGA (admin only)",
        responses={200: LGAListSerializer},
    )
    @action(
        detail   = False,
        methods  = ["patch"],
        url_path = "lgas/(?P<lga_id>[^/.]+)",
    )
    def update_lga(self, request, lga_id=None):
        try:
            lga = LGA.objects.get(id=lga_id)
        except LGA.DoesNotExist:
            return Response(
                {"success": False, "message": "LGA not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = request.data.get("name", "").strip()
        if name:
            lga.name = name
            lga.save(update_fields=["name"])

        return Response(
            {
                "success": True,
                "message": f"LGA '{lga.name}' updated.",
                "data":    LGAListSerializer(lga).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Toggle country active/inactive ──

    @extend_schema(
        summary="Toggle country active/inactive (admin only)",
        responses={200: CountryListSerializer},
    )
    @action(
        detail   = False,
        methods  = ["post"],
        url_path = "countries/(?P<country_id>[^/.]+)/toggle",
    )
    def toggle_country(self, request, country_id=None):
        try:
            country = Country.objects.get(id=country_id)
        except Country.DoesNotExist:
            return Response(
                {"success": False, "message": "Country not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        country.is_active = not country.is_active
        country.save(update_fields=["is_active"])

        state = "activated" if country.is_active else "deactivated"

        logger.info(
            "AdminGeographyViewSet.toggle_country — %s | country=%s | admin=%s",
            state,
            country.name,
            request.user.email,
        )

        return Response(
            {
                "success": True,
                "message": f"Country '{country.name}' {state}.",
                "data":    CountryListSerializer(country).data,
            },
            status=status.HTTP_200_OK,
        )

    # ── Geography stats ──

    @extend_schema(
        summary="Geography statistics (admin only)",
        responses={200: {"description": "Geography stats."}},
    )
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total_countries  = Country.objects.count()
        active_countries = Country.objects.filter(is_active=True).count()
        total_states     = State.objects.count()
        total_lgas       = LGA.objects.count()

        # ── States with most vendors ──
        from django.db.models import Count
        top_states = (
            State.objects
            .annotate(vendor_count=Count("vendors"))
            .order_by("-vendor_count")[:5]
            .values("name", "vendor_count")
        )

        # ── LGAs with most vendors ──
        top_lgas = (
            LGA.objects
            .annotate(vendor_count=Count("vendors"))
            .order_by("-vendor_count")[:5]
            .values("name", "state__name", "vendor_count")
        )

        return Response(
            {
                "success": True,
                "data": {
                    "total_countries":  total_countries,
                    "active_countries": active_countries,
                    "total_states":     total_states,
                    "total_lgas":       total_lgas,
                    "top_states_by_vendors": [
                        {
                            "state":         r["name"],
                            "vendor_count":  r["vendor_count"],
                        }
                        for r in top_states
                    ],
                    "top_lgas_by_vendors": [
                        {
                            "lga":          r["name"],
                            "state":        r["state__name"],
                            "vendor_count": r["vendor_count"],
                        }
                        for r in top_lgas
                    ],
                },
            },
            status=status.HTTP_200_OK,
        )