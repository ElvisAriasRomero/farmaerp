from django.db import models
from django.db.models import F

from apps.clientes.models import Cliente
from apps.productos.models import Producto


class EstadoCarrito(models.TextChoices):
    ABANDONADO = "abandonado", "Abandonado"
    CONVERTIDO_VENTA = "convertido_venta", "Convertido a venta"


class Carrito(models.Model):
    id_carrito = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        db_column="id_cliente",
        related_name="carritos",
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoCarrito.choices,
        default=EstadoCarrito.ABANDONADO,
    )
    total_temporal = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carrito"
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"

    def __str__(self):
        return f"Carrito #{self.id_carrito}"


class DetalleCarrito(models.Model):
    id_detalle_carrito = models.AutoField(primary_key=True)
    carrito = models.ForeignKey(
        Carrito,
        on_delete=models.CASCADE,
        db_column="id_carrito",
        related_name="detalles",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column="id_producto",
        related_name="detalles_carrito",
    )
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.GeneratedField(
        expression=F("cantidad") * F("precio_unitario"),
        output_field=models.DecimalField(max_digits=12, decimal_places=2),
        db_persist=True,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "detalle_carrito"
        verbose_name = "Detalle de carrito"
        verbose_name_plural = "Detalles de carrito"
