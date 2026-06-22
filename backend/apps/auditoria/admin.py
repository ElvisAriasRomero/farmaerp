from django.contrib import admin
from .models import BitacoraAuditoria


@admin.register(BitacoraAuditoria)
class BitacoraAuditoriaAdmin(admin.ModelAdmin):
    list_display = ("id_bitacora", "empleado", "tabla_afectada", "tipo_operacion", "fecha_operacion")
    list_filter = ("tipo_operacion", "tabla_afectada")
    readonly_fields = [f.name for f in BitacoraAuditoria._meta.fields]
