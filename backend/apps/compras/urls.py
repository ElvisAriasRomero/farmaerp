from rest_framework.routers import DefaultRouter
from .views import CompraViewSet, DetalleCompraViewSet

router = DefaultRouter()
router.register("compras", CompraViewSet)
router.register("detalle-compras", DetalleCompraViewSet)
urlpatterns = router.urls
