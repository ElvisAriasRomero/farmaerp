from django.contrib import admin
from .models import Caja


@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ("id_caja", "empleado", "fecha_apertura", "fecha_cierre", "estado", "saldo_final")
    list_filter = ("estado",)
