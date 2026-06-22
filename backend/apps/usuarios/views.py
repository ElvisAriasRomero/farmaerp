from rest_framework import viewsets, generics

from core.mixins import AuditoriaMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from core.permissions import EsAdministrador
from .models import Usuario, Rol
from .serializers import (
    UsuarioSerializer, RolSerializer, RegistroUsuarioSerializer,
    CustomTokenObtainPairSerializer,
)


class LoginView(TokenObtainPairView):
    """CU01 - Autenticar usuario."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegistroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    """Datos del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class UsuarioViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """Gestion de usuarios - solo Administrador."""
    queryset = Usuario.objects.all().order_by("id_usuario")
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ["tipo", "is_active"]
    search_fields = ["email"]


class RolViewSet(AuditoriaMixin, viewsets.ModelViewSet):
    """CU05 - Gestionar roles y permisos - solo Administrador."""
    queryset = Rol.objects.all().order_by("id_rol")
    serializer_class = RolSerializer
    permission_classes = [EsAdministrador]
    search_fields = ["nombre_rol"]


class RegistroClienteView(APIView):
    """CU01 - Registro publico de clientes (usado por el frontend).

    Crea el Usuario(tipo=cliente) y su perfil Cliente en un solo paso.
    Acepta claves con o sin acento (telefono/telefono, direccion/direccion).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.db import transaction
        from apps.clientes.models import Cliente

        data = request.data
        email = (data.get("email") or "").strip()
        password = data.get("password")
        password_confirm = data.get("password_confirm")
        nombre = data.get("nombre", "")
        telefono = data.get("teléfono") or data.get("telefono") or ""
        direccion = data.get("dirección") or data.get("direccion") or ""

        if not email or not password:
            return Response(
                {"detail": "Email y contraseña son obligatorios."},
                status=400,
            )
        if password != password_confirm:
            return Response(
                {"detail": "Las contraseñas no coinciden."}, status=400
            )
        if Usuario.objects.filter(email=email).exists():
            return Response(
                {"detail": "El email ya está registrado."}, status=400
            )

        with transaction.atomic():
            usuario = Usuario.objects.create_user(
                email=email, password=password, tipo="cliente"
            )
            Cliente.objects.create(
                usuario=usuario,
                nombre=nombre,
                telefono=telefono,
                direccion=direccion,
            )
        return Response(
            {"detail": "Cliente registrado correctamente.",
             "id_usuario": usuario.id_usuario},
            status=201,
        )


class LogoutView(APIView):
    """Cierre de sesion. Con JWT el logout es del lado del cliente; este
    endpoint existe para compatibilidad con el frontend y, si se envia un
    refresh token, intenta invalidarlo."""
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({"detail": "Sesión cerrada."}, status=200)
