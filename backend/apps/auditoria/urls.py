from rest_framework.routers import DefaultRouter
from .views import BitacoraAuditoriaViewSet

router = DefaultRouter()
router.register("auditoria", BitacoraAuditoriaViewSet)
urlpatterns = router.urls
