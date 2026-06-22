from rest_framework import viewsets

from core.mixins import AuditoriaMixin

from core.permissions import MatrizPermisos
from core.mixins import FiltrarPorClienteMixin
from .models import Cliente
from .serializers import ClienteSerializer


class ClienteViewSet(AuditoriaMixin, FiltrarPorClienteMixin, viewsets.ModelViewSet):
    """CU03 - Gestionar cliente. El cliente solo accede a su propio registro."""
    queryset = Cliente.objects.select_related("usuario").all().order_by("id_cliente")
    serializer_class = ClienteSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    lookup_cliente = None  # filtra por la PK del propio cliente
    filterset_fields = ["estado"]
    search_fields = ["nombre", "telefono"]
