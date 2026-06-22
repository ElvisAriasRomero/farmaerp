from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import AuditoriaMixin
from core.permissions import MatrizPermisos, EsEmpleadoOAdmin
from core.mixins import FiltrarPorClienteMixin
from .models import Factura, Pago
from .serializers import FacturaSerializer, PagoSerializer


class FacturaViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU17 - Facturas. Se generan automáticamente desde la venta:
    aquí es de solo lectura + acción 'anular'."""
    queryset = Factura.objects.select_related("venta").prefetch_related("pagos").all().order_by("-id_factura")
    serializer_class = FacturaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "R", "cliente": "R"}
    lookup_cliente = "venta__cliente"
    filterset_fields = ["estado", "venta"]
    search_fields = ["numero_factura"]

    @action(detail=True, methods=["post"], permission_classes=[EsEmpleadoOAdmin])
    def anular(self, request, pk=None):
        factura = self.get_object()
        factura.estado = "anulada"
        factura.save(update_fields=["estado"])
        return Response(self.get_serializer(factura).data)


class PagoViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU16 - Pagos. Se generan automáticamente desde la venta: solo lectura."""
    queryset = Pago.objects.select_related("venta", "factura").all().order_by("-id_pago")
    serializer_class = PagoSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "R", "cliente": "R"}
    lookup_cliente = "venta__cliente"
    filterset_fields = ["estado", "metodo_pago", "venta", "factura"]
