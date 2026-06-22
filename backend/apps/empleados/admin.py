from django.contrib import admin
from .models import Empleado


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("id_empleado", "nombre", "rol", "estado", "fecha_contratacion")
    list_filter = ("estado", "rol")
    search_fields = ("nombre",)
