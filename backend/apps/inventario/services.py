"""Lógica de negocio de lotes (FEFO).

La fecha de vencimiento del producto es automática: siempre refleja el lote
vigente que vence antes. Al agotarse un lote, salta al siguiente.
"""
from django.db import transaction
from django.db.models import F

from .models import Lote


def actualizar_vencimiento_producto(producto):
    """Recalcula producto.fecha_vencimiento = fecha del lote vigente más próximo."""
    lote = (
        Lote.objects.filter(producto=producto, cantidad__gt=0)
        .exclude(fecha_vencimiento__isnull=True)
        .order_by("fecha_vencimiento", "id_lote")
        .first()
    )
    nueva = lote.fecha_vencimiento if lote else None
    if producto.fecha_vencimiento != nueva:
        producto.fecha_vencimiento = nueva
        producto.save(update_fields=["fecha_vencimiento"])


def registrar_lote(producto, cantidad, fecha_vencimiento=None, numero_lote=None):
    """Crea un nuevo lote (p.ej. al recepcionar una compra) y actualiza la
    fecha de vencimiento del producto."""
    lote = Lote.objects.create(
        producto=producto,
        cantidad=cantidad,
        fecha_vencimiento=fecha_vencimiento,
        numero_lote=numero_lote,
    )
    actualizar_vencimiento_producto(producto)
    return lote


@transaction.atomic
def consumir_stock_fefo(producto, unidades):
    """Descuenta `unidades` (base) de los lotes del producto en orden FEFO
    (vence antes, sale antes). Devuelve las unidades que NO se pudieron cubrir
    con lotes (0 si todo ok)."""
    restante = int(unidades)
    lotes = (
        Lote.objects.select_for_update()
        .filter(producto=producto, cantidad__gt=0)
        .order_by(F("fecha_vencimiento").asc(nulls_last=True), "id_lote")
    )
    for lote in lotes:
        if restante <= 0:
            break
        tomar = min(lote.cantidad, restante)
        lote.cantidad -= tomar
        restante -= tomar
        lote.save(update_fields=["cantidad"])
    actualizar_vencimiento_producto(producto)
    return restante


@transaction.atomic
def devolver_stock_fefo(producto, unidades):
    """Devuelve `unidades` (base) al lote vigente más próximo (al cancelar una
    venta). Reactiva el lote si estaba agotado."""
    lote = (
        Lote.objects.select_for_update()
        .filter(producto=producto)
        .order_by(F("fecha_vencimiento").asc(nulls_last=True), "id_lote")
        .first()
    )
    if lote is not None:
        lote.cantidad += int(unidades)
        lote.save(update_fields=["cantidad"])
    actualizar_vencimiento_producto(producto)
    return lote
