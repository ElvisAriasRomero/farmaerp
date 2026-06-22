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
# requirements.txt puede venir en UTF-16 (lo genera PowerShell en Windows).
# Lo normalizamos a UTF-8 para que pip lo lea correctamente.
RUN python -c "raw=open('requirements.txt','rb').read(); enc='utf-16' if b'\x00' in raw[:80] else 'utf-8-sig'; open('requirements.txt','w',encoding='utf-8').write(raw.decode(enc))" \
 && pip install --upgrade pip \
 && pip install -r requirements.txt

# Copia el código de la aplicación.
COPY . .

# Recolecta estáticos en build (no requiere base de datos).
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Comando por defecto: aplica migraciones y arranca el servidor web.
# (En Free no se permite preDeployCommand, por eso migramos aquí al iniciar.)
# Worker/beat sobreescriben este comando en render.yaml.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py ensure_superuser && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile -"]
