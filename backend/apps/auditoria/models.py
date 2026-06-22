from django.db import models

from apps.empleados.models import Empleado


class TipoOperacion(models.TextChoices):
    INSERT = "INSERT", "Insert"
    UPDATE = "UPDATE", "Update"
    DELETE = "DELETE", "Delete"


class BitacoraAuditoria(models.Model):
    id_bitacora = models.AutoField(primary_key=True)
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.PROTECT,
        db_column="id_empleado",
        related_name="bitacoras",
        null=True,
        blank=True,
    )
    tabla_afectada = models.CharField(max_length=100)
    tipo_operacion = models.CharField(
        max_length=6, choices=TipoOperacion.choices
    )
    fecha_operacion = models.DateField(auto_now_add=True)
    hora_operacion = models.TimeField(auto_now_add=True)
    datos_anteriores = models.JSONField(null=True, blank=True)
    datos_nuevos = models.JSONField(null=True, blank=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bitacora_auditoria"
        verbose_name = "Bitacora de auditoria"
        verbose_name_plural = "Bitacoras de auditoria"

    def __str__(self):
        return f"{self.tabla_afectada} - {self.tipo_operacion}"
