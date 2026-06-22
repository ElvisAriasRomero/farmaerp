from rest_framework import serializers
from .models import Inventario


class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    stock_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = "__all__"

    def get_stock_disponible(self, obj):
        return obj.stock_actual
