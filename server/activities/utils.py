"""
apps/activities/utils.py
==========================
Utility functions for logging activities across the application.

Usage in other apps:
    from activities.utils import log_activity

    # Log a simple activity
    log_activity(
        user=request.user,
        action_type="product_created",
        description="Created new product: Nike Shoes",
        content_object=product,
    )

    # Log activity with additional metadata
    log_activity(
        user=request.user,
        action_type="order_placed",
        description="Placed order #12345",
        content_object=order,
        metadata={
            "order_total": "10000.00",
            "payment_method": "card",
            "items_count": 5,
        },
        request=request,  # To capture IP and user agent
    )
"""

import logging
from django.contrib.contenttypes.models import ContentType
from .models import Activity

logger = logging.getLogger(__name__)


def log_activity(
    user,
    action_type,
    description="",
    content_object=None,
    metadata=None,
    request=None,
    ip_address=None,
    user_agent="",
):
    """
    Log an activity.

    Args:
        user: User object who performed the action
        action_type: Action type from Activity.ActionType choices
        description: Human-readable description of the activity
        content_object: The object that was affected (optional)
        metadata: Additional JSON metadata (optional)
        request: Django request object to extract IP and user agent (optional)
        ip_address: Manual IP address (optional, overrides request)
        user_agent: User agent string (optional, overrides request)

    Returns:
        Activity: The created activity object

    Example:
        log_activity(
            user=request.user,
            action_type=Activity.ActionType.PRODUCT_UPLOADED,
            description="Uploaded new product listing",
            content_object=product,
            request=request,
        )
    """

    # Extract IP address from request if not provided
    if request and not ip_address:
        # Try to get real IP if behind proxy
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

    # Extract user agent from request if not provided
    if request and not user_agent:
        user_agent = request.META.get("HTTP_USER_AGENT", "")

    # Default metadata
    if metadata is None:
        metadata = {}

    try:
        # Prepare content type and object id
        content_type = None
        object_id = None

        if content_object:
            content_type = ContentType.objects.get_for_model(content_object)
            object_id = str(content_object.pk)

        # Create activity
        activity = Activity.objects.create(
            user=user,
            action_type=action_type,
            description=description,
            content_type=content_type,
            object_id=object_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
        )

        logger.info(
            f"Activity logged: {user.email} - {action_type} - {description}",
            extra={
                "user_id": user.id,
                "action_type": action_type,
                "activity_id": activity.id,
            },
        )

        return activity

    except Exception as e:
        logger.error(
            f"Failed to log activity: {str(e)}",
            extra={
                "user_id": user.id,
                "action_type": action_type,
            },
            exc_info=True,
        )
        return None


def log_bulk_activities(activities_data):
    """
    Bulk create activities for better performance.

    Args:
        activities_data: List of dicts with activity parameters

    Example:
        log_bulk_activities([
            {
                "user": user1,
                "action_type": "product_created",
                "description": "Created product 1",
                "content_object": product1,
            },
            {
                "user": user2,
                "action_type": "product_created",
                "description": "Created product 2",
                "content_object": product2,
            },
        ])
    """

    activities = []

    try:
        for data in activities_data:
            user = data.get("user")
            action_type = data.get("action_type")
            description = data.get("description", "")
            content_object = data.get("content_object")
            metadata = data.get("metadata", {})
            request = data.get("request")
            ip_address = data.get("ip_address")
            user_agent = data.get("user_agent", "")

            # Extract IP and user agent from request
            if request and not ip_address:
                x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(",")[0].strip()
                else:
                    ip_address = request.META.get("REMOTE_ADDR")

            if request and not user_agent:
                user_agent = request.META.get("HTTP_USER_AGENT", "")

            # Get content type
            content_type = None
            object_id = None
            if content_object:
                content_type = ContentType.objects.get_for_model(content_object)
                object_id = str(content_object.pk)

            activity = Activity(
                user=user,
                action_type=action_type,
                description=description,
                content_type=content_type,
                object_id=object_id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata,
            )

            activities.append(activity)

        # Bulk create
        created_activities = Activity.objects.bulk_create(activities)

        logger.info(
            f"Bulk created {len(created_activities)} activities",
            extra={"count": len(created_activities)},
        )

        return created_activities

    except Exception as e:
        logger.error(
            f"Failed to bulk create activities: {str(e)}",
            exc_info=True,
        )
        return []
