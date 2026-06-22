from rest_framework import serializers
from .models import Compra, DetalleCompra


class DetalleCompraSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = DetalleCompra
        fields = (
            "id_detalle_compra", "producto", "producto_nombre",
            "unidades_por_paquete", "cantidad", "precio_unitario",
            "precio_venta", "subtotal",
        )
        read_only_fields = ("subtotal",)


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)

    class Meta:
        model = Compra
        fields = (
            "id_compra", "proveedor", "proveedor_nombre", "fecha_pedido",
            "fecha_recepcion", "total", "estado", "empleado",
            "detalles", "fecha_creacion", "fecha_actualizacion",
        )
        read_only_fields = ("total",)

    def create(self, validated_data):
        from .services import crear_compra
        detalles = validated_data.pop("detalles", [])
        return crear_compra(validated_data, detalles)
