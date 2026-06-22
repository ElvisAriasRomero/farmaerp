from django.db import models


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categoria"
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    foto = models.CharField(max_length=500, null=True, blank=True)
    codigo_barras = models.CharField(
        max_length=100, unique=True, null=True, blank=True
    )
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    unidad_medida = models.CharField(max_length=50, null=True, blank=True)
    unidades_por_empaque = models.PositiveIntegerField(default=1)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        db_column="id_categoria",
        related_name="productos",
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "producto"
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self):
        return self.nombre
