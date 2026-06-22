from rest_framework.routers import DefaultRouter
from .views import FacturaViewSet, PagoViewSet

router = DefaultRouter()
router.register("facturas", FacturaViewSet)
router.register("pagos", PagoViewSet)
urlpatterns = router.urls
