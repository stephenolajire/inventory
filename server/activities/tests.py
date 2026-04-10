"""
apps/activities/tests.py
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Activity
from .utils import log_activity

User = get_user_model()


class ActivityModelTestCase(TestCase):
    """Test cases for Activity model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )

    def test_create_activity(self):
        """Test creating an activity."""
        activity = Activity.objects.create(
            user=self.user,
            action_type=Activity.ActionType.LOGIN,
            description="User logged in",
        )

        self.assertEqual(activity.user, self.user)
        self.assertEqual(activity.action_type, Activity.ActionType.LOGIN)
        self.assertEqual(activity.description, "User logged in")

    def test_activity_with_metadata(self):
        """Test creating activity with metadata."""
        metadata = {"ip": "192.168.1.1", "browser": "Chrome"}
        activity = Activity.objects.create(
            user=self.user,
            action_type=Activity.ActionType.LOGIN,
            description="User logged in",
            metadata=metadata,
        )

        self.assertEqual(activity.metadata, metadata)

    def test_activity_string_representation(self):
        """Test activity __str__ method."""
        activity = Activity.objects.create(
            user=self.user,
            action_type=Activity.ActionType.LOGIN,
            description="User logged in",
        )

        self.assertIn(self.user.email, str(activity))
        self.assertIn("Logged In", str(activity))


class ActivityUtilsTestCase(TestCase):
    """Test cases for activity logging utilities."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )

    def test_log_activity_basic(self):
        """Test basic activity logging."""
        activity = log_activity(
            user=self.user,
            action_type=Activity.ActionType.LOGIN,
            description="Test login",
        )

        self.assertIsNotNone(activity)
        self.assertEqual(activity.user, self.user)
        self.assertEqual(activity.action_type, Activity.ActionType.LOGIN)

    def test_log_activity_with_metadata(self):
        """Test activity logging with metadata."""
        metadata = {"test_key": "test_value"}
        activity = log_activity(
            user=self.user,
            action_type=Activity.ActionType.CREATE,
            description="Create test",
            metadata=metadata,
        )

        self.assertEqual(activity.metadata, metadata)

    def test_log_activity_with_invalid_action_type(self):
        """Test logging with invalid action type."""
        # This should raise ValidationError on save
        activity = Activity(
            user=self.user,
            action_type="invalid_action",
            description="Test",
        )

        with self.assertRaises(Exception):
            activity.full_clean()


class ActivityAPITestCase(APITestCase):
    """Test cases for Activity API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )

        # Create some test activities
        for i in range(5):
            Activity.objects.create(
                user=self.user,
                action_type=Activity.ActionType.LOGIN if i % 2 == 0 else Activity.ActionType.LOGOUT,
                description=f"Test activity {i}",
            )

        # Get tokens
        self.user_token = RefreshToken.for_user(self.user).access_token
        self.admin_token = RefreshToken.for_user(self.admin).access_token

    def test_list_activities_authenticated(self):
        """Test listing activities as authenticated user."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        response = self.client.get("/api/activities/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 5)

    def test_list_activities_unauthenticated(self):
        """Test listing activities without authentication."""
        response = self.client.get("/api/activities/")

        self.assertEqual(response.status_code, 401)

    def test_my_activities_endpoint(self):
        """Test my_activities endpoint."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        response = self.client.get("/api/activities/my_activities/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 5)

    def test_action_types_endpoint(self):
        """Test action_types endpoint."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        response = self.client.get("/api/activities/action_types/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

    def test_filter_by_action_type(self):
        """Test filtering activities by action type."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        response = self.client.get(
            f"/api/activities/by_action_type/?action_type={Activity.ActionType.LOGIN}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data["results"]), 0)

    def test_statistics_admin_only(self):
        """Test statistics endpoint is admin only."""
        # Non-admin user
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        response = self.client.get("/api/activities/statistics/")
        self.assertEqual(response.status_code, 403)

        # Admin user
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        response = self.client.get("/api/activities/statistics/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("total_activities", response.data)

    def test_cannot_delete_activity(self):
        """Test that activities cannot be deleted."""
        activity = Activity.objects.first()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        response = self.client.delete(f"/api/activities/{activity.id}/")

        self.assertEqual(response.status_code, 405)

        # Activity should still exist
        self.assertTrue(Activity.objects.filter(id=activity.id).exists())
