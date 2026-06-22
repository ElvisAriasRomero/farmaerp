from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("compras", "0002_detallecompra_presentacion")]
    operations = [
        migrations.RemoveField(model_name="detallecompra", name="presentacion"),
        migrations.AddField(
            model_name="detallecompra",
            name="unidades_por_paquete",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="detallecompra",
            name="precio_venta",
            field=models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True),
        ),
    ]
