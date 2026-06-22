from django.db import models

from apps.productos.models import Producto


class Periodo(models.TextChoices):
    DIARIO = "diario", "Diario"
    SEMANAL = "semanal", "Semanal"
    MENSUAL = "mensual", "Mensual"
    TRIMESTRAL = "trimestral", "Trimestral"
    ANUAL = "anual", "Anual"


class MetodoPrediccion(models.TextChoices):
    PROPHET = "prophet", "Modelo Prophet"
    MEDIA_MOVIL = "media_movil", "Promedio movil"
    SIN_DATOS = "sin_datos", "Sin datos"


class MotivoSugerencia(models.TextChoices):
    BAJO_STOCK = "bajo_stock", "Bajo stock"
    PREDICCION_DEMANDA = "prediccion_demanda", "Prediccion de demanda"


class EstadoSugerencia(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    ATENDIDA = "atendida", "Atendida"
    DESCARTADA = "descartada", "Descartada"


class DemandasHistoricas(models.Model):
    id_demanda = models.AutoField(primary_key=True)
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="demandas_historicas",
    )
    fecha = models.DateField()
    cantidad_vendida = models.IntegerField()
    precio_promedio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "demandas_historicas"
        verbose_name = "Demanda historica"
        verbose_name_plural = "Demandas historicas"
        unique_together = ("producto", "fecha")


class DatosPrediccion(models.Model):
    id_prediccion = models.AutoField(primary_key=True)
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="predicciones",
    )
    demanda_predicha = models.IntegerField()
    confianza = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    metodo = models.CharField(
        max_length=12, choices=MetodoPrediccion.choices,
        default=MetodoPrediccion.SIN_DATOS,
    )
    fecha_prediccion = models.DateField()
    periodo = models.CharField(max_length=12, choices=Periodo.choices)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "datos_prediccion"
        verbose_name = "Dato de prediccion"
        verbose_name_plural = "Datos de prediccion"
        unique_together = ("producto", "periodo", "fecha_prediccion")


class CompraSugerida(models.Model):
    id_sugerencia = models.AutoField(primary_key=True)
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="compras_sugeridas",
    )
    cantidad_sugerida = models.IntegerField()
    motivo = models.CharField(max_length=20, choices=MotivoSugerencia.choices)
    estado = models.CharField(
        max_length=12, choices=EstadoSugerencia.choices,
        default=EstadoSugerencia.PENDIENTE,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "compra_sugerida"
        verbose_name = "Compra sugerida"
        verbose_name_plural = "Compras sugeridas"
