from django.utils import timezone
from rest_framework import serializers
from .models import Caja


class CajaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source="empleado.nombre", read_only=True)

    class Meta:
        model = Caja
        fields = "__all__"
        # Todo se gestiona automático: al abrir solo se piden empleado y saldo_inicial.
        read_only_fields = (
            "estado", "fecha_apertura", "fecha_cierre",
            "total_entradas", "total_salidas", "saldo_final",
        )

    def create(self, validated_data):
        from .services import caja_abierta
        if caja_abierta() is not None:
            raise serializers.ValidationError(
                {"detail": "Ya hay una caja abierta. Ciérrala antes de abrir otra."}
            )
        validated_data["estado"] = "abierta"
        validated_data["fecha_apertura"] = timezone.now()
        validated_data["total_entradas"] = 0
        validated_data["total_salidas"] = 0
        validated_data["saldo_final"] = None
        return super().create(validated_data)
