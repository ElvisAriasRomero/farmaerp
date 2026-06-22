"""Configuracion base compartida por todos los entornos."""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "insecure-dev-key")
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

# Render expone el host público en esta variable de entorno.
RENDER_EXTERNAL_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Orígenes confiables para CSRF (dominios https del frontend y del propio API).
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

# ----------------------------------------------------------------------------
# Aplicaciones
# ----------------------------------------------------------------------------
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
    "corsheaders",
    "django_filters",
    "django_celery_beat",
]

LOCAL_APPS = [
    "apps.usuarios",
    "apps.clientes",
    "apps.empleados",
    "apps.proveedores",
    "apps.productos",
    "apps.inventario",
    "apps.compras",
    "apps.carrito",
    "apps.ventas",
    "apps.facturacion",
    "apps.auditoria",
    "apps.prediccion",
    "apps.reportes",
    "apps.caja",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ----------------------------------------------------------------------------
# Base de datos
# ----------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("DB_NAME", "DB_prediccion"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# ----------------------------------------------------------------------------
# Autenticacion
# ----------------------------------------------------------------------------
AUTH_USER_MODEL = "usuarios.Usuario"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ----------------------------------------------------------------------------
# DRF + JWT
# ----------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # Sin paginacion global: las listas devuelven arrays planos (el frontend
    # consume response.data como array). Para paginar un endpoint puntual,
    # asignar pagination_class en su ViewSet.
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "USER_ID_FIELD": "id_usuario",
    "USER_ID_CLAIM": "user_id",
}

# ----------------------------------------------------------------------------
# CORS
# ----------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

# ----------------------------------------------------------------------------
# Celery
# ----------------------------------------------------------------------------
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "America/La_Paz"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Pipeline de prediccion nocturno (todos los dias a las 03:00)
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    "pipeline-prediccion-diario": {
        "task": "prediccion.pipeline_diario",
        "schedule": crontab(hour=3, minute=0),
        "kwargs": {"periodo": "semanal"},
    },
}

# ----------------------------------------------------------------------------
# Internacionalizacion
# ----------------------------------------------------------------------------
LANGUAGE_CODE = "es"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True

# ----------------------------------------------------------------------------
# Archivos estaticos y media
# ----------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# WhiteNoise: sirve archivos estáticos comprimidos en producción (sin Nginx).
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Carpeta de modelos ML entrenados
ML_MODELS_DIR = BASE_DIR / "ml" / "models"
