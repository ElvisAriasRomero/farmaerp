from rest_framework import viewsets, generics

from core.mixins import AuditoriaMixin
from rest_framework.permissions import AllowAny

from core.permissions import MatrizPermisos
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer


class CategoriaViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU08 - Gestionar categoria."""
    queryset = Categoria.objects.all().order_by("id_categoria")
    serializer_class = CategoriaSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU", "cliente": "R"}
    search_fields = ["nombre"]


class ProductoViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU07 - Gestionar productos."""
    queryset = Producto.objects.select_related("categoria", "inventario").all().order_by("id_producto")
    serializer_class = ProductoSerializer
    permission_classes = [MatrizPermisos]
    permisos = {"empleado": "CRU", "cliente": "R"}
    filterset_fields = ["categoria"]
    search_fields = ["nombre", "codigo_barras"]


# --------------------------- Catalogo publico (tienda) ---------------------------
# authentication_classes = [] evita que un token JWT viejo/expirado provoque 401
# antes de evaluar AllowAny: estos endpoints son 100% publicos.
class TiendaProductosView(generics.ListAPIView):
    """Catalogo publico de productos para la tienda online (sin autenticacion)."""
    queryset = Producto.objects.select_related("categoria", "inventario").all().order_by("nombre")
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    filterset_fields = ["categoria"]
    search_fields = ["nombre", "codigo_barras"]


class TiendaCategoriasView(generics.ListAPIView):
    """Categorias publicas para filtrar el catalogo de la tienda."""
    queryset = Categoria.objects.all().order_by("nombre")
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
