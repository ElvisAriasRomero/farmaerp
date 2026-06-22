from rest_framework import serializers
from .models import ReporteGenerado


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source="empleado.nombre", read_only=True)

    class Meta:
        model = ReporteGenerado
        fields = "__all__"
