from rest_framework import serializers
from .models import BitacoraAuditoria


class BitacoraAuditoriaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source="empleado.nombre", read_only=True)

    class Meta:
        model = BitacoraAuditoria
        fields = "__all__"
