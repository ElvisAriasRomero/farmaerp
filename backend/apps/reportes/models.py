from django.db import models

from apps.empleados.models import Empleado


class TipoReporte(models.TextChoices):
    VENTAS = "ventas", "Ventas"
    COMPRA = "compra", "Compra"
    INVENTARIO = "inventario", "Inventario"
    AUDITORIA = "auditoria", "Auditoria"
    PREDICCION = "prediccion", "Prediccion"


class FormatoReporte(models.TextChoices):
    PDF = "PDF", "PDF"
    EXCEL = "Excel", "Excel"


class ReporteGenerado(models.Model):
    id_reporte = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=12, choices=TipoReporte.choices)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.PROTECT,
        db_column="id_empleado",
        related_name="reportes",
    )
    formato = models.CharField(max_length=5, choices=FormatoReporte.choices)
    ruta_archivo = models.CharField(max_length=255, null=True, blank=True)
    estado = models.CharField(max_length=50, default="generado")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reporte_generado"
        verbose_name = "Reporte generado"
        verbose_name_plural = "Reportes generados"

    def __str__(self):
        return f"Reporte {self.tipo} #{self.id_reporte}"
