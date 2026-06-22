"""Crea un superusuario desde variables de entorno si aún no existe.

Pensado para entornos donde no hay acceso a Shell (p.ej. Render Free):
las migraciones y este comando corren al arrancar el contenedor.

Variables de entorno usadas:
    DJANGO_SUPERUSER_EMAIL
    DJANGO_SUPERUSER_PASSWORD

Si no están definidas, no hace nada (no rompe el arranque).
No sobrescribe la contraseña si el usuario ya existe.
"""
import os

from django.core.management.base import BaseCommand

from apps.usuarios.models import Usuario


class Command(BaseCommand):
    help = "Crea un superusuario desde DJANGO_SUPERUSER_EMAIL/PASSWORD si no existe."

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not email or not password:
            self.stdout.write(
                "ensure_superuser: variables no definidas, se omite la creación."
            )
            return

        if Usuario.objects.filter(email=email).exists():
            self.stdout.write(f"ensure_superuser: ya existe {email}, no se modifica.")
            return

        Usuario.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"ensure_superuser: creado {email}"))
