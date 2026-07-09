from django.db import models

from apps.ventas.models import Venta


class EstadoFactura(models.TextChoices):
    EMITIDA = "emitida", "Emitida"
    ANULADA = "anulada", "Anulada"
    PAGADA = "pagada", "Pagada"


class MetodoPago(models.TextChoices):
    EFECTIVO = "efectivo", "Efectivo"
    QR = "qr", "QR"


class EstadoPago(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    COMPLETADO = "completado", "Completado"
    RECHAZADO = "rechazado", "Rechazado"


class Factura(models.Model):
    id_factura = models.AutoField(primary_key=True)
    venta = models.OneToOneField(
        Venta,
        on_delete=models.PROTECT,
        db_column="id_venta",
        related_name="factura",
    )
    numero_factura = models.CharField(max_length=50, unique=True)
    fecha_emision = models.DateField()
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(
        max_length=10,
        choices=EstadoFactura.choices,
        default=EstadoFactura.EMITIDA,
    )
    nit_ci = models.CharField(max_length=30, default="0")
    razon_social = models.CharField(max_length=200, default="S/N")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "factura"
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"

    def __str__(self):
        return self.numero_factura


class Pago(models.Model):
    id_pago = models.AutoField(primary_key=True)
    venta = models.ForeignKey(
        "ventas.Venta",
        on_delete=models.PROTECT,
        db_column="id_venta",
        related_name="pagos",
        null=True,
        blank=True,
    )
    factura = models.ForeignKey(
        Factura,
        on_delete=models.PROTECT,
        db_column="id_factura",
        related_name="pagos",
        null=True,
        blank=True,
    )
    fecha_pago = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=10, choices=MetodoPago.choices)
    estado = models.CharField(
        max_length=10,
        choices=EstadoPago.choices,
        default=EstadoPago.PENDIENTE,
    )
    referencia = models.CharField(max_length=100, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pago"
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"

    def __str__(self):
        return f"Pago #{self.id_pago}"
