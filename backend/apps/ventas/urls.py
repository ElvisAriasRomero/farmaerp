from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, DetalleVentaViewSet

router = DefaultRouter()
router.register("ventas", VentaViewSet)
router.register("detalle-ventas", DetalleVentaViewSet)
urlpatterns = router.urls
