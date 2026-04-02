# config/settings.py

import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import cloudinary
import dj_database_url


# ── Base ──
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY    = config("SECRET_KEY")
DEBUG         = config("DEBUG", default=True,  cast=bool)
ALLOWED_HOSTS = ["*"]


# ── Apps ──
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "django_celery_beat",
    "django_celery_results",
    "channels",
    "cloudinary",
    "cloudinary_storage",
    "django_extensions",
]

LOCAL_APPS = [
    "core",
    "users",
    "otp",
    "passwords",
    "verification",
    "vendors",
    "scanners",
    "subscriptions",
    "products",
    "storekeeper",
    "sales",
    "analytics",
    "reports",
    "notifications",
    "geography",
    "media",
    "emails",
    "paypal",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ── Middleware ──
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",          # ← must stay second, before CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF     = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ── Templates ──
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ── Database ──
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME":   BASE_DIR / "db.sqlite3",
    }
}



# ── Custom User Model ──
AUTH_USER_MODEL = "users.User"


# ── Password Validation ──
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ── Internationalisation ──
LANGUAGE_CODE = "en-us"
TIME_ZONE     = "Africa/Lagos"
USE_I18N      = True
USE_TZ        = True


# ── Static & Media ──
STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"
MEDIA_ROOT  = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ── REST Framework ──
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # SessionAuthentication is intentionally excluded — it enforces
        # CSRF checks which conflict with JWT-based stateless auth.
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS":  "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER":     "core.exceptions.custom_exception_handler",

    # Throttling is disabled in DEBUG to avoid hitting limits during
    # development and causing broken-pipe errors on repeated requests.
    "DEFAULT_THROTTLE_CLASSES": [] if DEBUG else [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/hour",
        "user": "1000/hour",
    },
}


# ── JWT ──
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME":   timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":    True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN":        True,
    "ALGORITHM":                "HS256",
    "AUTH_HEADER_TYPES":        ("Bearer",),
    "USER_ID_FIELD":            "id",
    "USER_ID_CLAIM":            "user_id",
}


# ── CORS ──
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# ── Redis URLs — one variable per service ──
REDIS_URL          = config("REDIS_URL",                  default="redis://localhost:6379/0")
CELERY_BROKER_URL  = config("CELERY_BROKER_URL",          default="redis://localhost:6379/0")
_CELERY_RESULT_URL = config("CELERY_RESULT_BACKEND_URL",  default="redis://localhost:6379/1")
REDIS_CACHE_URL    = config("REDIS_CACHE_URL",            default="redis://localhost:6379/2")
REDIS_CHANNELS_URL = config("REDIS_CHANNELS_URL",         default="redis://localhost:6379/3")


# ── Celery ──
# In development tasks run inline — no broker connection needed.
if DEBUG:
    CELERY_TASK_ALWAYS_EAGER     = True
    CELERY_TASK_EAGER_PROPAGATES = True

CELERY_RESULT_BACKEND       = _CELERY_RESULT_URL
CELERY_CACHE_BACKEND        = "django-cache"
CELERY_ACCEPT_CONTENT       = ["json"]
CELERY_TASK_SERIALIZER      = "json"
CELERY_RESULT_SERIALIZER    = "json"
CELERY_TIMEZONE             = TIME_ZONE
CELERY_BEAT_SCHEDULER       = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_TRACK_STARTED   = True
CELERY_TASK_TIME_LIMIT      = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "daily-subscription-check": {
        "task":     "subscriptions.daily_subscription_check",
        "schedule": crontab(hour=1, minute=0),  # runs at 01:00 every day
    },
}


# ── Cache ──
# In DEBUG, fall back to a local in-memory cache so the dev server
# works without Redis running. In production, use django-redis.
if DEBUG:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "stocksense-dev",
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND":  "django_redis.cache.RedisCache",
            "LOCATION": REDIS_CACHE_URL,
            "OPTIONS": {
                "CLIENT_CLASS":      "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "stocksense",
            "TIMEOUT":    300,
        }
    }


# ── Sessions ──
SESSION_ENGINE      = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


# ── Channels ──
# In DEBUG, use the in-memory channel layer so the dev server works
# without Redis. In production, use Redis.
if DEBUG:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts":    [REDIS_CHANNELS_URL],
                "capacity": 1500,
                "expiry":   10,
            },
        }
    }


# ── Email ──
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST          = config("EMAIL_HOST",          default="smtp.gmail.com")
EMAIL_PORT          = config("EMAIL_PORT",           default=587,   cast=int)
EMAIL_USE_TLS       = config("EMAIL_USE_TLS",        default=True,  cast=bool)
EMAIL_USE_SSL       = config("EMAIL_USE_SSL",        default=False, cast=bool)
EMAIL_HOST_USER     = config("EMAIL_HOST_USER",      default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD",  default="")
DEFAULT_FROM_EMAIL  = config("DEFAULT_FROM_EMAIL",   default="StockSense <noreply@stocksense.app>")
SERVER_EMAIL        = DEFAULT_FROM_EMAIL
EMAIL_TIMEOUT       = 10


# ── Cloudinary ──
import cloudinary

cloudinary.config(
    cloud_name  = config("CLOUDINARY_CLOUD_NAME"),
    api_key     = config("CLOUDINARY_API_KEY"),
    api_secret  = config("CLOUDINARY_API_SECRET"),
    secure      = True,
)
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"


# ── Stripe ──
STRIPE_SECRET_KEY      = config("STRIPE_SECRET_KEY",      default="")
STRIPE_PUBLISHABLE_KEY = config("STRIPE_PUBLISHABLE_KEY", default="")
STRIPE_WEBHOOK_SECRET  = config("STRIPE_WEBHOOK_SECRET",  default="")


# ── DRF Spectacular ──
SPECTACULAR_SETTINGS = {
    "TITLE":                   "StockSense API",
    "DESCRIPTION":             "Inventory management platform for Nigerian businesses",
    "VERSION":                 "1.0.0",
    "SERVE_INCLUDE_SCHEMA":    False,
    "COMPONENT_SPLIT_REQUEST": True,
}


# ── Sentry (uncomment in production) ──
# SENTRY_DSN = config("SENTRY_DSN", default="")
# if SENTRY_DSN:
#     import sentry_sdk
#     from sentry_sdk.integrations.django import DjangoIntegration
#     from sentry_sdk.integrations.celery import CeleryIntegration
#     sentry_sdk.init(
#         dsn                = SENTRY_DSN,
#         integrations       = [DjangoIntegration(), CeleryIntegration()],
#         traces_sample_rate = 0.2,
#         send_default_pii   = False,
#     )


# ── App-specific settings ──
OTP_EXPIRY_MINUTES                = 10
OTP_MAX_RESEND                    = 3
OTP_RESEND_WINDOW                 = 60
VERIFICATION_TOKEN_EXPIRY_HOURS   = 24
PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 24
LOW_STOCK_DEFAULT_THRESHOLD       = 5
FRONTEND_BASE_URL                 = config("FRONTEND_BASE_URL", default="http://localhost:5173")