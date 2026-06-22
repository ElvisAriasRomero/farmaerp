from rest_framework.routers import DefaultRouter
from .views import InventarioViewSet

router = DefaultRouter()
router.register("inventario", InventarioViewSet)
urlpatterns = router.urls
