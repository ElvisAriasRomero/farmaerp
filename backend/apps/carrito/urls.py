from rest_framework.routers import DefaultRouter
from .views import CarritoViewSet, DetalleCarritoViewSet

router = DefaultRouter()
router.register("carritos", CarritoViewSet)
router.register("detalle-carritos", DetalleCarritoViewSet)
urlpatterns = router.urls
