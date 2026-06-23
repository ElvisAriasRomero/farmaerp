from django.contrib import admin
from .models import Inventario, Lote


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = ("id_inventario", "producto", "stock_actual", "stock_minimo")
    search_fields = ("producto__nombre",)


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ("id_lote", "producto", "numero_lote", "cantidad",
                    "fecha_vencimiento")
    search_fields = ("producto__nombre", "numero_lote")
    ordering = ("producto_id", "fecha_vencimiento")
