from rest_framework import viewsets

from core.mixins import AuditoriaMixin

from core.permissions import EsAdministrador
from .models import Empleado
from .serializers import EmpleadoSerializer


class EmpleadoViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU04 - Gestionar empleado - solo Administrador."""
    queryset = Empleado.objects.select_related("usuario", "rol").all().order_by("id_empleado")
    serializer_class = EmpleadoSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["estado", "rol"]
    search_fields = ["nombre"]
