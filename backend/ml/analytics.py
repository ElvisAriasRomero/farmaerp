"""Servicio de analisis y metricas para el dashboard.

Calcula KPIs de ventas, productos top, rentabilidad, evolucion temporal,
alertas de stock y genera sugerencias de compra combinando el stock actual
con la demanda predicha.
"""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import (
    Sum, Count, Avg, F, DecimalField, ExpressionWrapper, Value,
)
from django.db.models.functions import TruncDate, TruncMonth, Coalesce


def _rango_fechas(dias: int):
    fin = date.today()
    inicio = fin - timedelta(days=dias)
    return inicio, fin


def kpis_generales(dias: int = 30) -> dict:
    """KPIs resumidos para las tarjetas del dashboard."""
    from apps.ventas.models import Venta
    from apps.productos.models import Producto
    from apps.inventario.models import Inventario

    inicio, fin = _rango_fechas(dias)
    ventas = Venta.objects.filter(
        estado__in=["completada", "entregada"], fecha_venta__date__gte=inicio
    )
    agg = ventas.aggregate(
        ingresos=Coalesce(Sum("total"), Value(Decimal("0"))),
        num_ventas=Count("id_venta"),
        ticket_promedio=Coalesce(Avg("total"), Value(Decimal("0"))),
    )
    stock_bajo = Inventario.objects.filter(
        stock_actual__lte=F("stock_minimo")
    ).count()

    return {
        "rango_dias": dias,
        "ingresos_totales": float(agg["ingresos"]),
        "numero_ventas": agg["num_ventas"],
        "ticket_promedio": float(agg["ticket_promedio"]),
        "total_productos": Producto.objects.count(),
        "productos_stock_bajo": stock_bajo,
    }


def ventas_por_dia(dias: int = 30) -> list:
    """Serie temporal diaria: ingresos, ganancia (ingresos - costo) y nro de ventas."""
    from apps.ventas.models import Venta, DetalleVenta

    inicio, _ = _rango_fechas(dias)
    qs = (
        Venta.objects.filter(estado__in=["completada", "entregada"], fecha_venta__date__gte=inicio)
        .annotate(fecha=TruncDate("fecha_venta"))
        .values("fecha")
        .annotate(ingresos=Sum("total"), ventas=Count("id_venta"))
        .order_by("fecha")
    )

    # Costo por dia = sum(cantidad * precio_compra) de los detalles
    costo_expr = ExpressionWrapper(
        F("cantidad") * Coalesce(F("producto__precio_compra"), Value(Decimal("0"))),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )
    costo_qs = (
        DetalleVenta.objects.filter(
            venta__estado__in=["completada", "entregada"],
            venta__fecha_venta__date__gte=inicio,
        )
        .annotate(fecha=TruncDate("venta__fecha_venta"))
        .values("fecha")
        .annotate(costo=Sum(costo_expr))
    )
    costo_map = {r["fecha"].isoformat(): float(r["costo"] or 0) for r in costo_qs}

    out = []
    for r in qs:
        fecha = r["fecha"].isoformat()
        ingresos = float(r["ingresos"] or 0)
        ganancia = round(ingresos - costo_map.get(fecha, 0), 2)
        out.append({
            "fecha": fecha,
            "ingresos": ingresos,
            "ganancia": ganancia,
            "ventas": r["ventas"],
        })
    return out


def ventas_por_mes(meses: int = 12) -> list:
    from apps.ventas.models import Venta

    inicio = date.today() - timedelta(days=meses * 31)
    qs = (
        Venta.objects.filter(estado__in=["completada", "entregada"], fecha_venta__date__gte=inicio)
        .annotate(mes=TruncMonth("fecha_venta"))
        .values("mes")
        .annotate(ingresos=Sum("total"), ventas=Count("id_venta"))
        .order_by("mes")
    )
    return [
        {
            "mes": r["mes"].date().isoformat(),
            "ingresos": float(r["ingresos"] or 0),
            "ventas": r["ventas"],
        }
        for r in qs
    ]


def ventas_por_metodo(dias: int = 30) -> list:
    """Reparto de los pagos por metodo (efectivo, qr, tarjeta) en el periodo."""
    from apps.facturacion.models import Pago

    inicio, _ = _rango_fechas(dias)
    qs = (
        Pago.objects.filter(estado="completado", fecha_pago__date__gte=inicio)
        .values("metodo_pago")
        .annotate(total=Coalesce(Sum("monto"), Value(Decimal("0"))), cantidad=Count("id_pago"))
        .order_by("-total")
    )
    return [
        {
            "metodo": r["metodo_pago"],
            "total": float(r["total"] or 0),
            "cantidad": r["cantidad"],
        }
        for r in qs
    ]


