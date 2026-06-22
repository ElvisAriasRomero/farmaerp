from django.db import migrations, models


class Migration(migrations.Migration):
    # Encadenada después de 0002_initial para evitar múltiples hojas.
    dependencies = [("compras", "0002_initial")]
    operations = [
        migrations.AddField(
            model_name="detallecompra",
            name="presentacion",
            field=models.CharField(
                max_length=10,
                choices=[("paquete", "Paquete"), ("unidad", "Unidad")],
                default="unidad",
            ),
        ),
    ]
