"""Logica de negocio de ventas."""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.inventario.models import Inventario
from apps.inventario.services import consumir_stock_fefo, devolver_stock_fefo
from .models import Venta, DetalleVenta


def _factor(producto, presentacion):
    """Unidades base que representa una unidad de la presentacion indicada."""
    if presentacion == "paquete":
        return max(int(producto.unidades_por_empaque or 1), 1)
    return 1


@transaction.atomic
def crear_venta(datos_venta, detalles):
    """Crea una venta, descuenta stock (en unidades base) y calcula el total.

    Cada detalle puede ser 'paquete' o 'unidad'. El stock se descuenta en
    unidades base: cantidad x factor (factor = unidades_por_empaque si paquete).
    """
    venta = Venta.objects.create(total=Decimal("0"), **{
        k: v for k, v in datos_venta.items() if k != "total"
    })
    total = Decimal("0")
    for det in detalles:
        producto = det["producto"]
        cantidad = det["cantidad"]
        presentacion = det.get("presentacion", "unidad")
        factor = _factor(producto, presentacion)
        unidades = cantidad * factor
        try:
            inventario = Inventario.objects.select_for_update().get(
                producto=producto
            )
        except Inventario.DoesNotExist:
            raise ValidationError(
                f"El producto {producto} no tiene inventario registrado."
            )
        disponible = inventario.stock_actual
        if unidades > disponible:
            raise ValidationError(
                f"Stock insuficiente para {producto}. "
                f"Disponible: {disponible} unidades, solicitado: {unidades}."
            )
        detalle = DetalleVenta.objects.create(venta=venta, **det)
        inventario.stock_actual -= unidades
        inventario.save(update_fields=["stock_actual"])
        # Consume de los lotes en orden FEFO y recalcula la fecha de
        # vencimiento del producto (salta al siguiente lote si se agota).
        consumir_stock_fefo(producto, unidades)
        total += detalle.cantidad * detalle.precio_unitario
    venta.total = total
    venta.save(update_fields=["total"])
    return venta


@transaction.atomic
def cancelar_venta(venta):
    """Cancela una venta y devuelve el stock (en unidades base) al inventario."""
    if venta.estado == "cancelada":
        return venta
    for det in venta.detalles.select_related("producto"):
        factor = _factor(det.producto, det.presentacion)
        inventario = Inventario.objects.select_for_update().get(
            producto=det.producto
        )
        inventario.stock_actual += det.cantidad * factor
        inventario.save(update_fields=["stock_actual"])
        devolver_stock_fefo(det.producto, det.cantidad * factor)
    venta.estado = "cancelada"
    venta.save(update_fields=["estado"])
    return venta


def _siguiente_numero_factura():
    """Genera el siguiente numero de factura correlativo (F-0001, ...)."""
    from apps.facturacion.models import Factura
    n = Factura.objects.count() + 1
    numero = f"F-{n:04d}"
    while Factura.objects.filter(numero_factura=numero).exists():
        n += 1
        numero = f"F-{n:04d}"
    return numero


@transaction.atomic
def confirmar_venta(venta, *, metodo_pago="efectivo", monto=None,
                    con_factura=False, nit_ci=None, razon_social=None,
                    estado_final="completada"):
    """Confirma una venta: registra el pago y, si corresponde, emite la factura.

    `estado_final` permite distinguir la venta de mostrador ("completada")
    de la reserva en línea que pagó pero aún no retira ("pagada").
    """
    from apps.facturacion.models import Factura, Pago
    from datetime import date

    if venta.estado == "cancelada":
        raise ValidationError("No se puede confirmar una venta cancelada.")

    monto = Decimal(str(monto)) if monto not in (None, "") else venta.total

    venta.estado = estado_final
    venta.con_factura = bool(con_factura)
    venta.save(update_fields=["estado", "con_factura"])

    # El QR genera un número de comprobante/transacción (simulado) que sirve
    # como evidencia de pago para que el empleado lo verifique al entregar.
    referencia = None
    if (metodo_pago or "efectivo") == "qr":
        import uuid
        referencia = f"QR-{uuid.uuid4().hex[:8].upper()}"

    pago = Pago.objects.create(
        venta=venta,
        monto=monto,
        metodo_pago=metodo_pago or "efectivo",
        estado="completado",
        referencia=referencia,
    )

    # Solo el efectivo entra a la caja física (el QR va al banco).
    if (metodo_pago or "efectivo") == "efectivo":
        from apps.caja.services import registrar_entrada_efectivo
        registrar_entrada_efectivo(monto)

    factura = getattr(venta, "factura", None)
    if con_factura and factura is None:
        factura = Factura.objects.create(
            venta=venta,
            numero_factura=_siguiente_numero_factura(),
            fecha_emision=date.today(),
            total=venta.total,
            estado="pagada",
            nit_ci=(nit_ci or "0"),
            razon_social=(razon_social or "S/N"),
        )
        pago.factura = factura
        pago.save(update_fields=["factura"])

    return {"venta": venta, "pago": pago, "factura": factura}


# --------------------------------------------------------------------------- #
#  Reservas de la tienda en línea (retiro en farmacia)
# --------------------------------------------------------------------------- #
@transaction.atomic
def crear_reserva(cliente, detalles, *, metodo_pago="farmacia",
                  con_factura=False, nit_ci=None, razon_social=None):
    """Crea una reserva de la tienda online (aparta stock).

    - metodo_pago == "qr"  -> paga en línea: registra el pago y queda "pagada".
    - metodo_pago == "farmacia" -> paga al retirar: queda "reservada".
    El número de la venta (#id) es el código de retiro que verá el cliente.
    """
    venta = crear_venta(
        {"cliente": cliente, "origen": "tienda", "estado": "reservada"},
        detalles,
    )
    if metodo_pago == "qr":
        confirmar_venta(
            venta, metodo_pago="qr", monto=venta.total,
            con_factura=con_factura, nit_ci=nit_ci, razon_social=razon_social,
            estado_final="pagada",
        )
        venta.refresh_from_db()
    return venta


@transaction.atomic
def cobrar_reserva(venta, *, metodo_pago="efectivo", monto=None,
                   con_factura=False, nit_ci=None, razon_social=None):
    """El empleado cobra una reserva en la farmacia (efectivo entra a caja)."""
    if venta.estado not in ("reservada", "pendiente"):
        raise ValidationError("Solo se puede cobrar una reserva pendiente de pago.")
    return confirmar_venta(
        venta, metodo_pago=metodo_pago, monto=monto,
        con_factura=con_factura, nit_ci=nit_ci, razon_social=razon_social,
        estado_final="pagada",
    )


@transaction.atomic
def entregar_reserva(venta):
    """Marca la reserva como entregada (el cliente retiró sus productos)."""
    if venta.estado == "cancelada":
        raise ValidationError("La reserva está cancelada.")
    if venta.estado != "pagada":
        raise ValidationError("Solo se puede entregar una reserva ya pagada.")
    venta.estado = "entregada"
    venta.save(update_fields=["estado"])
    return venta
