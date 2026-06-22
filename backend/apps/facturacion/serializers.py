from rest_framework import serializers
from .models import Factura, Pago


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = "__all__"


class FacturaSerializer(serializers.ModelSerializer):
    pagos = PagoSerializer(many=True, read_only=True)

    class Meta:
        model = Factura
        fields = "__all__"
