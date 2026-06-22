from django.db import models
from django.db.models import F

from apps.clientes.models import Cliente
from apps.empleados.models import Empleado
from apps.carrito.models import Carrito
from apps.productos.models import Producto


class EstadoVenta(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    RESERVADA = "reservada", "Reservada"
    PAGADA = "pagada", "Pagada"
    ENTREGADA = "entregada", "Entregada"
    COMPLETADA = "completada", "Completada"
    CANCELADA = "cancelada", "Cancelada"


class OrigenVenta(models.TextChoices):
    MOSTRADOR = "mostrador", "Mostrador"
    TIENDA = "tienda", "Tienda online"


class Venta(models.Model):
    id_venta = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        db_column="id_cliente",
        related_name="ventas",
        null=True,
        blank=True,
    )
    carrito = models.ForeignKey(
        Carrito,
        on_delete=models.SET_NULL,
        db_column="id_carrito",
        related_name="ventas",
        null=True,
        blank=True,
    )
    empleado = models.ForeignKey(
        Empleado,
        on_delete=models.PROTECT,
        db_column="id_empleado",
        related_name="ventas",
        null=True,
        blank=True,
    )
    fecha_venta = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(
        max_length=12,
        choices=EstadoVenta.choices,
        default=EstadoVenta.PENDIENTE,
    )
    con_factura = models.BooleanField(default=False)
    origen = models.CharField(
        max_length=10,
        choices=OrigenVenta.choices,
        default=OrigenVenta.MOSTRADOR,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "venta"
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"

    def __str__(self):
        return f"Venta #{self.id_venta}"


class PresentacionVenta(models.TextChoices):
    PAQUETE = "paquete", "Paquete"
    UNIDAD = "unidad", "Unidad"


class DetalleVenta(models.Model):
    id_detalle_venta = models.AutoField(primary_key=True)
    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        db_column="id_venta",
        related_name="detalles",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column="id_producto",
        related_name="detalles_venta",
    )
    presentacion = models.CharField(
        max_length=10, choices=PresentacionVenta.choices, default=PresentacionVenta.UNIDAD
    )
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.GeneratedField(
        expression=F("cantidad") * F("precio_unitario"),
        output_field=models.DecimalField(max_digits=12, decimal_places=2),
        db_persist=True,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "detalle_venta"
        verbose_name = "Detalle de venta"
        verbose_name_plural = "Detalles de venta"
