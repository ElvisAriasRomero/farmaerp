from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario, Rol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = "__all__"


class UsuarioSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            "id_usuario", "email", "tipo", "nombre", "is_active", "is_staff",
            "is_superuser", "last_login", "date_joined",
        )
        read_only_fields = ("last_login", "date_joined", "is_superuser")

    def get_nombre(self, obj):
        """Nombre del perfil asociado (cliente o empleado), si existe."""
        for rel in ("cliente", "empleado"):
            perfil = getattr(obj, rel, None)
            if perfil is not None and getattr(perfil, "nombre", None):
                return perfil.nombre
        return None


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Usuario
        fields = ("id_usuario", "email", "password", "tipo")

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["tipo"] = user.tipo
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["usuario"] = UsuarioSerializer(self.user).data
        return data
