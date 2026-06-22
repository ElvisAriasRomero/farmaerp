from rest_framework import viewsets

from core.mixins import AuditoriaMixin
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import MatrizPermisos
from .models import Compra, DetalleCompra
from .serializers import CompraSerializer, DetalleCompraSerializer
from .services import recepcionar_compra


class CompraViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU10 - Gestionar compra."""
    queryset = Compra.objects.select_related("proveedor", "empleado").prefetch_related("detalles").all().order_by("-id_compra")
    serializer_class = CompraSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    filterset_fields = ["estado", "proveedor"]

    @action(detail=True, methods=["post"])
    def recepcionar(self, request, pk=None):
        compra = self.get_object()
        recepcionar_compra(compra)
        return Response(self.get_serializer(compra).data)


class DetalleCompraViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU11 - Registrar detalle de compra."""
    queryset = DetalleCompra.objects.select_related("producto", "compra").all()
    serializer_class = DetalleCompraSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    filterset_fields = ["compra", "producto"]
