from rest_framework import serializers
from .models import Carrito, DetalleCarrito


class DetalleCarritoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = DetalleCarrito
        fields = (
            "id_detalle_carrito", "carrito", "producto", "producto_nombre",
            "cantidad", "precio_unitario", "subtotal",
        )
        read_only_fields = ("subtotal",)


class CarritoSerializer(serializers.ModelSerializer):
    detalles = DetalleCarritoSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)

    class Meta:
        model = Carrito
        fields = (
            "id_carrito", "cliente", "cliente_nombre", "estado",
            "total_temporal", "detalles", "fecha_creacion", "fecha_actualizacion",
        )
        read_only_fields = ("total_temporal",)
