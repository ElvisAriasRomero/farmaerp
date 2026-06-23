from rest_framework import viewsets

from core.mixins import AuditoriaMixin
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import MatrizPermisos
from .models import Inventario, Lote
from .serializers import InventarioSerializer, LoteSerializer


class InventarioViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU09 - Gestionar inventario."""
    queryset = Inventario.objects.select_related("producto").all().order_by("id_inventario")
    serializer_class = InventarioSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    search_fields = ["producto__nombre"]

    @action(detail=False, methods=["get"])
    def stock_bajo(self, request):
        from django.db.models import F
        qs = self.get_queryset().filter(stock_actual__lte=F("stock_minimo"))
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class LoteViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """Gestión de lotes por producto (con fecha de vencimiento propia)."""
    queryset = (
        Lote.objects.select_related("producto")
        .all()
        .order_by("producto_id", "fecha_vencimiento", "id_lote")
    )
    serializer_class = LoteSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    filterset_fields = ["producto"]
    search_fields = ["producto__nombre", "numero_lote"]
