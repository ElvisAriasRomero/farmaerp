from django.contrib import admin
from .models import ReporteGenerado


@admin.register(ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    list_display = ("id_reporte", "tipo", "formato", "empleado", "fecha_generacion", "estado")
    list_filter = ("tipo", "formato")
