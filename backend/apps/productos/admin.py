from django.contrib import admin
from .models import Categoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("id_categoria", "nombre")
    search_fields = ("nombre",)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("id_producto", "nombre", "categoria", "precio_venta", "fecha_vencimiento")
    list_filter = ("categoria",)
    search_fields = ("nombre", "codigo_barras")
