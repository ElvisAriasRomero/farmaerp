from rest_framework import viewsets

from core.mixins import AuditoriaMixin

from core.permissions import MatrizPermisos
from .models import Proveedor
from .serializers import ProveedorSerializer


class ProveedorViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU06 - Gestionar proveedores."""
    queryset = Proveedor.objects.all().order_by("id_proveedor")
    serializer_class = ProveedorSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU"}
    search_fields = ["nombre", "email"]
