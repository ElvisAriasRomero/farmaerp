from rest_framework.routers import DefaultRouter
from .views import CajaViewSet

router = DefaultRouter()
router.register("cajas", CajaViewSet)
urlpatterns = router.urls
