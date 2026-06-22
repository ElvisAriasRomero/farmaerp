from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("productos", "0003_producto_costo_opcional_sin_descripcion")]
    operations = [
        migrations.AlterField(
            model_name="producto",
            name="precio_venta",
            field=models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True),
        ),
    ]
