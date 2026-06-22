from django.contrib import admin
from .models import DemandasHistoricas, DatosPrediccion, CompraSugerida


@admin.register(DemandasHistoricas)
class DemandasHistoricasAdmin(admin.ModelAdmin):
    list_display = ("id_demanda", "producto", "fecha", "cantidad_vendida", "precio_promedio")
    list_filter = ("fecha",)


@admin.register(DatosPrediccion)
class DatosPrediccionAdmin(admin.ModelAdmin):
    list_display = ("id_prediccion", "producto", "demanda_predicha", "confianza", "fecha_prediccion", "periodo")
    list_filter = ("periodo",)


@admin.register(CompraSugerida)
class CompraSugeridaAdmin(admin.ModelAdmin):
    list_display = ("id_sugerencia", "producto", "cantidad_sugerida", "motivo", "estado", "fecha_creacion")
    list_filter = ("motivo", "estado")
