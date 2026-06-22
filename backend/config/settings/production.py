"""Configuracion de produccion."""
from .base import *  # noqa

DEBUG = False

# Render termina TLS en un proxy; este header le indica a Django que la
# petición original llegó por HTTPS (necesario con SECURE_SSL_REDIRECT).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
