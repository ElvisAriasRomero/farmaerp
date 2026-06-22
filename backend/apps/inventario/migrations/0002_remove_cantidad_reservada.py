from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("inventario", "0001_initial")]
    operations = [
        migrations.RemoveField(
            model_name="inventario",
            name="cantidad_reservada",
        ),
    ]
