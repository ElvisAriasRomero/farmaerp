from django.contrib import admin
from .models import Compra, DetalleCompra


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 1


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ("id_compra", "proveedor", "fecha_pedido", "estado", "total")
    list_filter = ("estado",)
    inlines = [DetalleCompraInline]


@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    list_display = ("id_detalle_compra", "compra", "producto", "cantidad", "subtotal")
