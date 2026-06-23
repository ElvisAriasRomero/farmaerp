from rest_framework import serializers
from .models import Inventario, Lote


class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    stock_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = "__all__"

    def get_stock_disponible(self, obj):
        return obj.stock_actual


class LoteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = Lote
        fields = (
            "id_lote", "producto", "producto_nombre", "numero_lote",
            "cantidad", "fecha_vencimiento", "fecha_ingreso",
            "fecha_creacion", "fecha_actualizacion",
        )
        read_only_fields = ("fecha_ingreso", "fecha_creacion", "fecha_actualizacion")
