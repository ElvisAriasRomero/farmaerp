"""Lógica de negocio de lotes (FEFO).

La fecha de vencimiento vive únicamente en el Lote. El "próximo vencimiento"
de un producto se calcula cuando se necesita (lote vigente que vence antes),
no se persiste en Producto.
"""
from django.db import transaction
from django.db.models import F

from .models import Lote


def registrar_lote(producto, cantidad, fecha_vencimiento=None, numero_lote=None):
    """Crea un nuevo lote (p.ej. al recepcionar una compra)."""
    return Lote.objects.create(
        producto=producto,
        cantidad=cantidad,
        fecha_vencimiento=fecha_vencimiento,
        numero_lote=numero_lote,
    )


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
    return lote


def proximo_vencimiento(producto):
    """Devuelve la fecha de vencimiento del lote vigente más próximo a vencer,
    o None si el producto no tiene lotes con stock y fecha."""
    lote = (
        Lote.objects.filter(producto=producto, cantidad__gt=0)
        .exclude(fecha_vencimiento__isnull=True)
        .order_by("fecha_vencimiento", "id_lote")
        .first()
    )
    return lote.fecha_vencimiento if lote else None
