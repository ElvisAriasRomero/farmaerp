from decimal import Decimal

from rest_framework import viewsets

from core.mixins import AuditoriaMixin
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import MatrizPermisos
from core.mixins import FiltrarPorClienteMixin
from .models import Carrito, DetalleCarrito
from .serializers import CarritoSerializer, DetalleCarritoSerializer


class CarritoViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU12 - Gestionar carrito de compras."""
    queryset = Carrito.objects.select_related("cliente").prefetch_related("detalles").all().order_by("-id_carrito")
    serializer_class = CarritoSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU", "cliente": "CRUD"}
    lookup_cliente = "cliente"
    filterset_fields = ["estado", "cliente"]

    @action(detail=True, methods=["post"])
    def recalcular(self, request, pk=None):
        carrito = self.get_object()
        total = sum((d.subtotal for d in carrito.detalles.all()), Decimal("0"))
        carrito.total_temporal = total
        carrito.save(update_fields=["total_temporal"])
        return Response(self.get_serializer(carrito).data)


class DetalleCarritoViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU13 - Registrar detalle de carrito."""
    queryset = DetalleCarrito.objects.select_related("producto", "carrito").all()
    serializer_class = DetalleCarritoSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU", "cliente": "CRUD"}
    lookup_cliente = "carrito__cliente"
    filterset_fields = ["carrito", "producto"]
