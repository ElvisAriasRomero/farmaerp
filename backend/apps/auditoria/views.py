from rest_framework import viewsets

from core.permissions import EsAdministrador
from .models import BitacoraAuditoria
from .serializers import BitacoraAuditoriaSerializer


class BitacoraAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """CU18 - Bitacora de auditoria - solo Administrador."""
    queryset = BitacoraAuditoria.objects.select_related("empleado").all().order_by("-id_bitacora")
    serializer_class = BitacoraAuditoriaSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["tipo_operacion", "tabla_afectada", "empleado"]
