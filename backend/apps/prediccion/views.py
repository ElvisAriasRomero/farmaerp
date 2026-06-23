from rest_framework import viewsets

from core.mixins import AuditoriaMixin
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import MatrizPermisos, EsAdministrador, EsEmpleadoOAdmin
from .models import (
    DemandasHistoricas, DatosPrediccion, CompraSugerida,
)
from .serializers import (
    DemandasHistoricasSerializer, DatosPrediccionSerializer,
    CompraSugeridaSerializer,
)


# --------------------------- CRUDs analiticos ---------------------------
class DemandasHistoricasViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    queryset = DemandasHistoricas.objects.select_related("producto").all().order_by("-fecha")
    serializer_class = DemandasHistoricasSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "R"}
    filterset_fields = ["producto", "fecha"]


class DatosPrediccionViewSet(viewsets.ReadOnlyModelViewSet):
    """CU19 - Gestionar prediccion de demanda (empleado: solo lectura)."""
    queryset = DatosPrediccion.objects.select_related("producto").all().order_by("-fecha_prediccion")
    serializer_class = DatosPrediccionSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "R"}
    filterset_fields = ["producto", "periodo", "fecha_prediccion"]


class CompraSugeridaViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU20 - Ver sugerencias de compra (empleado: solo lectura)."""
    queryset = CompraSugerida.objects.select_related("producto").all().order_by("-fecha_creacion")
    serializer_class = CompraSugeridaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "RU"}
    filterset_fields = ["producto", "motivo", "estado"]



# --------------------------- Prediccion en vivo ---------------------------
class PredecirProductoView(APIView):
    """Predice la demanda de un producto al vuelo (empleado o admin)."""
    permission_classes = [EsEmpleadoOAdmin]

    # dias que abarca cada periodo (para calcular cobertura)
    DIAS_PERIODO = {"diario": 1, "semanal": 7, "mensual": 30, "trimestral": 90, "anual": 365}

    def get(self, request, id_producto):
        from ml.predict import predecir_producto, pronostico_ventas
        from apps.inventario.models import Inventario

        id_producto = int(id_producto)
        periodo = request.query_params.get("periodo", "semanal")

        # Prediccion del periodo elegido (demanda, confianza, metodo)
        res = predecir_producto(id_producto, periodo)
        res["id_producto"] = id_producto
        res["periodo"] = periodo
        demanda = res.get("demanda_predicha", 0) or 0

        # Pronostico de ventas en varios horizontes ("cuanto se vendera")
        res["pronostico"] = pronostico_ventas(id_producto)
        demanda_diaria = res["pronostico"]["diario"] or 0

        inv = Inventario.objects.filter(producto_id=id_producto).first()
        if not inv:
            res.update({
                "stock_actual": None, "stock_minimo": None, "disponible": None,
                "cobertura_dias": None,
                "recomendacion": {"accion": "sin_inventario", "cantidad": 0,
                                  "mensaje": "El producto no tiene inventario registrado."},
            })
            return Response(res)

        disponible = inv.stock_actual
        res["stock_actual"] = inv.stock_actual
        res["stock_minimo"] = inv.stock_minimo
        res["disponible"] = disponible

        # Cobertura: cuantos dias alcanza el stock actual segun la venta diaria
        cobertura = round(disponible / demanda_diaria, 1) if demanda_diaria > 0 else None
        res["cobertura_dias"] = cobertura

        # Recomendacion basada en la DEMANDA prevista (no solo el minimo),
        # evitando el sobre-stock.
        dias_periodo = self.DIAS_PERIODO.get(periodo, 7)
        if demanda <= 0:
            reco = {"accion": "sin_demanda", "cantidad": 0,
                    "mensaje": "Sin demanda prevista para este periodo. Evita comprar para no acumular sobre-stock."}
        elif disponible >= demanda:
            if cobertura is not None and cobertura > dias_periodo * 2:
                reco = {"accion": "sobrestock", "cantidad": 0,
                        "mensaje": f"Posible sobre-stock: tu inventario cubre ~{int(cobertura)} dias de ventas. No necesitas comprar ahora."}
            else:
                reco = {"accion": "suficiente", "cantidad": 0,
                        "mensaje": "Stock suficiente para cubrir la demanda prevista del periodo."}
        else:
            # falta para cubrir la demanda; el minimo actua como piso de seguridad
            objetivo = max(demanda, inv.stock_minimo)
            cantidad = max(objetivo - disponible, 0)
            reco = {"accion": "comprar", "cantidad": cantidad,
                    "mensaje": f"Compra aproximadamente {cantidad} unidades para cubrir la demanda prevista, sin excederte."}
        res["recomendacion"] = reco
        return Response(res)


# --------------------------- Disparadores (solo Administrador) ---------------------------
# Se ejecutan de forma SINCRONA (sin Celery/Redis): el cliente recibe el
# resultado al instante. La arquitectura sigue soportando Celery para
# produccion a traves de apps/prediccion/tasks.py.
@api_view(["POST"])
@permission_classes([EsAdministrador])
def entrenar_modelos(request):
    from ml.train_model import entrenar_todos
    resumen = entrenar_todos()
    return Response({"detalle": "Modelos entrenados.", "resumen": resumen})


@api_view(["POST"])
@permission_classes([EsAdministrador])
def generar_predicciones(request):
    from ml.predict import generar_y_guardar_predicciones
    periodo = request.data.get("periodo", "semanal")
    n = generar_y_guardar_predicciones(periodo)
    return Response({"detalle": "Predicciones generadas.", "predicciones": n})


@api_view(["POST"])
@permission_classes([EsAdministrador])
def generar_sugerencias(request):
    from ml.analytics import generar_sugerencias_compra
    periodo = request.data.get("periodo", "semanal")
    n = generar_sugerencias_compra(periodo)
    return Response({"detalle": "Sugerencias generadas.", "sugerencias": n})


@api_view(["POST"])
@permission_classes([EsAdministrador])
def ejecutar_pipeline(request):
    from ml.data import consolidar_demanda_historica
    from ml.train_model import entrenar_todos
    from ml.predict import generar_y_guardar_predicciones
    from ml.analytics import generar_sugerencias_compra

    periodo = request.data.get("periodo", "semanal")
    filas = consolidar_demanda_historica()
    resumen = entrenar_todos()
    predicciones = generar_y_guardar_predicciones(periodo)
    sugerencias = generar_sugerencias_compra(periodo)
    return Response({
        "detalle": "Pipeline ejecutado de extremo a extremo.",
        "demanda_filas": filas,
        "entrenamiento": resumen,
        "predicciones": predicciones,
        "sugerencias": sugerencias,
    })


# --------------------------- Dashboard / analitica (empleado o admin) ---------------------------
class DashboardView(APIView):
    permission_classes = [EsEmpleadoOAdmin]

    def get(self, request):
        from ml import analytics
        from apps.caja.services import caja_abierta
        from apps.ventas.models import Venta

        dias = int(request.query_params.get("dias", 30))

        caja = caja_abierta()
        if caja:
            saldo = caja.saldo_inicial + caja.total_entradas - caja.total_salidas
            caja_data = {
                "estado": "abierta",
                "saldo": float(saldo),
                "responsable": caja.empleado.nombre if caja.empleado_id else None,
            }
        else:
            caja_data = {"estado": "cerrada", "saldo": None, "responsable": None}

        reservas_qs = (
            Venta.objects.filter(origen="tienda", estado__in=["reservada", "pagada"])
            .select_related("cliente").order_by("-id_venta")
        )
        reservas = [
            {
                "id_venta": v.id_venta,
                "cliente": v.cliente.nombre if v.cliente_id else "Consumidor final",
                "total": float(v.total),
                "estado": v.estado,
            }
            for v in reservas_qs[:6]
        ]

        return Response({
            "kpis": analytics.kpis_generales(dias),
            "ventas_por_dia": analytics.ventas_por_dia(dias),
            "ventas_por_metodo": analytics.ventas_por_metodo(dias),
            "alertas_stock_bajo": analytics.alertas_stock_bajo(),
            "alertas_vencimiento": analytics.alertas_vencimiento(),
            "caja_actual": caja_data,
            "reservas_pendientes": reservas,
            "reservas_pendientes_total": reservas_qs.count(),
        })


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def kpis(request):
    from ml import analytics
    return Response(analytics.kpis_generales(int(request.query_params.get("dias", 30))))


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def ventas_diarias(request):
    from ml import analytics
    return Response(analytics.ventas_por_dia(int(request.query_params.get("dias", 30))))


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def ventas_mensuales(request):
    from ml import analytics
    return Response(analytics.ventas_por_mes(int(request.query_params.get("meses", 12))))


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def top_productos(request):
    from ml import analytics
    return Response(analytics.productos_mas_vendidos(
        int(request.query_params.get("limite", 10)),
        int(request.query_params.get("dias", 30)),
    ))


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def rentabilidad(request):
    from ml import analytics
    return Response(analytics.rentabilidad_productos(
        int(request.query_params.get("limite", 10))
    ))


@api_view(["GET"])
@permission_classes([EsEmpleadoOAdmin])
def alertas_stock(request):
    from ml import analytics
    return Response(analytics.alertas_stock_bajo())
