from django.db import models


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    email = models.CharField(max_length=120, null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "proveedor"
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"

    def __str__(self):
        return self.nombre