def productos_mas_vendidos(limite: int = 10, dias: int = 30) -> list:
    """Top de productos por cantidad vendida (para grafica de barras)."""
    from apps.ventas.models import DetalleVenta

    inicio, _ = _rango_fechas(dias)
    costo_expr = ExpressionWrapper(
        F("cantidad") * Coalesce(F("producto__precio_compra"), Value(Decimal("0"))),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )
    qs = (
        DetalleVenta.objects.filter(
            venta__estado__in=["completada", "entregada"], venta__fecha_venta__date__gte=inicio
        )
        .values("producto_id", "producto__nombre")
        .annotate(unidades=Sum("cantidad"), ingresos=Sum("subtotal"), costo=Sum(costo_expr))
        .order_by("-unidades")[:limite]
    )
    return [
        {
            "id_producto": r["producto_id"],
            "nombre": r["producto__nombre"],
            "cantidad_vendida": r["unidades"],
            "ingresos": float(r["ingresos"] or 0),
            "ganancia": round(float(r["ingresos"] or 0) - float(r["costo"] or 0), 2),
        }
        for r in qs
    ]


def rentabilidad_productos(limite: int = 10) -> list:
    """Margen porcentual por producto (precio_venta vs precio_compra)."""
    from apps.productos.models import Producto

    margen = ExpressionWrapper(
        (F("precio_venta") - F("precio_compra")) * Value(100.0)
        / F("precio_compra"),
        output_field=DecimalField(max_digits=8, decimal_places=2),
    )
    qs = (
        Producto.objects.annotate(margen=margen)
        .order_by("-margen")
        .values("id_producto", "nombre", "precio_compra", "precio_venta", "margen")[:limite]
    )
    return [
        {
            "id_producto": r["id_producto"],
            "nombre": r["nombre"],
            "precio_compra": float(r["precio_compra"]),
            "precio_venta": float(r["precio_venta"]),
            "margen_porcentaje": float(r["margen"] or 0),
        }
        for r in qs
    ]


def alertas_stock_bajo() -> list:
    """Productos en o por debajo del stock minimo."""
    from apps.inventario.models import Inventario

    qs = (
        Inventario.objects.filter(stock_actual__lte=F("stock_minimo"))
        .select_related("producto")
        .order_by("stock_actual")
    )
    return [
        {
            "id_producto": inv.producto_id,
            "nombre": inv.producto.nombre,
            "stock_actual": inv.stock_actual,
            "stock_minimo": inv.stock_minimo,
            "faltante": inv.stock_minimo - inv.stock_actual,
        }
        for inv in qs
    ]


def alertas_vencimiento(dias_aviso: int = 30) -> list:
    """Productos próximos a vencer (o ya vencidos) que aún tienen stock."""
    from datetime import date, timedelta
    from apps.productos.models import Producto

    hoy = date.today()
    limite = hoy + timedelta(days=dias_aviso)
    qs = (
        Producto.objects.filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=limite,
        )
        .select_related("inventario")
        .order_by("fecha_vencimiento")
    )
    out = []
    for p in qs:
        inv = getattr(p, "inventario", None)
        stock = getattr(inv, "stock_actual", 0) or 0
        if stock <= 0:
            continue
        dias_rest = (p.fecha_vencimiento - hoy).days
        out.append({
            "id_producto": p.id_producto,
            "nombre": p.nombre,
            "fecha_vencimiento": p.fecha_vencimiento.isoformat(),
            "dias_restantes": dias_rest,
            "vencido": dias_rest < 0,
            "stock_actual": stock,
        })
    return out


def generar_sugerencias_compra(periodo: str = "semanal") -> int:
    """Genera sugerencias de compra combinando stock y demanda predicha.

    Regla:
      - Si el stock actual <= stock minimo  -> motivo 'bajo_stock'.
      - Si la demanda predicha supera el stock disponible -> 'prediccion_demanda'.
    La cantidad sugerida cubre el deficit hasta el stock minimo + demanda.
    Devuelve el numero de sugerencias creadas.
    """
    from apps.inventario.models import Inventario
    from apps.prediccion.models import CompraSugerida
    from .predict import predecir_producto

    creadas = 0
    for inv in Inventario.objects.select_related("producto").all():
        pred = predecir_producto(inv.producto_id, periodo)
        demanda = pred["demanda_predicha"]
        disponible = inv.stock_actual

        motivo = None
        if inv.stock_actual <= inv.stock_minimo:
            motivo = "bajo_stock"
        elif demanda > disponible:
            motivo = "prediccion_demanda"

        if motivo is None:
            continue

        # Evita acumular duplicados: si ya hay una sugerencia pendiente
        # para este producto, no se crea otra.
        if CompraSugerida.objects.filter(
            producto_id=inv.producto_id, estado="pendiente"
        ).exists():
            continue

        objetivo = max(inv.stock_minimo, demanda)
        cantidad = max(objetivo - disponible, 0)
        if cantidad <= 0:
            continue

        CompraSugerida.objects.create(
            producto_id=inv.producto_id,
            cantidad_sugerida=cantidad,
            motivo=motivo,
        )
        creadas += 1
    return creadas
