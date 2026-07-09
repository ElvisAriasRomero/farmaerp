from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("productos", "0004_producto_precio_venta_nullable")]
    operations = [
        migrations.RemoveField(
            model_name="producto",
            name="fecha_vencimiento",
        ),
    ]
