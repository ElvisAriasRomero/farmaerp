"""Logica de negocio de compras (modelo 2b: la compra define costo, venta y factor)."""
from decimal import Decimal

from django.db import transaction

from apps.inventario.models import Inventario
from .models import Compra, DetalleCompra


@transaction.atomic
def crear_compra(datos_compra, detalles):
    """Crea una compra con sus detalles y calcula el total.

    El stock y los precios del producto se actualizan al recepcionar.
    """
    compra = Compra.objects.create(**datos_compra)
    total = Decimal("0")
    for det in detalles:
        detalle = DetalleCompra.objects.create(compra=compra, **det)
        total += detalle.cantidad * detalle.precio_unitario
    compra.total = total
    compra.save(update_fields=["total"])
    return compra


@transaction.atomic
def recepcionar_compra(compra):
    """Recepciona la compra: suma stock (en unidades) y define en el producto
    el costo por unidad, el precio de venta y las unidades por paquete.

    Por cada linea:
      - unidades base = cantidad x unidades_por_paquete
      - producto.precio_compra = precio_unitario (costo del paquete) / factor
      - producto.unidades_por_empaque = factor
      - producto.precio_venta = precio_venta de la linea (si se indico)
    """
    if compra.estado == "completada":
        return compra
    for det in compra.detalles.select_related("producto"):
        producto = det.producto
        factor = max(int(det.unidades_por_paquete or 1), 1)
        unidades = det.cantidad * factor

        inventario, _ = Inventario.objects.get_or_create(
            producto=producto, defaults={"stock_actual": 0},
        )
        inventario.stock_actual += unidades
        inventario.save(update_fields=["stock_actual"])

        cambios = []
        costo_unidad = (det.precio_unitario / factor).quantize(Decimal("0.01"))
        producto.precio_compra = costo_unidad
        producto.unidades_por_empaque = factor
        cambios += ["precio_compra", "unidades_por_empaque"]
        if det.precio_venta is not None:
            producto.precio_venta = det.precio_venta
            cambios.append("precio_venta")
        producto.save(update_fields=cambios)

    compra.estado = "completada"
    compra.save(update_fields=["estado"])
    return compra
