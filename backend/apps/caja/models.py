from django.db import models

from apps.empleados.models import Empleado


class EstadoCaja(models.TextChoices):
    ABIERTA = "abierta", "Abierta"
    CERRADA = "cerrada", "Cerrada"


class Caja(models.Model):
    id_caja = models.AutoField(primary_key=True)
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.PROTECT,
        db_column="id_empleado",
        related_name="cajas",
    )
    fecha_apertura = models.DateTimeField()
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_final = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    total_entradas = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    total_salidas = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    estado = models.CharField(
        max_length=7,
        choices=EstadoCaja.choices,
        default=EstadoCaja.ABIERTA,
    )
    observaciones = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "caja"
        verbose_name = "Caja"
        verbose_name_plural = "Cajas"

    def __str__(self):
        return f"Caja #{self.id_caja}"
