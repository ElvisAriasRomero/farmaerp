# ERP Farmacia - Backend (Django + DRF)

API REST para el sistema ERP de farmacia con prediccion de demanda (Prophet).

## Requisitos
- Python 3.11+
- PostgreSQL 17 (base `DB_prediccion`)
- Redis (para Celery)

## Instalacion
```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # ya viene un .env con tus credenciales
```

## Migraciones y arranque
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Celery (tareas asincronas + prediccion nocturna)
```bash
celery -A config worker -l info
celery -A config beat -l info        # pipeline diario 03:00
```

## Estructura
- `config/`        configuracion (settings divididos, celery, urls)
- `core/`          utilidades compartidas (paginacion, permisos, excepciones)
- `apps/`          apps de dominio (usuarios, productos, ventas, ...)
- `ml/`            modulo de Machine Learning
  - `data.py`      construccion de series de demanda
  - `train_model.py` entrenamiento Prophet por producto
  - `predict.py`   prediccion (Prophet + fallback media movil)
  - `analytics.py` KPIs, rentabilidad, sugerencias de compra
  - `models/`      modelos .joblib entrenados

## Endpoints principales (prefijo `/api/v1/`)
### Auth (JWT)
- `POST auth/login/`     obtener access/refresh
- `POST auth/refresh/`   refrescar token
- `POST auth/registro/`  registro de usuario
- `GET  auth/me/`        usuario actual

### CRUDs
usuarios, roles, clientes, empleados, proveedores, categorias, productos,
inventario, compras, detalle-compras, carritos, ventas, facturas, pagos,
auditoria (solo lectura), reportes, cajas.

Acciones extra:
- `GET  inventario/stock_bajo/`
- `POST compras/{id}/recepcionar/`   (suma stock)
- `POST ventas/{id}/cancelar/`       (devuelve stock)

### Prediccion y analisis
- `GET  prediccion/producto/{id}/?periodo=semanal`  prediccion al vuelo
- `POST prediccion/entrenar/`        encola entrenamiento Prophet
- `POST prediccion/generar/`         encola generacion de predicciones
- `POST prediccion/sugerencias/generar/`  encola sugerencias de compra
- `POST prediccion/pipeline/`        ejecuta pipeline completo
- CRUD: demandas-historicas, predicciones, compras-sugeridas, metricas-ventas

### Dashboard
- `GET dashboard/?dias=30`           resumen completo
- `GET analitica/kpis/`
- `GET analitica/ventas-diarias/`
- `GET analitica/ventas-mensuales/`
- `GET analitica/top-productos/`
- `GET analitica/rentabilidad/`
- `GET analitica/alertas-stock/`
