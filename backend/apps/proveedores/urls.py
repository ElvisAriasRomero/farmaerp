from rest_framework.routers import DefaultRouter
from .views import ProveedorViewSet

router = DefaultRouter()
router.register("proveedores", ProveedorViewSet)
urlpatterns = router.urls
