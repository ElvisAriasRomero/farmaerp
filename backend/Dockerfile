# ============================================================
# FarmaERP — Backend (Django + DRF + Celery + ML)
# Imagen única usada por: web (gunicorn), worker y beat (celery).
# ============================================================
FROM python:3.11-slim

# Evita .pyc y buffering; pip sin caché para imagen más liviana.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

# Dependencias del sistema:
#  - build-essential / g++: compilar prophet (stan) y otras libs nativas.
#  - libpq-dev: cliente PostgreSQL.
#  - curl: healthchecks.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    libpq-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependencias primero (mejor cacheo de capas).
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia el código de la aplicación.
COPY . .

# Recolecta estáticos en build (no requiere base de datos).
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Comando por defecto: servidor web. Worker/beat lo sobreescriben en render.yaml.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-"]
