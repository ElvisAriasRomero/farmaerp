from django.contrib import admin
from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("id_cliente", "nombre", "telefono", "estado")
    list_filter = ("estado",)
    search_fields = ("nombre", "telefono")
