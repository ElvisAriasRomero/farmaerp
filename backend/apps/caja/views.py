from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import AuditoriaMixin
from core.permissions import MatrizPermisos
from .models import Caja
from .serializers import CajaSerializer
from .services import registrar_salida, cerrar_caja


class CajaViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU23 - Caja. Apertura simple; entradas automáticas (ventas en efectivo),
    registrar salida y cierre con cálculo de saldo."""
    queryset = Caja.objects.select_related("empleado").all().order_by("-id_caja")
    serializer_class = CajaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    filterset_fields = ["estado", "empleado"]

    @action(detail=True, methods=["post"])
    def cerrar(self, request, pk=None):
        caja = self.get_object()
        cerrar_caja(caja)
        return Response(self.get_serializer(caja).data)

    @action(detail=True, methods=["post"])
    def salida(self, request, pk=None):
        from rest_framework import serializers as drf
        caja = self.get_object()
        if caja.estado != "abierta":
            return Response({"detail": "La caja está cerrada."}, status=400)
        try:
            monto = float(request.data.get("monto"))
        except (TypeError, ValueError):
            return Response({"detail": "Monto inválido."}, status=400)
        if monto <= 0:
            return Response({"detail": "El monto debe ser mayor a cero."}, status=400)
        registrar_salida(caja, monto, request.data.get("observacion"))
        return Response(self.get_serializer(caja).data)
