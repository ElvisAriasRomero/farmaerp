from django.db import models

from apps.usuarios.models import Usuario, Rol


class EstadoEmpleado(models.TextChoices):
    ACTIVO = "activo", "Activo"
    VACACIONES = "vacaciones", "Vacaciones"


class Empleado(models.Model):
    id_empleado = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="empleado",
    )
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_contratacion = models.DateField()
    salario = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column="id_rol",
        related_name="empleados",
    )
    estado = models.CharField(
        max_length=10,
        choices=EstadoEmpleado.choices,
        default=EstadoEmpleado.ACTIVO,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "empleado"
        verbose_name = "Empleado"
        verbose_name_plural = "Empleados"

    def __str__(self):
        return self.nombre
