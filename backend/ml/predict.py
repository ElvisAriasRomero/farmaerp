"""Generacion de predicciones de demanda."""
from __future__ import annotations

import logging
from pathlib import Path

import joblib
import pandas as pd
from django.conf import settings

from .data import serie_demanda_producto

logger = logging.getLogger(__name__)

MAPA_PERIODOS_DIAS = {
    "diario": 1,
    "semanal": 7,
    "mensual": 30,
    "trimestral": 90,
    "anual": 365,
}


def _ruta_modelo(id_producto: int) -> Path:
    return Path(settings.ML_MODELS_DIR) / f"prophet_producto_{id_producto}.joblib"


def predecir_producto(id_producto: int, periodo: str = "semanal") -> dict:
    """Predice la demanda agregada de un producto para el periodo dado.

    Devuelve {demanda_predicha, confianza, metodo}. Intenta usar el modelo
    Prophet entrenado; si no existe, recurre a un fallback de media movil.
    """
    horizonte = MAPA_PERIODOS_DIAS.get(periodo, 7)
    ruta = _ruta_modelo(id_producto)

    if ruta.exists():
        try:
            return _predecir_prophet(ruta, horizonte)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Fallo Prophet producto %s: %s", id_producto, exc)

    return _predecir_fallback(id_producto, horizonte)


def _predecir_prophet(ruta: Path, horizonte: int) -> dict:
    modelo = joblib.load(ruta)
    futuro = modelo.make_future_dataframe(periods=horizonte)
    forecast = modelo.predict(futuro)
    ventana = forecast.tail(horizonte)
    demanda = float(ventana["yhat"].clip(lower=0).sum())

    # Confianza aproximada a partir del intervalo de prediccion
    amplitud = (ventana["yhat_upper"] - ventana["yhat_lower"]).mean()
    media = max(ventana["yhat"].mean(), 1e-6)
    confianza = max(0.0, min(100.0, 100.0 * (1 - amplitud / (media * 4))))

    return {
        "demanda_predicha": int(round(demanda)),
        "confianza": round(confianza, 2),
        "metodo": "prophet",
    }


def _predecir_fallback(id_producto: int, horizonte: int) -> dict:
    """Media movil de los ultimos 30 dias como respaldo.

    La confianza ya no es fija: crece con la cantidad de datos historicos y
    baja con la variabilidad de las ventas (siempre por debajo de Prophet).
    """
    df = serie_demanda_producto(id_producto)
    if df is None or df.empty:
        return {"demanda_predicha": 0, "confianza": 0.0, "metodo": "sin_datos"}
    df = df.set_index("ds").asfreq("D", fill_value=0)
    serie = df["y"]
    media_diaria = float(serie.tail(30).mean())

    # Confianza data-dependiente
    ventana = serie.tail(90)
    dias_con_venta = int((ventana > 0).sum())
    media = float(ventana.mean())
    std = float(ventana.std() or 0.0)
    cv = (std / media) if media > 0 else 2.0  # coef. de variacion
    confianza = 35.0 + min(dias_con_venta, 60) / 3.0 - min(cv, 2.0) * 12.0
    confianza = max(25.0, min(70.0, confianza))

    return {
        "demanda_predicha": int(round(media_diaria * horizonte)),
        "confianza": round(confianza, 2),
        "metodo": "media_movil",
    }


def pronostico_ventas(id_producto: int) -> dict:
    """Demanda prevista del producto en varios horizontes (dia, semana, mes)."""
    return {
        "diario": predecir_producto(id_producto, "diario")["demanda_predicha"],
        "semanal": predecir_producto(id_producto, "semanal")["demanda_predicha"],
        "mensual": predecir_producto(id_producto, "mensual")["demanda_predicha"],
    }


def generar_y_guardar_predicciones(periodo: str = "semanal") -> int:
    """Genera predicciones para todos los productos y las persiste.

    Devuelve el numero de predicciones guardadas.
    """
    from datetime import date
    from apps.productos.models import Producto
    from apps.prediccion.models import DatosPrediccion

    hoy = date.today()
    guardadas = 0
    for prod in Producto.objects.all().only("id_producto"):
        res = predecir_producto(prod.id_producto, periodo)
        # update_or_create: una sola prediccion vigente por
        # (producto, periodo, dia). Re-generar el mismo dia actualiza.
        DatosPrediccion.objects.update_or_create(
            producto_id=prod.id_producto,
            periodo=periodo,
            fecha_prediccion=hoy,
            defaults={
                "demanda_predicha": res["demanda_predicha"],
                "confianza": res["confianza"],
                "metodo": res.get("metodo", "sin_datos"),
            },
        )
        guardadas += 1
    return guardadas
