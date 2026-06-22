from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models


class TipoUsuario(models.TextChoices):
    CLIENTE = "cliente", "Cliente"
    EMPLEADO = "empleado", "Empleado"


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        usuario = self.model(email=email, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("tipo", TipoUsuario.EMPLEADO)
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    id_usuario = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=254, unique=True)
    tipo = models.CharField(max_length=10, choices=TipoUsuario.choices)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["tipo"]

    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.email


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rol"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre_rol
