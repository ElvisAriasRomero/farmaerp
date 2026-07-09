from rest_framework import serializers
from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class ProductoSerializer(serializers.ModelSerializer):
    # El frontend envia/lee `id_categoria`; mapea al FK `categoria`.
    id_categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), source="categoria"
    )
    categoria_nombre = serializers.CharField(
        source="categoria.nombre", read_only=True
    )
    stock_actual = serializers.IntegerField(
        source="inventario.stock_actual", read_only=True, default=0
    )
    # La fecha de vencimiento ya no se guarda en Producto: se deriva del lote
    # vigente mas proximo a vencer (FEFO). Solo lectura.
    proximo_vencimiento = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        exclude = ("categoria",)
        # El costo NO se escribe a mano: lo fija la recepcion de la compra.
        read_only_fields = (
            "precio_compra", "precio_venta", "unidades_por_empaque",
        )

    def get_proximo_vencimiento(self, obj):
        lote = (
            obj.lotes.filter(cantidad__gt=0, fecha_vencimiento__isnull=False)
            .order_by("fecha_vencimiento", "id_lote")
            .first()
        )
        return lote.fecha_vencimiento if lote else None

    def validate(self, attrs):
        # El precio de venta no puede ser menor al costo (solo si ya hay costo).
        compra = getattr(self.instance, "precio_compra", None)
        venta = attrs.get("precio_venta", getattr(self.instance, "precio_venta", None))
        if compra is not None and venta is not None and venta < compra:
            raise serializers.ValidationError(
                {"precio_venta": "El precio de venta no puede ser menor al costo."}
            )
        return attrs
