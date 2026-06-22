from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("productos", "0002_producto_unidades_por_empaque")]
    operations = [
        migrations.AlterField(
            model_name="producto",
            name="precio_compra",
            field=models.DecimalField(
                max_digits=10, decimal_places=2, null=True, blank=True
            ),
        ),
        migrations.RemoveField(model_name="producto", name="descripcion"),
    ]
