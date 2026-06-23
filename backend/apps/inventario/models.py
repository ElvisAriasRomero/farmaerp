from django.db import models

from apps.productos.models import Producto


class Inventario(models.Model):
    id_inventario = models.AutoField(primary_key=True)
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="inventario",
    )
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=10)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventario"
        verbose_name = "Inventario"
        verbose_name_plural = "Inventarios"

    def __str__(self):
        return f"Inventario {self.producto_id}"


class Lote(models.Model):
    """Lote de un producto, con su propia fecha de vencimiento y cantidad.

    Un producto puede tener varios lotes. La venta consume primero el lote que
    vence antes (FEFO); cuando un lote se agota (cantidad llega a 0), la fecha
    de vencimiento del producto se recalcula al siguiente lote vigente.
    """

    id_lote = models.AutoField(primary_key=True)
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="lotes",
    )
    numero_lote = models.CharField(max_length=50, null=True, blank=True)
    # Cantidad restante del lote, en unidades base.
    cantidad = models.IntegerField(default=0)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    fecha_ingreso = models.DateField(auto_now_add=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lote"
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"
        ordering = ["fecha_vencimiento", "id_lote"]

    def __str__(self):
        return f"Lote #{self.id_lote} - producto {self.producto_id}"
