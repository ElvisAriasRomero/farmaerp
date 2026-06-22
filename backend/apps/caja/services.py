"""Lógica de caja: entradas automáticas (ventas en efectivo), salidas y cierre."""
from decimal import Decimal

from django.db import transaction


def caja_abierta():
    """Devuelve la caja actualmente abierta (o None)."""
    from .models import Caja
    return Caja.objects.filter(estado="abierta").order_by("-id_caja").first()


@transaction.atomic
def registrar_entrada_efectivo(monto):
    """Suma una venta en efectivo a la caja abierta (si hay una)."""
    caja = caja_abierta()
    if caja is None:
        return None
    caja = type(caja).objects.select_for_update().get(pk=caja.pk)
    caja.total_entradas = (caja.total_entradas or Decimal("0")) + Decimal(str(monto))
    caja.save(update_fields=["total_entradas"])
    return caja


@transaction.atomic
def registrar_salida(caja, monto, observacion=None):
    """Registra un egreso de efectivo (retiro, gasto)."""
    monto = Decimal(str(monto))
    caja.total_salidas = (caja.total_salidas or Decimal("0")) + monto
    if observacion:
        prev = (caja.observaciones or "").strip()
        caja.observaciones = (prev + f"\nSalida Bs {monto}: {observacion}").strip()
    caja.save(update_fields=["total_salidas", "observaciones"])
    return caja


@transaction.atomic
def cerrar_caja(caja):
    """Cierra la caja y calcula el saldo final esperado en efectivo."""
    from django.utils import timezone
    if caja.estado == "cerrada":
        return caja
    inicial = caja.saldo_inicial or Decimal("0")
    entradas = caja.total_entradas or Decimal("0")
    salidas = caja.total_salidas or Decimal("0")
    caja.saldo_final = inicial + entradas - salidas
    caja.estado = "cerrada"
    caja.fecha_cierre = timezone.now()
    caja.save(update_fields=["saldo_final", "estado", "fecha_cierre"])
    return caja
