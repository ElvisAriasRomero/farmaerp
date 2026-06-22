from django.contrib import admin
from .models import Proveedor


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("id_proveedor", "nombre", "email", "telefono")
    search_fields = ("nombre", "email")
