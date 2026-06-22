from django.contrib import admin
from .models import Factura, Pago


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ("id_factura", "numero_factura", "venta", "fecha_emision", "total", "estado")
    list_filter = ("estado",)
    search_fields = ("numero_factura",)


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ("id_pago", "factura", "monto", "metodo_pago", "estado", "fecha_pago")
    list_filter = ("metodo_pago", "estado")
