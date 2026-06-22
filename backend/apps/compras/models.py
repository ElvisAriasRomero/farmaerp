from django.db import models
from django.db.models import F

from apps.proveedores.models import Proveedor
from apps.empleados.models import Empleado
from apps.productos.models import Producto


class EstadoCompra(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    COMPLETADA = "completada", "Completada"
    CANCELADA = "cancelada", "Cancelada"


class Compra(models.Model):
    id_compra = models.AutoField(primary_key=True)
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        db_column="id_proveedor",
        related_name="compras",
    )
    fecha_pedido = models.DateField()
    fecha_recepcion = models.DateField(null=True, blank=True)
    total = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    estado = models.CharField(
        max_length=12,
        choices=EstadoCompra.choices,
        default=EstadoCompra.PENDIENTE,
    )
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.PROTECT,
        db_column="id_empleado",
        related_name="compras",
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "compra"
        verbose_name = "Compra"
        verbose_name_plural = "Compras"

    def __str__(self):
        return f"Compra #{self.id_compra}"


class DetalleCompra(models.Model):
    id_detalle_compra = models.AutoField(primary_key=True)
    compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        db_column="id_compra",
        related_name="detalles",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column="id_producto",
        related_name="detalles_compra",
    )
    unidades_por_paquete = models.PositiveIntegerField(default=1)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    subtotal = models.GeneratedField(
        expression=F("cantidad") * F("precio_unitario"),
        output_field=models.DecimalField(max_digits=12, decimal_places=2),
        db_persist=True,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "detalle_compra"
        verbose_name = "Detalle de compra"
        verbose_name_plural = "Detalles de compra"
