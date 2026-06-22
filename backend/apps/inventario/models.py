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
