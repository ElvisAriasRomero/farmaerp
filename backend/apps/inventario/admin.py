from django.contrib import admin
from .models import Inventario


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = ("id_inventario", "producto", "stock_actual", "stock_minimo")
    search_fields = ("producto__nombre",)
