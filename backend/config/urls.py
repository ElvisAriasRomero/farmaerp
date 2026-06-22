"""Rutas raiz del proyecto.

Las rutas estan organizadas para coincidir con el contrato del frontend
(src/services/api.js): prefijos anidados por modulo, p.ej.
    /api/v1/productos/productos/
    /api/v1/usuarios/clientes/
    /api/v1/ventas/facturas/
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Auth
from apps.usuarios.views import (
    LoginView, RegistroView, RegistroClienteView, LogoutView, MeView,
    UsuarioViewSet, RolViewSet,
)
# Perfiles
from apps.clientes.views import ClienteViewSet
from apps.empleados.views import EmpleadoViewSet
from apps.proveedores.views import ProveedorViewSet
# Catalogo / inventario
from apps.productos.views import (
    CategoriaViewSet, ProductoViewSet,
    TiendaProductosView, TiendaCategoriasView,
)
from apps.inventario.views import InventarioViewSet
# Compras
from apps.compras.views import CompraViewSet, DetalleCompraViewSet
# Carrito
from apps.carrito.views import CarritoViewSet, DetalleCarritoViewSet
# Ventas / facturacion
from apps.ventas.views import VentaViewSet, DetalleVentaViewSet, CheckoutView
from apps.facturacion.views import FacturaViewSet, PagoViewSet
# Auditoria / reportes / caja
from apps.auditoria.views import BitacoraAuditoriaViewSet
from apps.reportes.views import ReporteGeneradoViewSet
from apps.caja.views import CajaViewSet
# Prediccion / analitica
from apps.prediccion import views as pred

router = DefaultRouter()

# Usuarios y perfiles
router.register("usuarios/clientes", ClienteViewSet, basename="cliente")
router.register("usuarios/empleados", EmpleadoViewSet, basename="empleado")
router.register("usuarios/roles", RolViewSet, basename="rol")
router.register("usuarios/proveedores", ProveedorViewSet, basename="proveedor")
router.register("usuarios", UsuarioViewSet, basename="usuario")

# Catalogo
router.register("productos/categorias", CategoriaViewSet, basename="categoria")
router.register("productos/productos", ProductoViewSet, basename="producto")

# Inventario
router.register("inventario/inventario", InventarioViewSet, basename="inventario")

# Compras
router.register("compras/compras", CompraViewSet, basename="compra")
router.register("compras/detalle", DetalleCompraViewSet, basename="detalle-compra")

# Carrito
router.register("carrito/detalle", DetalleCarritoViewSet, basename="detalle-carrito")
router.register("carrito", CarritoViewSet, basename="carrito")

# Ventas / facturacion
router.register("ventas/ventas", VentaViewSet, basename="venta")
router.register("ventas/detalle", DetalleVentaViewSet, basename="detalle-venta")
router.register("ventas/facturas", FacturaViewSet, basename="factura")
router.register("ventas/pagos", PagoViewSet, basename="pago")

# Auditoria / reportes / caja
router.register("bitacora", BitacoraAuditoriaViewSet, basename="bitacora")
router.register("reportes", ReporteGeneradoViewSet, basename="reporte")
router.register("caja/movimientos", CajaViewSet, basename="caja")

# Prediccion (CRUD analiticos)
router.register("prediccion/demandas", pred.DemandasHistoricasViewSet, basename="demanda")
router.register("prediccion/predicciones", pred.DatosPrediccionViewSet, basename="prediccion")
router.register("prediccion/sugerencias", pred.CompraSugeridaViewSet, basename="sugerencia")

auth_patterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/register/cliente/", RegistroClienteView.as_view(), name="register_cliente"),
    path("auth/registro/", RegistroView.as_view(), name="registro"),
    path("auth/me/", MeView.as_view(), name="me"),
]

prediccion_extra = [
    # El frontend usa /prediccion/analisis/ como resumen del dashboard
    path("prediccion/analisis/", pred.DashboardView.as_view(), name="pred-analisis"),
    path("prediccion/producto/<int:id_producto>/", pred.PredecirProductoView.as_view()),
    path("prediccion/entrenar/", pred.entrenar_modelos),
    path("prediccion/generar/", pred.generar_predicciones),
    path("prediccion/sugerencias/generar/", pred.generar_sugerencias),
    path("prediccion/pipeline/", pred.ejecutar_pipeline),
    # Dashboard / analitica
    path("dashboard/", pred.DashboardView.as_view(), name="dashboard"),
    path("analitica/kpis/", pred.kpis),
    path("analitica/ventas-diarias/", pred.ventas_diarias),
    path("analitica/ventas-mensuales/", pred.ventas_mensuales),
    path("analitica/top-productos/", pred.top_productos),
    path("analitica/rentabilidad/", pred.rentabilidad),
    path("analitica/alertas-stock/", pred.alertas_stock),
]

# Tienda online (publico) y checkout del cliente
tienda_patterns = [
    path("tienda/productos/", TiendaProductosView.as_view(), name="tienda-productos"),
    path("tienda/categorias/", TiendaCategoriasView.as_view(), name="tienda-categorias"),
    path("ventas/checkout/", CheckoutView.as_view(), name="checkout"),
]

api_v1 = auth_patterns + tienda_patterns + prediccion_extra + [path("", include(router.urls))]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
