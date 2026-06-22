# Despliegue de FarmaERP en Render (con Docker)

Este proyecto se despliega como un monorepo en [Render](https://render.com) usando
el blueprint `render.yaml`. El backend corre en un contenedor Docker; el frontend
web como sitio estático.

## Arquitectura desplegada

| Servicio | Tipo | Plan | Notas |
|----------|------|------|-------|
| `farmaerp-api` | Web (Docker) | free | API Django + DRF (gunicorn) |
| `farmaerp-worker` | Worker (Docker) | **pago** | Celery worker (tareas/predicciones) |
| `farmaerp-beat` | Worker (Docker) | **pago** | Celery beat (programador) |
| `farmaerp-redis` | Redis | free | Broker/result de Celery |
| `farmaerp-db` | PostgreSQL | free | Base de datos |
| `farmaerp-web` | Static Site | free | Frontend React (Vite) |

> **Plan Free:** los *workers* de Celery requieren plan de pago en Render. Si vas a
> probar en Free, comenta los bloques `farmaerp-worker` y `farmaerp-beat` en
> `render.yaml` y actívalos cuando subas de plan. El resto funciona en Free
> (ojo: 512 MB RAM y el API se duerme tras inactividad).

---

## Paso 1 — Crear el repositorio Git

Desde la raíz del proyecto (`Proyecto_Taller_de_Grado`):

```bash
git init
git add .
git commit -m "FarmaERP: backend, frontend web, app movil y despliegue Docker/Render"
git branch -M main
```

Crea un repositorio vacío en GitHub (sin README) y conéctalo:

```bash
git remote add origin https://github.com/<tu-usuario>/farmaerp.git
git push -u origin main
```

## Paso 2 — Desplegar en Render con el blueprint

1. Entra a Render → **New** → **Blueprint**.
2. Conecta tu cuenta de GitHub y elige el repositorio.
3. Render detecta `render.yaml` y lista todos los servicios.
4. Revisa los planes (en Free, comenta worker/beat antes de subir) y crea.
5. Render construye la imagen Docker, crea la base, Redis y el sitio estático.

## Paso 3 — Ajustes post-despliegue

- **URLs reales:** cuando Render asigne los dominios, actualiza en el dashboard
  del API las variables `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` con la URL
  real del frontend, y en el frontend `VITE_API_URL` con la URL real del API.
  (En `render.yaml` están como `farmaerp-*.onrender.com`; cámbialas si el nombre difiere.)
- **Superusuario:** abre el *Shell* del servicio `farmaerp-api` en Render y corre:
  ```bash
  python manage.py shell -c "from apps.usuarios.models import Usuario; u,_=Usuario.objects.get_or_create(email='admin@farmacenter.com', defaults={'tipo':'empleado'}); u.is_staff=True; u.is_superuser=True; u.is_active=True; u.tipo='empleado'; u.set_password('CAMBIA_ESTA_CLAVE'); u.save(); print('OK', u.email)"
  ```
- **App móvil:** en `mobile/app.json` cambia `expo.extra.apiUrl` a la URL del API
  en Render (`https://farmaerp-api.onrender.com/api/v1`) para builds de producción.

## Probar la imagen Docker en local (opcional)

```bash
cd backend
docker build -t farmaerp-api .
docker run --rm -p 8000:8000 \
  -e DJANGO_SETTINGS_MODULE=config.settings.development \
  -e SECRET_KEY=dev -e DEBUG=True \
  farmaerp-api
```

> En local necesitas además PostgreSQL y Redis accesibles (o usar
> `docker compose`). Para producción, Render provee ambos.

## Notas sobre las librerías de ML (Prophet/XGBoost)

Son pesadas: la imagen tarda en construir y consumen RAM en runtime. En el plan
Free (512 MB) las predicciones pueden fallar por memoria. Para la defensa con ML
estable, usa un plan con más RAM en el `farmaerp-worker`.
