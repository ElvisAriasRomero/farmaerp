"""Entrenamiento de modelos de prediccion de demanda (Prophet).

Cada producto con suficiente historial obtiene su propio modelo Prophet,
serializado con joblib en ml/models/. Si Prophet no esta disponible o el
historial es insuficiente, se omite ese producto (el predictor usara un
fallback de media movil).
"""
from __future__ import annotations

import logging
from pathlib import Path

import joblib
from django.conf import settings

from .data import serie_demanda_producto

logger = logging.getLogger(__name__)

MIN_PUNTOS = 14  # minimo de dias con datos para entrenar Prophet


def _ruta_modelo(id_producto: int) -> Path:
    return Path(settings.ML_MODELS_DIR) / f"prophet_producto_{id_producto}.joblib"


def entrenar_producto(id_producto: int):
    """Entrena y persiste un modelo Prophet para un producto.

    Devuelve el modelo entrenado o None si no se pudo entrenar.
    """
    df = serie_demanda_producto(id_producto)
    if df is None or len(df) < MIN_PUNTOS:
        logger.info(
            "Producto %s: historial insuficiente (%s puntos), se omite.",
            id_producto, 0 if df is None else len(df),
        )
        return None

    # Todo el bloque de Prophet va protegido: si la libreria o su motor Stan
    # fallan (instalacion incompleta, etc.), se omite ese producto y el
    # predictor usara el respaldo de promedio movil. Nunca tumba la peticion.
    try:
        from prophet import Prophet

        modelo = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            seasonality_mode="multiplicative",
        )
        modelo.fit(df)

        Path(settings.ML_MODELS_DIR).mkdir(parents=True, exist_ok=True)
        joblib.dump(modelo, _ruta_modelo(id_producto))
        logger.info("Modelo entrenado y guardado para producto %s.", id_producto)
        return modelo
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "No se pudo entrenar Prophet para producto %s (%s). Se usara promedio movil.",
            id_producto, exc,
        )
        return None


def entrenar_todos() -> dict:
    """Entrena modelos para todos los productos activos.

    Devuelve un resumen {entrenados, omitidos}.
    """
    from apps.productos.models import Producto

    entrenados, omitidos = 0, 0
    for prod in Producto.objects.all().only("id_producto"):
        modelo = entrenar_producto(prod.id_producto)
        if modelo is not None:
            entrenados += 1
        else:
            omitidos += 1
    return {"entrenados": entrenados, "omitidos": omitidos}
