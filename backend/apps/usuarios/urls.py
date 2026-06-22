from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, RegistroView, MeView, UsuarioViewSet, RolViewSet,
)

router = DefaultRouter()
router.register("usuarios", UsuarioViewSet)
router.register("roles", RolViewSet)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/registro/", RegistroView.as_view(), name="registro"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
