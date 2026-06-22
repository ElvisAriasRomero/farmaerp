from rest_framework import serializers

from apps.empleados.models import Empleado
from .models import Venta, DetalleVenta


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)

    class Meta:
        model = DetalleVenta
        fields = (
            "id_detalle_venta", "producto", "producto_nombre",
            "presentacion", "cantidad", "precio_unitario", "subtotal",
        )
        read_only_fields = ("subtotal",)


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)
    factura_numero = serializers.SerializerMethodField()
    pago = serializers.SerializerMethodField()
    # El vendedor es obligatorio en el panel (la tienda online crea ventas
    # por otra vía que no usa este serializer para validar).
    empleado = serializers.PrimaryKeyRelatedField(
        queryset=Empleado.objects.all(), required=True, allow_null=False,
    )

    class Meta:
        model = Venta
        fields = (
            "id_venta", "cliente", "cliente_nombre", "carrito", "empleado",
            "fecha_venta", "total", "estado", "con_factura", "origen",
            "factura_numero", "pago", "detalles", "fecha_creacion",
            "fecha_actualizacion",
        )
        read_only_fields = ("total",)

    def get_factura_numero(self, obj):
        factura = getattr(obj, "factura", None)
        return factura.numero_factura if factura else None

    def get_pago(self, obj):
        pago = obj.pagos.order_by("-id_pago").first()
        if not pago:
            return None
        return {
            "metodo_pago": pago.metodo_pago,
            "referencia": pago.referencia,
            "estado": pago.estado,
            "monto": str(pago.monto),
        }

    def create(self, validated_data):
        from django.core.exceptions import ValidationError as DjangoValidationError
        from .services import crear_venta
        detalles = validated_data.pop("detalles", [])
        try:
            return crear_venta(validated_data, detalles)
        except DjangoValidationError as exc:
            msg = exc.messages[0] if getattr(exc, "messages", None) else str(exc)
            raise serializers.ValidationError({"detail": msg})
