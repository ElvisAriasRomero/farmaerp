from rest_framework import serializers
from .models import (
    DemandasHistoricas, DatosPrediccion, CompraSugerida,
)


class DemandasHistoricasSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = DemandasHistoricas
        fields = "__all__"


class DatosPrediccionSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = DatosPrediccion
        fields = "__all__"


class CompraSugeridaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    stock_actual = serializers.SerializerMethodField()
    stock_minimo = serializers.SerializerMethodField()

    class Meta:
        model = CompraSugerida
        fields = "__all__"

    def _inv(self, obj):
        return getattr(obj.producto, "inventario", None)

    def get_stock_actual(self, obj):
        inv = self._inv(obj)
        return inv.stock_actual if inv else None

    def get_stock_minimo(self, obj):
        inv = self._inv(obj)
        return inv.stock_minimo if inv else None
