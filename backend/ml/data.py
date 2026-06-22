"""Preparacion de datos para los modelos de prediccion.

Construye series de tiempo de demanda por producto a partir de las
ventas completadas registradas en la base de datos.
"""
from __future__ import annotations

import pandas as pd
from django.db.models import Sum, Avg
from django.db.models.functions import TruncDate


def serie_demanda_producto(id_producto: int) -> pd.DataFrame:
    """Devuelve un DataFrame con columnas ['ds', 'y'] (formato Prophet).

    ds = fecha, y = cantidad vendida ese dia.
    Usa primero la tabla demandas_historicas; si esta vacia, deriva la
    serie directamente de los detalles de venta completados.
    """
    from apps.prediccion.models import DemandasHistoricas

    qs = (
        DemandasHistoricas.objects.filter(producto_id=id_producto)
        .values("fecha")
        .annotate(y=Sum("cantidad_vendida"))
        .order_by("fecha")
    )
    if qs:
        df = pd.DataFrame(list(qs)).rename(columns={"fecha": "ds"})
    else:
        df = _serie_desde_ventas(id_producto)

    if df.empty:
        return df
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)
    return df[["ds", "y"]]


def _serie_desde_ventas(id_producto: int) -> pd.DataFrame:
    from apps.ventas.models import DetalleVenta

    qs = (
        DetalleVenta.objects.filter(
            producto_id=id_producto, venta__estado__in=["completada", "entregada"]
        )
        .annotate(fecha=TruncDate("venta__fecha_venta"))
        .values("fecha")
        .annotate(y=Sum("cantidad"))
        .order_by("fecha")
    )
    if not qs:
        return pd.DataFrame(columns=["ds", "y"])
    return pd.DataFrame(list(qs)).rename(columns={"fecha": "ds"})


def consolidar_demanda_historica() -> int:
    """Recalcula y guarda demandas_historicas a partir de las ventas.

    Devuelve el numero de filas escritas. Pensado para correr de forma
    periodica (tarea Celery).
    """
    from apps.ventas.models import DetalleVenta
    from apps.prediccion.models import DemandasHistoricas

    qs = (
        DetalleVenta.objects.filter(venta__estado__in=["completada", "entregada"])
        .annotate(fecha=TruncDate("venta__fecha_venta"))
        .values("producto_id", "fecha")
        .annotate(cantidad=Sum("cantidad"), precio=Avg("precio_unitario"))
    )
    filas = 0
    for row in qs:
        DemandasHistoricas.objects.update_or_create(
            producto_id=row["producto_id"],
            fecha=row["fecha"],
            defaults={
                "cantidad_vendida": row["cantidad"] or 0,
                "precio_promedio": row["precio"],
            },
        )
        filas += 1
    return filas
