from django.db import transaction
from rest_framework import serializers

from apps.usuarios.models import Usuario
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Cliente
        fields = (
            "id_cliente", "usuario", "email", "password",
            "nombre", "telefono", "direccion", "estado",
            "fecha_registro", "fecha_creacion", "fecha_actualizacion",
        )
        read_only_fields = ("usuario", "fecha_registro")

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        if not email or not password:
            raise serializers.ValidationError(
                {"email": "Email y contraseña son obligatorios para crear un cliente."}
            )
        usuario = Usuario.objects.create_user(
            email=email, password=password, tipo="cliente"
        )
        return Cliente.objects.create(usuario=usuario, **validated_data)

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        if email:
            instance.usuario.email = email
        if password:
            instance.usuario.set_password(password)
        if email or password:
            instance.usuario.save()
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["email"] = instance.usuario.email
        return data
