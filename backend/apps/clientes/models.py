from django.db import models

from apps.usuarios.models import Usuario


class EstadoCliente(models.TextChoices):
    ACTIVO = "activo", "Activo"
    INACTIVO = "inactivo", "Inactivo"


class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="cliente",
    )
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    estado = models.CharField(
        max_length=10,
        choices=EstadoCliente.choices,
        default=EstadoCliente.ACTIVO,
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cliente"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return self.nombre
