from django.contrib import admin
from .models import Venta, DetalleVenta


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 1


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ("id_venta", "cliente", "empleado", "fecha_venta", "total", "estado")
    list_filter = ("estado",)
    inlines = [DetalleVentaInline]


@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ("id_detalle_venta", "venta", "producto", "cantidad", "subtotal")
