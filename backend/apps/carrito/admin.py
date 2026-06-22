from django.contrib import admin
from .models import Carrito, DetalleCarrito


class DetalleCarritoInline(admin.TabularInline):
    model = DetalleCarrito
    extra = 1


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ("id_carrito", "cliente", "estado", "total_temporal")
    list_filter = ("estado",)
    inlines = [DetalleCarritoInline]


@admin.register(DetalleCarrito)
class DetalleCarritoAdmin(admin.ModelAdmin):
    list_display = ("id_detalle_carrito", "carrito", "producto", "cantidad", "subtotal")
