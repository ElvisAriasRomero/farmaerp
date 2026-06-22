from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario, Rol


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ("email",)
    list_display = ("email", "tipo", "is_active", "is_staff", "date_joined")
    list_filter = ("tipo", "is_active", "is_staff")
    search_fields = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Tipo", {"fields": ("tipo",)}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "tipo", "password1", "password2", "is_staff", "is_active"),
        }),
    )
    readonly_fields = ("date_joined", "last_login")


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("id_rol", "nombre_rol")
    search_fields = ("nombre_rol",)
